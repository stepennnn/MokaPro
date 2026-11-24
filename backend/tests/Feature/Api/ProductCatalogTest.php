<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_and_category_reads_require_authentication(): void
    {
        $this->getJson('/api/products', ['Origin' => 'http://localhost'])->assertUnauthorized();
        $this->getJson('/api/categories', ['Origin' => 'http://localhost'])->assertUnauthorized();
    }

    public function test_cashiers_and_admins_read_only_active_products_with_category_data(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Coffee');
        $this->createCategory('Seasonal', false);
        $activeProduct = $this->createProduct('LATTE', 'Latte', $category['id'], '4.50');
        $this->createProduct('HIDDEN', 'Hidden Product', $category['id'], '2.00', false);

        $expectedProducts = [
            'data' => [[
                'id' => $activeProduct['id'],
                'code' => 'LATTE',
                'name' => 'Latte',
                'category' => ['id' => $category['id'], 'name' => 'Coffee'],
                'price' => '4.50',
                'active' => true,
                'image_url' => null,
                'active_recipe' => null,
                'modifiers' => [],
            ]],
        ];

        $this->asRole('cashier')
            ->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertExactJson($expectedProducts);

        $this->asRole('admin')
            ->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertExactJson($expectedProducts);

        $this->asRole('admin')
            ->getJson('/api/categories', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Coffee');
    }

    public function test_legacy_category_strings_are_preserved_and_products_receive_stable_legacy_codes(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Legacy Coffee');
        $product = $this->createProduct('TEMP-CODE', 'Legacy Latte', $category['id'], '4.50');
        $migrationPaths = glob(database_path('migrations/*_backfill_legacy_product_catalog_data.php'));
        $this->assertNotEmpty($migrationPaths);

        $migration = require $migrationPaths[0];
        $migration->up();

        $storedProduct = DB::table('products')->where('id', $product['id'])->first();

        $this->assertSame('Legacy Coffee', $storedProduct->category);
        $this->assertSame('LEGACY-'.$product['id'], $storedProduct->code);
        $this->assertSame($category['id'], $storedProduct->category_id);
    }

    public function test_catalog_writes_are_admin_only(): void
    {
        $this->asRole('cashier')
            ->postJson('/api/admin/categories', ['name' => 'Coffee'], ['Origin' => 'http://localhost'])
            ->assertForbidden();

        $this->asRole('barista')
            ->postJson('/api/admin/products', [
                'code' => 'LATTE',
                'name' => 'Latte',
                'category_id' => 1,
                'price' => '4.50',
            ], ['Origin' => 'http://localhost'])
            ->assertForbidden();
    }

    public function test_product_price_requires_a_unique_code_and_decimal_string_but_accepts_zero(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Coffee');
        $zeroProduct = $this->createProduct('ZERO', 'Free Sample', $category['id'], '0.00');

        $this->postJson('/api/admin/products', [
            'code' => 'ZERO',
            'name' => 'Duplicate Code',
            'category_id' => $category['id'],
            'price' => '1.00',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/admin/products', [
            'code' => 'NEGATIVE',
            'name' => 'Negative Price',
            'category_id' => $category['id'],
            'price' => '-1.00',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/admin/products', [
            'code' => 'FLOAT',
            'name' => 'Floating Point Price',
            'category_id' => $category['id'],
            'price' => 1.25,
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertSame('0.00', $zeroProduct['price']);
    }

    public function test_products_cannot_be_assigned_to_inactive_categories(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Seasonal', false);

        $this->postJson('/api/admin/products', [
            'code' => 'SEASONAL',
            'name' => 'Seasonal Drink',
            'category_id' => $category['id'],
            'price' => '4.50',
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->assertDatabaseMissing('products', ['code' => 'SEASONAL']);
    }

    public function test_admin_can_update_products_and_categories_without_losing_legacy_category_data(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Coffee');
        $product = $this->createProduct('LATTE', 'Latte', $category['id'], '4.50');

        $this->patchJson('/api/admin/products/'.$product['id'], [
            'price' => '5.00',
            'active' => false,
        ], ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.price', '5.00')
            ->assertJsonPath('data.active', false);

        $this->patchJson('/api/admin/categories/'.$category['id'], [
            'name' => 'Hot Drinks',
        ], ['Origin' => 'http://localhost'])->assertOk();

        $this->assertDatabaseHas('products', [
            'id' => $product['id'],
            'category' => 'Hot Drinks',
        ]);
    }

    public function test_category_with_products_has_no_delete_endpoint(): void
    {
        $this->asRole('admin');
        $category = $this->createCategory('Coffee');
        $this->createProduct('LATTE', 'Latte', $category['id'], '4.50');

        $this->deleteJson('/api/admin/categories/'.$category['id'], [], ['Origin' => 'http://localhost'])
            ->assertMethodNotAllowed();

        $this->assertDatabaseHas('categories', ['id' => $category['id'], 'name' => 'Coffee']);
    }

    public function test_product_seeder_populates_normalized_catalog_idempotently(): void
    {
        $this->seed(ProductSeeder::class);
        $this->seed(ProductSeeder::class);

        $this->assertDatabaseCount('products', 6);
        $this->assertDatabaseCount('categories', 4);
        $this->assertDatabaseHas('products', [
            'code' => 'SEED-ESPRESSO-DOUBLE',
            'category' => 'Espresso Based',
        ]);
    }

    private function createCategory(string $name, bool $active = true): array
    {
        return $this->postJson('/api/admin/categories', [
            'name' => $name,
            'active' => $active,
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->json('data');
    }

    private function createProduct(
        string $code,
        string $name,
        int $categoryId,
        string $price,
        bool $active = true,
    ): array {
        return $this->postJson('/api/admin/products', [
            'code' => $code,
            'name' => $name,
            'category_id' => $categoryId,
            'price' => $price,
            'active' => $active,
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->json('data');
    }

    private function asRole(string $role): static
    {
        $employee = User::factory()->create();
        $employee->roles()->attach(Role::query()->where('code', $role)->firstOrFail());

        return $this->actingAs($employee->fresh())
            ->withSession(['active_role' => $role]);
    }
}
