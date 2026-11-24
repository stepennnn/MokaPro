<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeRole = $request->session()->get('active_role');

        $shiftQuery = Shift::query()
            ->with('cashier:id,name')
            ->whereNull('closed_at')
            ->latest('id');

        if ($activeRole !== 'admin') {
            $shiftQuery->where('cashier_id', $user->id);
        }

        $shift = $shiftQuery->first();

        if ($shift === null) {
            return response()->json([
                'data' => null,
                'summary' => $this->summaryForOrders(
                    Order::query()
                        ->when($activeRole !== 'admin', fn ($q) => $q->where('user_id', $user->id))
                        ->whereDate('created_at', today())
                        ->pluck('id')
                        ->all(),
                    0.0,
                ),
            ]);
        }

        return response()->json([
            'data' => $this->shiftData($shift),
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'opening_float' => ['required', 'string', 'regex:/\A\d+(?:\.\d{1,2})?\z/'],
        ]);

        $cashierId = $request->user()->id;

        $shift = DB::transaction(function () use ($cashierId, $validated): ?Shift {
            $hasOpenShift = Shift::query()
                ->where('cashier_id', $cashierId)
                ->whereNull('closed_at')
                ->lockForUpdate()
                ->exists();

            if ($hasOpenShift) {
                return null;
            }

            return Shift::query()->create([
                'cashier_id' => $cashierId,
                'opening_float' => number_format((float) $validated['opening_float'], 2, '.', ''),
                'opened_at' => now(),
            ])->load('cashier:id,name');
        }, 3);

        if ($shift === null) {
            return response()->json([
                'message' => 'Kasir masih memiliki shift aktif. Tutup shift terlebih dahulu.',
            ], 409);
        }

        return response()->json([
            'data' => $this->shiftData($shift),
        ], 201);
    }

    public function close(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'closing_cash' => ['sometimes', 'nullable', 'string', 'regex:/\A\d+(?:\.\d{1,2})?\z/'],
            'note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $cashierId = $request->user()->id;

        $shift = DB::transaction(function () use ($cashierId, $validated): ?Shift {
            $openShift = Shift::query()
                ->where('cashier_id', $cashierId)
                ->whereNull('closed_at')
                ->lockForUpdate()
                ->latest('id')
                ->first();

            if ($openShift === null) {
                return null;
            }

            $openShift->update([
                'closing_cash' => isset($validated['closing_cash'])
                    ? number_format((float) $validated['closing_cash'], 2, '.', '')
                    : null,
                'note' => $validated['note'] ?? $openShift->note,
                'closed_at' => now(),
            ]);

            return $openShift->fresh('cashier:id,name');
        }, 3);

        if ($shift === null) {
            return response()->json([
                'message' => 'Tidak ada shift aktif untuk ditutup.',
            ], 409);
        }

        return response()->json([
            'message' => 'Shift berhasil ditutup.',
            'data' => $this->shiftData($shift),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function shiftData(Shift $shift): array
    {
        $orderIds = Order::query()
            ->where(function ($query) use ($shift): void {
                $query->where('shift_id', $shift->id)
                    ->orWhere(function ($fallback) use ($shift): void {
                        $fallback->whereNull('shift_id')
                            ->where('user_id', $shift->cashier_id)
                            ->where('created_at', '>=', $shift->opened_at ?? $shift->created_at);

                        if ($shift->closed_at !== null) {
                            $fallback->where('created_at', '<=', $shift->closed_at);
                        }
                    });
            })
            ->pluck('id')
            ->all();

        return [
            'id' => $shift->id,
            'cashier_id' => $shift->cashier_id,
            'cashier_name' => $shift->cashier?->name,
            'opening_float' => $shift->opening_float,
            'closing_cash' => $shift->closing_cash,
            'note' => $shift->note,
            'opened_at' => $shift->opened_at?->toIso8601String(),
            'closed_at' => $shift->closed_at?->toIso8601String(),
            'summary' => $this->summaryForOrders($orderIds, (float) $shift->opening_float),
        ];
    }

    /**
     * @param  array<int, int>  $orderIds
     * @return array<string, mixed>
     */
    private function summaryForOrders(array $orderIds, float $openingFloat): array
    {
        if ($orderIds === []) {
            return [
                'total_sales' => '0.00',
                'total_orders' => 0,
                'cash_sales' => '0.00',
                'qris_sales' => '0.00',
                'expected_cash' => number_format($openingFloat, 2, '.', ''),
                'top_product' => ['name' => '-', 'quantity' => 0],
            ];
        }

        $orders = Order::query()
            ->whereIn('id', $orderIds)
            ->get(['id', 'total', 'payment_method']);

        $totalSales = 0.0;
        $cashSales = 0.0;
        $qrisSales = 0.0;

        foreach ($orders as $order) {
            $amount = (float) $order->total;
            $totalSales += $amount;
            if (strtolower((string) $order->payment_method) === 'qris') {
                $qrisSales += $amount;
            } else {
                $cashSales += $amount;
            }
        }

        $topItem = OrderItem::query()
            ->selectRaw('products.name as product_name, SUM(order_items.quantity) as total_qty')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('order_items.order_id', $orderIds)
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->first();

        return [
            'total_sales' => number_format($totalSales, 2, '.', ''),
            'total_orders' => $orders->count(),
            'cash_sales' => number_format($cashSales, 2, '.', ''),
            'qris_sales' => number_format($qrisSales, 2, '.', ''),
            'expected_cash' => number_format($openingFloat + $cashSales, 2, '.', ''),
            'top_product' => [
                'name' => $topItem?->product_name ?? '-',
                'quantity' => (int) ($topItem?->total_qty ?? 0),
            ],
        ];
    }
}
