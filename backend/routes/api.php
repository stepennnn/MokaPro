<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;

// Katalog Produk & Kategori
Route::get('/products', [ProductController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::get('/categories', [CategoryController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);

// Meja & Shift Kasir
Route::get('/tables', [TableController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::get('/shifts/current', [ShiftController::class, 'current'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::post('/shifts/open', [ShiftController::class, 'open'])
    ->middleware(['auth:web', 'role:cashier']);
Route::post('/shifts/close', [ShiftController::class, 'close'])
    ->middleware(['auth:web', 'role:cashier']);

// Transaksi, Riwayat & KDS
Route::get('/orders', [OrderController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::post('/orders', [OrderController::class, 'store'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::get('/kds/orders', [OrderController::class, 'kdsIndex'])
    ->middleware(['auth:web', 'role:barista,admin']);
Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])
    ->middleware(['auth:web', 'role:barista,admin']);

// Modul Admin
Route::middleware(['auth:web', 'role:admin'])->prefix('admin')->group(function (): void {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::patch('/categories/{category}', [CategoryController::class, 'update']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::patch('/products/{product}', [ProductController::class, 'update']);
    Route::get('/ingredients', [RecipeController::class, 'ingredientsIndex']);
    Route::post('/ingredients', [RecipeController::class, 'storeIngredient']);
    Route::patch('/ingredients/{ingredient}', [RecipeController::class, 'updateIngredient']);
    Route::get('/modifiers', [RecipeController::class, 'modifiersIndex']);
    Route::post('/modifiers', [RecipeController::class, 'storeModifier']);
    Route::patch('/modifiers/{modifier}', [RecipeController::class, 'updateModifier']);
    Route::put('/products/{product}/modifiers', [RecipeController::class, 'syncProductModifiers']);
    Route::get('/products/{product}/recipe', [RecipeController::class, 'showActiveRecipe']);
    Route::post('/products/{product}/recipes', [RecipeController::class, 'storeRecipe']);
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/restocks', [InventoryController::class, 'storeRestock']);
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::patch('/users/{user}', [AdminUserController::class, 'update']);
    Route::patch('/users/{user}/pin', [AdminUserController::class, 'resetPin']);
});

// Autentikasi PIN & Sesi
Route::get('/login-options', [SessionController::class, 'loginOptions'])->middleware('throttle:30,1');
Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:30,1');
Route::get('/config', [SessionController::class, 'config'])
    ->middleware(['auth:web', 'role:cashier,barista,admin']);
Route::middleware('auth:web')->group(function (): void {
    Route::get('/session', [SessionController::class, 'show']);
    Route::post('/logout', [SessionController::class, 'destroy']);
});
