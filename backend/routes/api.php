<?php

use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

// Endpoint untuk React mengambil data produk (Menu)
Route::get('/products', [ProductController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);

// Endpoint untuk React mengirim data transaksi (Checkout)
Route::post('/orders', [OrderController::class, 'store'])
    ->middleware(['auth:web', 'role:cashier']);

Route::get('/login-options', [SessionController::class, 'loginOptions'])->middleware('throttle:30,1');
Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:30,1');
Route::middleware('auth:web')->group(function (): void {
    Route::get('/session', [SessionController::class, 'show']);
    Route::post('/logout', [SessionController::class, 'destroy']);
});
