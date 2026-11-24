<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeTable;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class TableController extends Controller
{
    public function index(): JsonResponse
    {
        $occupiedTables = Order::query()
            ->where('type', 'Dine-In')
            ->where('status', '!=', Order::STATUS_COMPLETED)
            ->whereNotNull('table_number')
            ->pluck('table_number')
            ->all();

        $occupiedLookup = array_flip($occupiedTables);

        $tables = CafeTable::query()
            ->where('active', true)
            ->orderBy('id')
            ->get(['id', 'code', 'name', 'capacity', 'active'])
            ->map(fn (CafeTable $table): array => [
                'id' => $table->id,
                'code' => $table->code,
                'name' => $table->name,
                'capacity' => $table->capacity,
                'available' => ! isset($occupiedLookup[$table->name]),
            ]);

        return response()->json(['data' => $tables]);
    }
}
