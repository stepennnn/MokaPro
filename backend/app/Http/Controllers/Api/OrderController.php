<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientStock;
use App\Exceptions\ReservationExpired;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shift;
use App\Services\Inventory\RecipeInventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderController extends Controller
{
    public function __construct(private readonly RecipeInventoryService $inventory) {}

    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.product:id,code,name', 'user:id,name'])
            ->latest('id')
            ->get()
            ->map(fn (Order $order): array => $this->orderData($order));

        return response()->json(['data' => $orders]);
    }

    public function kdsIndex(): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.product:id,code,name', 'user:id,name'])
            ->where(function ($query): void {
                $query->where('status', '!=', Order::STATUS_COMPLETED)
                    ->orWhereDate('created_at', today());
            })
            ->orderByRaw("CASE status WHEN 'Menunggu' THEN 1 WHEN 'Diproses' THEN 2 ELSE 3 END")
            ->latest('id')
            ->get()
            ->map(fn (Order $order): array => $this->orderData($order));

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(['Dine-In', 'Takeaway', 'dine-in', 'takeaway'])],
            'table_number' => ['nullable', 'string', 'max:64'],
            'seats' => ['nullable', 'integer', 'min:1', 'max:50'],
            'payment_method' => ['required', 'string', Rule::in(['cash', 'qris', 'Tunai', 'QRIS'])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', Rule::exists('products', 'id')->where('active', true)],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
            'items.*.modifier_ids' => ['sometimes', 'array'],
            'items.*.modifier_ids.*' => ['required', 'integer', 'distinct'],
        ]);

        try {
            $order = DB::transaction(function () use ($validated, $request): Order {
                $productIds = array_values(array_unique(array_column($validated['items'], 'id')));
                $products = Product::query()
                    ->with(['activeRecipe.recipeIngredients', 'modifiers:id,name,type,value'])
                    ->whereIn('id', $productIds)
                    ->where('active', true)
                    ->get()
                    ->keyBy('id');

                $normalizedType = strtolower($validated['type']) === 'takeaway' ? 'Takeaway' : 'Dine-In';
                $tableNumber = $normalizedType === 'Takeaway' ? null : ($validated['table_number'] ?? null);

                if ($normalizedType === 'Dine-In' && $tableNumber !== null && $tableNumber !== '') {
                    $isOccupied = Order::query()
                        ->where('type', 'Dine-In')
                        ->where('table_number', $tableNumber)
                        ->where('status', '!=', Order::STATUS_COMPLETED)
                        ->lockForUpdate()
                        ->exists();

                    if ($isOccupied) {
                        throw ValidationException::withMessages([
                            'table_number' => ["Meja {$tableNumber} sedang terisi oleh pesanan aktif."],
                        ]);
                    }
                }

                $subtotal = 0.0;
                $orderItems = [];
                $hasAnyActiveRecipe = false;

                foreach ($validated['items'] as $index => $item) {
                    /** @var Product|null $product */
                    $product = $products->get($item['id']);
                    if (! $product instanceof Product) {
                        throw ValidationException::withMessages([
                            'items' => ['Salah satu produk tidak ditemukan atau nonaktif.'],
                        ]);
                    }

                    $modifierIds = $item['modifier_ids'] ?? [];
                    if ($modifierIds !== []) {
                        $allowedModifierIds = $product->modifiers->pluck('id')->all();
                        $invalidModifierIds = array_diff($modifierIds, $allowedModifierIds);
                        if ($invalidModifierIds !== []) {
                            throw ValidationException::withMessages([
                                "items.{$index}.modifier_ids" => ['Modifier tidak valid atau tidak tertaut pada produk ini.'],
                            ]);
                        }
                    }

                    $unitPrice = (float) $product->price;
                    $subtotal += $unitPrice * (int) $item['quantity'];

                    $orderItems[] = [
                        'product_id' => $product->id,
                        'quantity' => (int) $item['quantity'],
                        'price' => number_format($unitPrice, 2, '.', ''),
                        'notes' => $item['notes'] ?? null,
                    ];

                    if (
                        $product->activeRecipe !== null
                        && $product->activeRecipe->recipeIngredients->isNotEmpty()
                    ) {
                        $hasAnyActiveRecipe = true;
                    }
                }

                $taxRate = (float) config('mokapro.tax_rate', '0.1000');
                $tax = round($subtotal * $taxRate, 2);
                $total = round($subtotal + $tax, 2);

                $normalizedPayment = in_array(strtolower($validated['payment_method']), ['qris'], true)
                    ? 'qris'
                    : 'cash';

                $userId = $request->user()?->id;
                $activeShiftId = $userId === null
                    ? null
                    : Shift::query()
                        ->where('cashier_id', $userId)
                        ->whereNull('closed_at')
                        ->latest('id')
                        ->value('id');

                $orderNumber = $this->generateUniqueOrderNumber();

                $newOrder = Order::query()->create([
                    'user_id' => $userId,
                    'shift_id' => $activeShiftId,
                    'order_number' => $orderNumber,
                    'type' => $normalizedType,
                    'table_number' => $tableNumber,
                    'seats' => $normalizedType === 'Takeaway' ? null : ($validated['seats'] ?? null),
                    'subtotal' => number_format($subtotal, 2, '.', ''),
                    'tax' => number_format($tax, 2, '.', ''),
                    'total' => number_format($total, 2, '.', ''),
                    'payment_method' => $normalizedPayment,
                    'status' => Order::STATUS_PENDING,
                ]);

                $newOrder->items()->createMany($orderItems);

                if ($hasAnyActiveRecipe) {
                    $this->inventory->reserveForOrder($newOrder, allowProductsWithoutRecipe: true);
                    $this->inventory->consumeForPayment($newOrder, 'PAY-'.$newOrder->order_number);
                }

                return $newOrder->load(['items.product:id,code,name', 'user:id,name']);
            }, 3);

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran Berhasil',
                'data' => $this->orderData($order),
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (InsufficientStock $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stok bahan baku tidak mencukupi untuk memproses pesanan ini.',
                'ingredient_id' => $e->ingredientId,
            ], 422);
        } catch (ReservationExpired) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reservasi stok kedaluwarsa. Silakan ulangi transaksi.',
            ], 409);
        } catch (Throwable $e) {
            Log::error('Failed to process order checkout.', [
                'user_id' => $request->user()?->id,
                'exception' => $e,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.',
            ], 500);
        }
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(Order::STATUSES)],
        ]);

        $order->update(['status' => $validated['status']]);
        $order->load(['items.product:id,code,name', 'user:id,name']);

        return response()->json([
            'data' => $this->orderData($order),
        ]);
    }

    private function generateUniqueOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-'.now()->format('YmdHis').'-'.strtoupper(Str::random(4));
        } while (Order::query()->where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    /**
     * @return array<string, mixed>
     */
    private function orderData(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'type' => $order->type,
            'table_number' => $order->table_number,
            'seats' => $order->seats,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'payment_method' => $order->payment_method,
            'status' => $order->status,
            'cashier' => $order->user === null ? null : [
                'id' => $order->user->id,
                'name' => $order->user->name,
            ],
            'items' => $order->items->map(fn ($item): array => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'name' => $item->product?->name ?? 'Produk',
                'quantity' => $item->quantity,
                'price' => $item->price,
                'notes' => $item->notes,
            ])->values()->all(),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }
}
