<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SaveIngredientRequest;
use App\Http\Requests\Api\SaveModifierRequest;
use App\Http\Requests\Api\SaveRecipeRequest;
use App\Models\Ingredient;
use App\Models\Modifier;
use App\Models\Product;
use App\Models\Recipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RecipeController extends Controller
{
    public function ingredientsIndex(): JsonResponse
    {
        $ingredients = Ingredient::query()
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'unit', 'minimum_stock', 'active']);

        return response()->json(['data' => $ingredients]);
    }

    public function storeIngredient(SaveIngredientRequest $request): JsonResponse
    {
        $data = $request->validated();
        $ingredient = Ingredient::query()->create([
            ...$data,
            'active' => $data['active'] ?? true,
        ]);

        return response()->json(['data' => $this->ingredientData($ingredient)], 201);
    }

    public function updateIngredient(SaveIngredientRequest $request, Ingredient $ingredient): JsonResponse
    {
        $data = $request->validated();
        $ingredient = DB::transaction(function () use ($ingredient, $data): Ingredient {
            $ingredient = Ingredient::query()->lockForUpdate()->findOrFail($ingredient->id);

            if (
                isset($data['unit'])
                && $data['unit'] !== $ingredient->unit
                && $ingredient->recipeIngredients()->exists()
            ) {
                throw ValidationException::withMessages([
                    'unit' => 'The base unit cannot change after this ingredient is used in a recipe.',
                ]);
            }

            $ingredient->fill($data)->save();

            return $ingredient;
        });

        return response()->json(['data' => $this->ingredientData($ingredient)]);
    }

    public function storeModifier(SaveModifierRequest $request): JsonResponse
    {
        $data = $request->validated();
        $modifier = Modifier::query()->create([
            ...$data,
            'active' => $data['active'] ?? true,
        ]);

        return response()->json(['data' => $this->modifierData($modifier)], 201);
    }

    public function updateModifier(SaveModifierRequest $request, Modifier $modifier): JsonResponse
    {
        $modifier->fill($request->validated())->save();

        return response()->json(['data' => $this->modifierData($modifier)]);
    }

    public function syncProductModifiers(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'modifier_ids' => ['present', 'array'],
            'modifier_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('modifiers', 'id')->where('active', true),
            ],
        ]);

        $modifiers = DB::transaction(function () use ($product, $validated): array {
            $product = Product::query()->lockForUpdate()->findOrFail($product->id);
            $modifierIds = $validated['modifier_ids'];
            $activeModifiers = Modifier::query()
                ->whereIn('id', $modifierIds)
                ->where('active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($activeModifiers->count() !== count($modifierIds)) {
                throw ValidationException::withMessages([
                    'modifier_ids' => 'Every modifier must exist and be active.',
                ]);
            }

            $product->modifiers()->sync($modifierIds);

            return $product->modifiers()
                ->orderBy('name')
                ->get(['modifiers.id', 'code', 'name', 'type', 'value'])
                ->map(fn (Modifier $modifier): array => $this->modifierData($modifier))
                ->all();
        }, 3);

        return response()->json(['data' => $modifiers]);
    }

    public function storeRecipe(SaveRecipeRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $recipe = DB::transaction(function () use ($product, $data): Recipe {
            $product = Product::query()->lockForUpdate()->findOrFail($product->id);
            $ingredientIds = array_column($data['ingredients'], 'ingredient_id');
            $activeIngredients = Ingredient::query()
                ->whereIn('id', $ingredientIds)
                ->where('active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            if ($activeIngredients->count() !== count($ingredientIds)) {
                throw ValidationException::withMessages([
                    'ingredients' => 'Every recipe ingredient must exist and be active.',
                ]);
            }

            $version = ((int) $product->recipes()->max('version')) + 1;
            $recipe = $product->recipes()->create(['version' => $version]);
            $recipe->recipeIngredients()->createMany($data['ingredients']);
            $product->update(['active_recipe_id' => $recipe->id]);

            return $recipe->load('recipeIngredients.ingredient');
        }, 3);

        return response()->json(['data' => $this->recipeData($recipe)], 201);
    }

    /**
     * @return array{id: int, code: string, name: string, unit: string, minimum_stock: string, active: bool}
     */
    private function ingredientData(Ingredient $ingredient): array
    {
        return [
            'id' => $ingredient->id,
            'code' => $ingredient->code,
            'name' => $ingredient->name,
            'unit' => $ingredient->unit,
            'minimum_stock' => $ingredient->minimum_stock,
            'active' => $ingredient->active,
        ];
    }

    /**
     * @return array{id: int, code: string, name: string, type: string, value: string, active: bool}
     */
    private function modifierData(Modifier $modifier): array
    {
        return [
            'id' => $modifier->id,
            'code' => $modifier->code,
            'name' => $modifier->name,
            'type' => $modifier->type,
            'value' => $modifier->value,
            'active' => $modifier->active,
        ];
    }

    /**
     * @return array{id: int, version: int, ingredients: array<int, array<string, int|string>>}
     */
    private function recipeData(Recipe $recipe): array
    {
        return [
            'id' => $recipe->id,
            'version' => $recipe->version,
            'ingredients' => $recipe->recipeIngredients
                ->map(fn ($recipeIngredient): array => [
                    'ingredient_id' => $recipeIngredient->ingredient->id,
                    'code' => $recipeIngredient->ingredient->code,
                    'name' => $recipeIngredient->ingredient->name,
                    'unit' => $recipeIngredient->ingredient->unit,
                    'quantity' => $recipeIngredient->quantity,
                ])
                ->values()
                ->all(),
        ];
    }
}
