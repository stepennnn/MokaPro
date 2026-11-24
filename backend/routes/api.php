<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

// Endpoint untuk React mengambil data produk (Menu)
Route::get('/products', [ProductController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);
Route::get('/categories', [CategoryController::class, 'index'])
    ->middleware(['auth:web', 'role:cashier,admin']);

Route::middleware(['auth:web', 'role:admin'])->prefix('admin')->group(function (): void {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::patch('/categories/{category}', [CategoryController::class, 'update']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::patch('/products/{product}', [ProductController::class, 'update']);
    Route::get('/ingredients', [RecipeController::class, 'ingredientsIndex']);
    Route::post('/ingredients', [RecipeController::class, 'storeIngredient']);
    Route::patch('/ingredients/{ingredient}', [RecipeController::class, 'updateIngredient']);
    Route::post('/modifiers', [RecipeController::class, 'storeModifier']);
    Route::patch('/modifiers/{modifier}', [RecipeController::class, 'updateModifier']);
    Route::put('/products/{product}/modifiers', [RecipeController::class, 'syncProductModifiers']);
    Route::post('/products/{product}/recipes', [RecipeController::class, 'storeRecipe']);
});

// Endpoint untuk React mengirim data transaksi (Checkout)
Route::post('/orders', [OrderController::class, 'store'])
    ->middleware(['auth:web', 'role:cashier']);

Route::get('/login-options', [SessionController::class, 'loginOptions'])->middleware('throttle:30,1');
Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:30,1');
Route::middleware('auth:web')->group(function (): void {
    Route::get('/session', [SessionController::class, 'show']);
    Route::post('/logout', [SessionController::class, 'destroy']);
});
