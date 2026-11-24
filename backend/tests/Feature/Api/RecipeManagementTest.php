<?php

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecipeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_immutable_recipe_versions_for_a_product(): void
    {
        $this->asAdmin();
        $product = $this->createProduct('LATTE', 'Latte');
        $ingredient = $this->createIngredient('MILK', 'Milk');

        $firstRecipe = $this->createRecipe($product['id'], $ingredient['id'], '150.000');
        $secondRecipe = $this->createRecipe($product['id'], $ingredient['id'], '160.000');

        $this->assertSame(1, $firstRecipe['version']);
        $this->assertSame(2, $secondRecipe['version']);
        $this->assertDatabaseHas('products', [
            'id' => $product['id'],
            'active_recipe_id' => $secondRecipe['id'],
        ]);
        $this->assertDatabaseHas('recipe_ingredients', [
            'recipe_id' => $secondRecipe['id'],
            'ingredient_id' => $ingredient['id'],
            'quantity' => '160.000',
        ]);
        $this->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonPath('data.0.active_recipe.version', 2);
    }

    public function test_recipes_reject_empty_or_invalid_ingredient_quantities(): void
    {
        $this->asAdmin();
        $product = $this->createProduct('LATTE', 'Latte');
        $ingredient = $this->createIngredient('MILK', 'Milk');

        $this->postJson('/api/admin/products/'.$product['id'].'/recipes', [
            'ingredients' => [],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/admin/products/'.$product['id'].'/recipes', [
            'ingredients' => [['ingredient_id' => $ingredient['id'], 'quantity' => '0.000']],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->postJson('/api/admin/products/'.$product['id'].'/recipes', [
            'ingredients' => [['ingredient_id' => $ingredient['id'], 'quantity' => 1.5]],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $inactiveIngredient = $this->createIngredient('OLD-MILK', 'Inactive Milk', false);
        $this->postJson('/api/admin/products/'.$product['id'].'/recipes', [
            'ingredients' => [['ingredient_id' => $inactiveIngredient['id'], 'quantity' => '1.000']],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();

        $this->getJson('/api/admin/ingredients', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'MILK');

        $this->assertDatabaseCount('recipes', 0);
    }

    public function test_ingredient_base_unit_cannot_change_after_a_recipe_references_it(): void
    {
        $this->asAdmin();
        $product = $this->createProduct('LATTE', 'Latte');
        $ingredient = $this->createIngredient('MILK', 'Milk');
        $this->createRecipe($product['id'], $ingredient['id'], '150.000');

        $this->patchJson('/api/admin/ingredients/'.$ingredient['id'], [
            'unit' => 'pcs',
        ], ['Origin' => 'http://localhost'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('unit');

        $this->assertDatabaseHas('ingredients', [
            'id' => $ingredient['id'],
            'unit' => 'ml',
        ]);
    }

    public function test_modifiers_are_non_priced_and_scoped_to_the_assigned_product(): void
    {
        $this->asAdmin();
        $product = $this->createProduct('LATTE', 'Latte');
        $otherProduct = $this->createProduct('MATCHA', 'Matcha');
        $modifier = $this->postJson('/api/admin/modifiers', [
            'code' => 'LESS-SUGAR',
            'name' => 'Less sugar',
            'type' => 'choice',
            'value' => 'less',
        ], ['Origin' => 'http://localhost'])
            ->assertCreated()
            ->assertJsonMissingPath('data.price')
            ->json('data');

        $this->putJson('/api/admin/products/'.$product['id'].'/modifiers', [
            'modifier_ids' => [$modifier['id']],
        ], ['Origin' => 'http://localhost'])->assertOk();

        $products = $this->getJson('/api/products', ['Origin' => 'http://localhost'])
            ->assertOk()
            ->json('data');

        $this->assertSame([$modifier['id']], array_column($products[0]['modifiers'], 'id'));
        $this->assertSame([], $products[1]['modifiers']);
        $this->assertNull($products[0]['active_recipe']);

        $this->patchJson('/api/admin/modifiers/'.$modifier['id'], [
            'active' => false,
        ], ['Origin' => 'http://localhost'])->assertOk();

        $inactiveModifier = $this->postJson('/api/admin/modifiers', [
            'code' => 'OLD-SUGAR',
            'name' => 'Old sugar option',
            'type' => 'choice',
            'value' => 'old',
            'active' => false,
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');

        $this->putJson('/api/admin/products/'.$otherProduct['id'].'/modifiers', [
            'modifier_ids' => [$inactiveModifier['id']],
        ], ['Origin' => 'http://localhost'])->assertUnprocessable();
    }

    public function test_recipe_and_modifier_writes_are_admin_only(): void
    {
        $this->asAdmin();
        $product = $this->createProduct('LATTE', 'Latte');
        $this->asRole('cashier');

        $this->postJson('/api/admin/products/'.$product['id'].'/recipes', [
            'ingredients' => [],
        ], ['Origin' => 'http://localhost'])->assertForbidden();

        $this->postJson('/api/admin/modifiers', [
            'code' => 'LESS-SUGAR',
            'name' => 'Less sugar',
            'type' => 'choice',
            'value' => 'less',
        ], ['Origin' => 'http://localhost'])->assertForbidden();

        $this->getJson('/api/admin/ingredients', ['Origin' => 'http://localhost'])->assertForbidden();
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

    private function createIngredient(string $code, string $name, bool $active = true): array
    {
        return $this->postJson('/api/admin/ingredients', [
            'code' => $code,
            'name' => $name,
            'unit' => 'ml',
            'minimum_stock' => '0.000',
            'active' => $active,
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');
    }

    private function createRecipe(int $productId, int $ingredientId, string $quantity): array
    {
        return $this->postJson('/api/admin/products/'.$productId.'/recipes', [
            'ingredients' => [[
                'ingredient_id' => $ingredientId,
                'quantity' => $quantity,
            ]],
        ], ['Origin' => 'http://localhost'])->assertCreated()->json('data');
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
