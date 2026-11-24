<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SaveProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $includeInactive = $request->boolean('include_inactive')
            && $request->session()->get('active_role') === 'admin';

        $products = Product::query()
            ->with([
                'category:id,name',
                'activeRecipe:id,version',
                'modifiers:id,code,name,type,value',
            ])
            ->when(! $includeInactive, fn ($query) => $query->where('active', true))
            ->orderBy('name')
            ->get()
            ->map(fn (Product $product): array => $this->catalogData($product));

        return response()->json(['data' => $products]);
    }

    public function store(SaveProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $category = Category::query()
            ->where('active', true)
            ->findOrFail($data['category_id']);
        $product = Product::query()->create([
            'code' => $data['code'],
            'name' => $data['name'],
            'category_id' => $category->id,
            'category' => $category->name,
            'price' => $data['price'],
            'active' => $data['active'] ?? true,
        ]);
        $product->load([
            'category:id,name',
            'activeRecipe:id,version',
            'modifiers:id,code,name,type,value',
        ]);

        return response()->json(['data' => $this->catalogData($product)], 201);
    }

    public function update(SaveProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('category_id', $data)) {
            $category = Category::query()
                ->where('active', true)
                ->findOrFail($data['category_id']);
            $data['category'] = $category->name;
        }

        $product->fill($data)->save();
        $product->load([
            'category:id,name',
            'activeRecipe:id,version',
            'modifiers:id,code,name,type,value',
        ]);

        return response()->json(['data' => $this->catalogData($product)]);
    }

    /**
     * @return array{id: int, code: string, name: string, category: array{id: int, name: string}, price: string, active: bool, active_recipe: array{id: int, version: int}|null, modifiers: array<int, array{id: int, code: string, name: string, type: string, value: string}>}
     */
    private function catalogData(Product $product): array
    {
        $category = $product->getRelation('category');
        $activeRecipe = $product->getRelation('activeRecipe');

        return [
            'id' => $product->id,
            'code' => $product->code,
            'name' => $product->name,
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
            ],
            'price' => $product->price,
            'active' => $product->active,
            'active_recipe' => $activeRecipe === null ? null : [
                'id' => $activeRecipe->id,
                'version' => $activeRecipe->version,
            ],
            'modifiers' => $product->getRelation('modifiers')
                ->map(fn ($modifier): array => [
                    'id' => $modifier->id,
                    'code' => $modifier->code,
                    'name' => $modifier->name,
                    'type' => $modifier->type,
                    'value' => $modifier->value,
                ])
                ->values()
                ->all(),
        ];
    }
}
