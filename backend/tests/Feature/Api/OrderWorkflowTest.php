<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_e2e_workflow_with_recipe_modifiers_tax_kds_table_shift_and_reports(): void
    {
        config(['mokapro.tax_rate' => '0.1100']);

        // 1. Admin creates category, products, ingredient, restock, recipe, and modifiers
        $this->asRole('admin');
        $category = $this->postJson('/api/admin/categories', [
            'name' => 'Espresso Based',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $latte = $this->postJson('/api/admin/products', [
            'code' => 'LATTE-01',
            'name' => 'Caffe Latte',
            'category_id' => $category['id'],
            'price' => '28000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $croissant = $this->postJson('/api/admin/products', [
            'code' => 'CROISSANT-01',
            'name' => 'Butter Croissant',
            'category_id' => $category['id'],
            'price' => '24000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $beans = $this->postJson('/api/admin/ingredients', [
            'code' => 'BEANS-01',
            'name' => 'Biji Kopi',
            'unit' => 'g',
            'minimum_stock' => '20.000',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $this->postJson('/api/admin/restocks', [
            'reference' => 'INIT-001',
            'items' => [
                ['ingredient_id' => $beans['id'], 'quantity' => '50.000'],
            ],
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $this->postJson('/api/admin/products/'.$latte['id'].'/recipes', [
            'ingredients' => [
                ['ingredient_id' => $beans['id'], 'quantity' => '18.000'],
            ],
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $this->getJson('/api/admin/products/'.$latte['id'].'/recipe', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.ingredients.0.quantity', '18.000');

        $iceModifier = $this->postJson('/api/admin/modifiers', [
            'code' => 'ICE-LEVEL',
            'name' => 'Opsi Es',
            'type' => 'choice',
            'value' => 'Es Normal, Sedikit Es, Tanpa Es',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $unassignedModifier = $this->postJson('/api/admin/modifiers', [
            'code' => 'WARM-UP',
            'name' => 'Hangatkan',
            'type' => 'boolean',
            'value' => 'Ya',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $this->getJson('/api/admin/modifiers', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->putJson('/api/admin/products/'.$latte['id'].'/modifiers', [
            'modifier_ids' => [$iceModifier['id']],
        ], ['Origin' => 'http://localhost'])->assertOk();

        // 2. Cashier checks config tax_rate, opens shift, and submits mixed cart (recipe + non-recipe) with modifier
        $this->asRole('cashier');
        $this->getJson('/api/config', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('tax_rate', '0.1100');

        $this->postJson('/api/shifts/open', [
            'opening_float' => '500000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated();

        // Rejects modifier that is not assigned to the product
        $this->postJson('/api/orders', [
            'type' => 'Dine-In',
            'table_number' => 'Meja 01',
            'seats' => 2,
            'payment_method' => 'cash',
            'items' => [
                [
                    'id' => $latte['id'],
                    'quantity' => 1,
                    'modifier_ids' => [$unassignedModifier['id']],
                ],
            ],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        // Valid mixed-cart checkout: 2x Latte (56000) + 1x Croissant without recipe (24000) = 80000 subtotal
        // Tax @ 11% = 8800.00, Total = 88800.00
        $orderResponse = $this->postJson('/api/orders', [
            'type' => 'Dine-In',
            'table_number' => 'Meja 01',
            'seats' => 2,
            'payment_method' => 'cash',
            'items' => [
                [
                    'id' => $latte['id'],
                    'quantity' => 2,
                    'notes' => 'Opsi Es: Sedikit Es',
                    'modifier_ids' => [$iceModifier['id']],
                ],
                [
                    'id' => $croissant['id'],
                    'quantity' => 1,
                    'notes' => null,
                ],
            ],
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $order = $orderResponse->json('data');
        $this->assertSame('80000.00', $order['subtotal']);
        $this->assertSame('8800.00', $order['tax']);
        $this->assertSame('88800.00', $order['total']);
        $this->assertSame('Menunggu', $order['status']);
        $this->assertSame(2, $order['seats']);

        // Stock deducted even in mixed cart: 50.000 - (18.000 * 2) = 14.000 (now low stock <= 20.000)
        $this->assertDatabaseHas('ingredients', [
            'id' => $beans['id'],
            'actual_quantity' => '14.000',
        ]);

        // Double-booking Meja 01 while order is active must be rejected with 422
        $this->postJson('/api/orders', [
            'type' => 'Dine-In',
            'table_number' => 'Meja 01',
            'seats' => 2,
            'payment_method' => 'qris',
            'items' => [
                ['id' => $croissant['id'], 'quantity' => 1],
            ],
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('table_number');

        // Ordering Latte again must fail cleanly with 422 because only 14g left (needs 18g)
        $this->postJson('/api/orders', [
            'type' => 'Takeaway',
            'payment_method' => 'qris',
            'items' => [
                ['id' => $latte['id'], 'quantity' => 1],
            ],
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonPath('ingredient_id', $beans['id']);

        // Meja 01 is currently occupied
        $tables = $this->getJson('/api/tables', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->json('data');
        $meja01 = collect($tables)->firstWhere('name', 'Meja 01');
        $this->assertFalse($meja01['available']);

        // History endpoint lists the single valid order
        $this->getJson('/api/orders', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', $order['order_number']);

        // 3. Barista processes KDS queue: Menunggu -> Diproses -> Selesai
        $this->asRole('barista');
        $this->getJson('/api/kds/orders', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'Menunggu');

        $this->patchJson('/api/orders/'.$order['id'].'/status', [
            'status' => 'Diproses',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.status', 'Diproses');

        $this->patchJson('/api/orders/'.$order['id'].'/status', [
            'status' => 'Selesai',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.status', 'Selesai');

        // 4. Cashier sees Meja 01 free again & closes shift
        $this->asRole('cashier');
        $tablesAfter = $this->getJson('/api/tables', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->json('data');
        $meja01After = collect($tablesAfter)->firstWhere('name', 'Meja 01');
        $this->assertTrue($meja01After['available']);

        // 5. Admin verifies reports
        $this->asRole('admin');
        $this->getJson('/api/admin/reports', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.total_orders', 1)
            ->assertJsonPath('data.total_sales', '88800.00')
            ->assertJsonPath('data.active_kds_orders', 0)
            ->assertJsonPath('data.low_stock_count', 1)
            ->assertJsonPath('data.top_product.name', 'Caffe Latte')
            ->assertJsonPath('data.top_product.quantity', 2);
    }

    public function test_admin_can_create_order_and_close_shift_is_cashier_only(): void
    {
        $this->asRole('admin');
        $category = $this->postJson('/api/admin/categories', [
            'name' => 'Pastry',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $product = $this->postJson('/api/admin/products', [
            'code' => 'CROISSANT-01',
            'name' => 'Butter Croissant',
            'category_id' => $category['id'],
            'price' => '24000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $this->postJson('/api/orders', [
            'type' => 'Takeaway',
            'payment_method' => 'qris',
            'items' => [
                ['id' => $product['id'], 'quantity' => 1],
            ],
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->assertJsonPath('data.total', '26400.00');

        $this->postJson('/api/shifts/close', [], ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    public function test_cashier_can_close_open_shift_with_sales_summary(): void
    {
        $this->asRole('admin');
        $category = $this->postJson('/api/admin/categories', [
            'name' => 'Coffee',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $product = $this->postJson('/api/admin/products', [
            'code' => 'ESP-01',
            'name' => 'Espresso',
            'category_id' => $category['id'],
            'price' => '20000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $this->asRole('cashier');
        $this->postJson('/api/shifts/open', [
            'opening_float' => '250000.00',
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $this->postJson('/api/orders', [
            'type' => 'Takeaway',
            'payment_method' => 'cash',
            'items' => [
                ['id' => $product['id'], 'quantity' => 1],
            ],
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $this->postJson('/api/shifts/close', [
            'closing_cash' => '272000.00',
            'note' => 'Shift pagi selesai',
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.closing_cash', '272000.00')
            ->assertJsonPath('data.summary.expected_cash', '272000.00');

        $this->getJson('/api/shifts/current', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    private function asRole(string $role): User
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());
        $this->actingAs($employee->fresh())->withSession(['active_role' => $role]);

        return $employee;
    }
}
