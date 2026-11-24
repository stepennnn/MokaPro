<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRestockRequest;
use App\Models\Restock;
use App\Services\Inventory\RecipeInventoryService;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function __construct(private readonly RecipeInventoryService $inventory) {}

    public function index(): JsonResponse
    {
        return response()->json($this->inventory->inventorySummary());
    }

    public function storeRestock(StoreRestockRequest $request): JsonResponse
    {
        $data = $request->validated();
        $restock = $this->inventory->recordRestock(
            $data['reference'],
            $data['note'] ?? null,
            $data['items'],
            $request->user()->id,
        );

        return response()->json(
            ['data' => $this->restockData($restock)],
            $restock->wasRecentlyCreated ? 201 : 200,
        );
    }

    /**
     * @return array{id: int, reference: string, note: string|null, items: array<int, array<string, int|string>>}
     */
    private function restockData(Restock $restock): array
    {
        return [
            'id' => $restock->id,
            'reference' => $restock->reference,
            'note' => $restock->note,
            'items' => $restock->items
                ->map(fn ($item): array => [
                    'ingredient_id' => $item->ingredient_id,
                    'code' => $item->ingredient->code,
                    'name' => $item->ingredient->name,
                    'unit' => $item->ingredient->unit,
                    'quantity' => $item->quantity,
                ])
                ->values()
                ->all(),
        ];
    }
}
