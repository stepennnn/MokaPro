<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        // Validasi data yang dikirim dari React
        $validated = $request->validate([
            'type' => 'required|string',
            'table_number' => 'nullable|string',
            'payment_method' => 'required|string',
            'items' => 'required|array',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
        ]);

        try {
            $order = DB::transaction(function () use ($validated) {
                $subtotal = 0;
                $orderItems = [];

                // 1. Hitung total harga dari item yang dibeli
                foreach ($validated['items'] as $item) {
                    $product = Product::find($item['id']);
                    $subtotal += $product->price * $item['quantity'];
                    
                    $orderItems[] = [
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'price' => $product->price,
                        'notes' => $item['notes'] ?? null,
                    ];
                }

                // 2. Hitung Pajak PB1 10%
                $tax = round($subtotal * 0.1);
                $total = $subtotal + $tax;

                // 3. Simpan data ke tabel orders
                $newOrder = Order::create([
                    'order_number' => 'ORD-' . rand(1000, 9999),
                    'type' => $validated['type'],
                    'table_number' => $validated['table_number'],
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_method' => $validated['payment_method'],
                ]);

                // 4. Simpan detail item ke tabel order_items
                $newOrder->items()->createMany($orderItems);

                return $newOrder;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran Berhasil',
                'data' => $order->load('items.product')
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}