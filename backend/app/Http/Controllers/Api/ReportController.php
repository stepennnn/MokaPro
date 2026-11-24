<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Shift;
use App\Services\Inventory\RecipeInventoryService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(private readonly RecipeInventoryService $inventory) {}

    public function index(): JsonResponse
    {
        $allOrders = Order::query()->get(['id', 'total', 'payment_method', 'status', 'created_at']);
        $todayStart = today();

        $totalSales = 0.0;
        $todaySales = 0.0;
        $todayOrdersCount = 0;
        $cashSales = 0.0;
        $qrisSales = 0.0;
        $activeKdsOrders = 0;
        $hourlyBuckets = [];

        foreach ($allOrders as $order) {
            $amount = (float) $order->total;
            $totalSales += $amount;

            if ($order->status !== Order::STATUS_COMPLETED) {
                $activeKdsOrders++;
            }

            if (strtolower((string) $order->payment_method) === 'qris') {
                $qrisSales += $amount;
            } else {
                $cashSales += $amount;
            }

            if ($order->created_at !== null && $order->created_at->gte($todayStart)) {
                $todaySales += $amount;
                $todayOrdersCount++;

                $hourKey = $order->created_at->format('H:00');
                if (! isset($hourlyBuckets[$hourKey])) {
                    $hourlyBuckets[$hourKey] = ['hour' => $hourKey, 'orders' => 0, 'total' => 0.0];
                }
                $hourlyBuckets[$hourKey]['orders']++;
                $hourlyBuckets[$hourKey]['total'] += $amount;
            }
        }

        ksort($hourlyBuckets);
        $hourlySales = array_values(array_map(
            fn (array $bucket): array => [
                'hour' => $bucket['hour'],
                'orders' => $bucket['orders'],
                'total' => number_format($bucket['total'], 2, '.', ''),
            ],
            $hourlyBuckets,
        ));

        $topItem = OrderItem::query()
            ->selectRaw('products.name as product_name, SUM(order_items.quantity) as total_qty')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->first();

        $inventorySummary = $this->inventory->inventorySummary();
        $activeShift = Shift::query()
            ->with('cashier:id,name')
            ->whereNull('closed_at')
            ->latest('id')
            ->first();

        $activeShiftPayload = null;
        if ($activeShift !== null) {
            $shiftOrders = Order::query()
                ->where('shift_id', $activeShift->id)
                ->get(['total', 'payment_method']);

            $shiftCash = 0.0;
            $shiftQris = 0.0;
            foreach ($shiftOrders as $order) {
                if (strtolower((string) $order->payment_method) === 'qris') {
                    $shiftQris += (float) $order->total;
                } else {
                    $shiftCash += (float) $order->total;
                }
            }

            $activeShiftPayload = [
                'id' => $activeShift->id,
                'cashier_id' => $activeShift->cashier_id,
                'cashier_name' => $activeShift->cashier?->name,
                'opening_float' => $activeShift->opening_float,
                'cash_sales' => number_format($shiftCash, 2, '.', ''),
                'qris_sales' => number_format($shiftQris, 2, '.', ''),
                'expected_cash' => number_format((float) $activeShift->opening_float + $shiftCash, 2, '.', ''),
                'opened_at' => $activeShift->opened_at?->toIso8601String(),
            ];
        }

        return response()->json([
            'data' => [
                'total_sales' => number_format($totalSales, 2, '.', ''),
                'today_sales' => number_format($todaySales, 2, '.', ''),
                'total_orders' => $allOrders->count(),
                'today_orders' => $todayOrdersCount,
                'cash_sales' => number_format($cashSales, 2, '.', ''),
                'qris_sales' => number_format($qrisSales, 2, '.', ''),
                'active_kds_orders' => $activeKdsOrders,
                'low_stock_count' => count($inventorySummary['low_stock']),
                'low_stock_items' => $inventorySummary['low_stock'],
                'top_product' => [
                    'name' => $topItem?->product_name ?? '-',
                    'quantity' => (int) ($topItem?->total_qty ?? 0),
                ],
                'active_shift' => $activeShiftPayload,
                'hourly_sales' => $hourlySales,
            ],
        ]);
    }
}
