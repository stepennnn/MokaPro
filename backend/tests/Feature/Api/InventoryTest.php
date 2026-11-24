<?php

namespace Tests\Feature\Api;

use App\Exceptions\InsufficientStock;
use App\Exceptions\ReservationExpired;
use App\Models\Order;
use App\Models\Role;
use App\Models\User;
use App\Services\Inventory\RecipeInventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_restock_reference_is_idempotent_and_inventory_reports_exact_quantities(): void
    {
        $this->asAdmin();
        $ingredient = $this->createIngredient('BEANS', 'Coffee beans', '2.000');
        $payload = [
            'reference' => 'DELIVERY-001',
            'items' => [['ingredient_id' => $ingredient['id'], 'quantity' => '12.340']],
        ];

        $this->postJson('/api/admin/restocks', $payload, ['Origin' => 'http://localhost'])
            ->assertCreated();
        $this->postJson('/api/admin/restocks', $payload, ['Origin' => 'http://localhost'])
            ->assertOk();
        $this->postJson('/api/admin/restocks', [
            'reference' => 'DELIVERY-001',
            'items' => [['ingredient_id' => $ingredient['id'], 'quantity' => '50.000']],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/admin/restocks', [
            'reference' => 'DELIVERY-002',
            'items' => [['ingredient_id' => $ingredient['id'], 'quantity' => '0.001']],
        ], ['Origin' => 'http://localhost'])->assertCreated();

        $this->postJson('/api/admin/restocks', [
            'reference' => 'INVALID-DECIMAL',
            'items' => [['ingredient_id' => $ingredient['id'], 'quantity' => '1.2345']],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->getJson('/api/admin/inventory', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.0.actual_quantity', '12.341')
            ->assertJsonPath('data.0.reserved_quantity', '0.000')
            ->assertJsonPath('data.0.available_quantity', '12.341')
            ->assertJsonPath('data.0.minimum_stock', '2.000')
            ->assertJsonPath('data.0.low_stock', false);

        $this->assertDatabaseCount('restocks', 2);
        $this->assertDatabaseCount('stock_movements', 2);
    }

    public function test_reservation_reduces_available_stock_without_changing_actual_stock(): void
    {
        $this->asAdmin();
        [$product, $ingredient, $order] = $this->createOrderWithRecipe('12.340');
        $this->restock($ingredient['id'], '12.340');

        app(RecipeInventoryService::class)->reserveForOrder($order);

        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'actual_quantity' => '12.340',
        ]);
        $this->assertDatabaseHas('stock_reservations', [
            'order_id' => $order->id,
            'ingredient_id' => $ingredient['id'],
            'quantity' => '12.340',
            'status' => 'active',
        ]);
        $this->getJson('/api/admin/inventory', ['Origin' => 'http://localhost'])
            ->assertJsonPath('data.0.actual_quantity', '12.340')
            ->assertJsonPath('data.0.reserved_quantity', '12.340')
            ->assertJsonPath('data.0.available_quantity', '0.000')
            ->assertJsonPath('data.0.low_stock', true)
            ->assertJsonCount(1, 'low_stock');
    }

    public function test_shortage_rejects_all_reservations_for_the_order(): void
    {
        $this->asAdmin();
        [$product, $ingredient, $order, $otherIngredient] = $this->createOrderWithTwoIngredients();
        $this->restock($ingredient['id'], '3.000');

        try {
            app(RecipeInventoryService::class)->reserveForOrder($order);
            $this->fail('The reservation should fail when any recipe ingredient is unavailable.');
        } catch (InsufficientStock $exception) {
            $this->assertSame($otherIngredient['id'], $exception->ingredientId);
        }

        $this->assertDatabaseCount('stock_reservations', 0);
        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'actual_quantity' => '3.000',
        ]);
    }

    public function test_payment_consumption_is_idempotent(): void
    {
        $this->asAdmin();
        [$product, $ingredient, $order] = $this->createOrderWithRecipe('1.000');
        $this->restock($ingredient['id'], '12.340');
        $inventory = app(RecipeInventoryService::class);
        $inventory->reserveForOrder($order);

        $inventory->consumeForPayment($order, 'PAYMENT-001');
        $inventory->consumeForPayment($order, 'PAYMENT-001');

        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'actual_quantity' => '11.340',
        ]);
        $this->assertDatabaseHas('stock_reservations', [
            'order_id' => $order->id,
            'ingredient_id' => $ingredient['id'],
            'status' => 'consumed',
        ]);
        $this->assertDatabaseCount('stock_movements', 2);
    }

    public function test_releasing_reservation_restores_available_stock(): void
    {
        $this->asAdmin();
        [$product, $ingredient, $order] = $this->createOrderWithRecipe('3.000');
        $this->restock($ingredient['id'], '12.340');
        $inventory = app(RecipeInventoryService::class);
        $inventory->reserveForOrder($order);

        $inventory->releaseForOrder($order);
        $inventory->releaseForOrder($order);

        $this->assertDatabaseHas('stock_reservations', [
            'order_id' => $order->id,
            'ingredient_id' => $ingredient['id'],
            'status' => 'released',
        ]);
        $this->getJson('/api/admin/inventory', ['Origin' => 'http://localhost'])
            ->assertJsonPath('data.0.actual_quantity', '12.340')
            ->assertJsonPath('data.0.reserved_quantity', '0.000')
            ->assertJsonPath('data.0.available_quantity', '12.340');
    }

    public function test_expired_reservations_cannot_be_consumed(): void
    {
        $this->asAdmin();
        [$product, $ingredient, $order] = $this->createOrderWithRecipe('1.000');
        $this->restock($ingredient['id'], '12.340');
        $inventory = app(RecipeInventoryService::class);
        $inventory->reserveForOrder($order);
        DB::table('stock_reservations')
            ->where('order_id', $order->id)
            ->update(['expires_at' => now()->subSecond()]);

        try {
            $inventory->consumeForPayment($order, 'PAYMENT-EXPIRED');
            $this->fail('Expired reservations must not be consumed.');
        } catch (ReservationExpired) {
            $this->assertDatabaseHas('ingredients', [
                'id' => $ingredient['id'],
                'actual_quantity' => '12.340',
            ]);
            $this->assertDatabaseCount('stock_movements', 1);
        }
    }

    public function test_ingredient_base_unit_cannot_change_after_a_stock_movement(): void
    {
        $this->asAdmin();
        $ingredient = $this->createIngredient('MILK', 'Milk', '1.000');
        $this->restock($ingredient['id'], '12.340');

        $this->patchJson('/api/admin/ingredients/'.$ingredient['id'], [
            'unit' => 'g',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('unit');

        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'unit' => 'ml',
        ]);
    }

    public function test_inventory_reads_and_restocks_are_admin_only(): void
    {
        $this->asRole('cashier');

        $this->getJson('/api/admin/inventory', ['Origin' => 'http://localhost'])->assertForbidden();
        $this->postJson('/api/admin/restocks', [
            'reference' => 'CASHIER-RESTOCK',
            'items' => [],
        ], ['Origin' => 'http://localhost'])->assertForbidden();
    }

    public function test_concurrent_orders_cannot_reserve_the_same_last_stock_on_mysql(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('The reservation race requires MySQL/InnoDB.');
        }

        $this->asAdmin();
        [$product, $ingredient, $firstOrder] = $this->createOrderWithRecipe('1.000');
        $secondOrder = $this->createOrder($product['id'], 1);
        $this->restock($ingredient['id'], '1.000');
        DB::connection()->commit();

        $script = <<<'PHP'
require getcwd().'/vendor/autoload.php';
$app = require getcwd().'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$order = App\Models\Order::query()->findOrFail((int) getenv('MOKAPRO_TEST_ORDER_ID'));
try {
    $app->make(App\Services\Inventory\RecipeInventoryService::class)->reserveForOrder($order);
    echo 'reserved';
    exit(0);
} catch (App\Exceptions\InsufficientStock) {
    echo 'shortage';
    exit(2);
}
PHP;

        $processes = [];
        foreach ([$firstOrder, $secondOrder] as $order) {
            $process = new Process(
                [PHP_BINARY, '-r', $script],
                base_path(),
                ['MOKAPRO_TEST_ORDER_ID' => (string) $order->id],
                null,
                30,
            );
            $process->start();
            $processes[] = $process;
        }

        $outcomes = [];
        foreach ($processes as $process) {
            $process->wait();
            $outcomes[] = [$process->getExitCode(), trim($process->getOutput())];
            $this->assertSame('', trim($process->getErrorOutput()));
        }

        $this->assertEqualsCanonicalizing([[0, 'reserved'], [2, 'shortage']], $outcomes);
        $this->assertDatabaseCount('stock_reservations', 1);
        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'actual_quantity' => '1.000',
        ]);
    }

    private function createOrderWithRecipe(string $quantity): array
    {
        $product = $this->createProduct('LATTE', 'Latte');
        $ingredient = $this->createIngredient('MILK', 'Milk', '0.000');
        $this->createRecipe($product['id'], [[$ingredient['id'], $quantity]]);

        return [$product, $ingredient, $this->createOrder($product['id'], 1)];
    }

    private function createOrderWithTwoIngredients(): array
    {
        $product = $this->createProduct('LATTE', 'Latte');
        $firstIngredient = $this->createIngredient('MILK', 'Milk', '0.000');
        $secondIngredient = $this->createIngredient('BEANS', 'Beans', '0.000');
        $this->createRecipe($product['id'], [
            [$firstIngredient['id'], '1.000'],
            [$secondIngredient['id'], '1.000'],
        ]);

        return [
            $product,
            $firstIngredient,
            $this->createOrder($product['id'], 3),
            $secondIngredient,
        ];
    }

    private function createProduct(string $code, string $name): array
    {
        $category = $this->postJson('/api/admin/categories', [
            'name' => $code.' Category',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        return $this->postJson('/api/admin/products', [
            'code' => $code,
            'name' => $name,
            'category_id' => $category['id'],
            'price' => '4.50',
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');
    }

    private function createIngredient(string $code, string $name, string $minimumStock): array
    {
        return $this->postJson('/api/admin/ingredients', [
            'code' => $code,
            'name' => $name,
            'unit' => 'ml',
            'minimum_stock' => $minimumStock,
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');
    }

    /**
     * @param  array<int, array{0: int, 1: string}>  $items
     */
    private function createRecipe(int $productId, array $items): void
    {
        $this->postJson('/api/admin/products/'.$productId.'/recipes', [
            'ingredients' => array_map(
                fn (array $item): array => ['ingredient_id' => $item[0], 'quantity' => $item[1]],
                $items,
            ),
        ], ['Origin' => 'http://localhost'])->assertCreated();
    }

    private function createOrder(int $productId, int $quantity): Order
    {
        $order = Order::query()->create([
            'order_number' => 'TEST-'.Str::uuid(),
            'type' => 'takeaway',
            'table_number' => null,
            'subtotal' => '4.50',
            'tax' => '0.45',
            'total' => '4.95',
            'payment_method' => 'cash',
        ]);
        $order->items()->create([
            'product_id' => $productId,
            'quantity' => $quantity,
            'price' => '4.50',
        ]);

        return $order->fresh('items.product.activeRecipe.recipeIngredients');
    }

    private function restock(int $ingredientId, string $quantity): void
    {
        $this->postJson('/api/admin/restocks', [
            'reference' => 'RESTOCK-'.Str::uuid(),
            'items' => [['ingredient_id' => $ingredientId, 'quantity' => $quantity]],
        ], ['Origin' => 'http://localhost'])->assertCreated();
    }

    private function asAdmin(): static
    {
        return $this->asRole('admin');
    }

    private function asRole(string $role): static
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());

        return $this->actingAs($employee->fresh())
            ->withSession(['active_role' => $role]);
    }
}
