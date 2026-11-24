<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SaveCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'active']);

        return response()->json(['data' => $categories]);
    }

    public function store(SaveCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $category = Category::query()->create([
            'name' => $data['name'],
            'active' => $data['active'] ?? true,
        ]);

        return response()->json(['data' => $category->only(['id', 'name', 'active'])], 201);
    }

    public function update(SaveCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($category, $data): void {
            if (isset($data['name']) && $data['name'] !== $category->name) {
                $category->products()->update(['category' => $data['name']]);
            }

            $category->fill($data)->save();
        });

        return response()->json(['data' => $category->only(['id', 'name', 'active'])]);
    }
}
