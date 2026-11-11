<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;

// Endpoint untuk React mengambil data produk (Menu)
Route::get('/products', [ProductController::class, 'index']);

// Endpoint untuk React mengirim data transaksi (Checkout)
Route::post('/orders', [OrderController::class, 'store']);