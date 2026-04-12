<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\Api\UserController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/shop/{id}', [ShopController::class, 'showPublic'])->where('id', '[0-9]+');

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Endpoints
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user()->load('shop');
    });
    
    Route::post('/user/profile', [UserController::class, 'updateProfile']);

    // Shop Admin endpoints
    Route::get('/shop/my', [ShopController::class, 'getMyShop']);
    Route::post('/shop/register', [ShopController::class, 'register']);
    Route::post('/shop/profile', [ShopController::class, 'updateProfile']);
    Route::post('/shop/product/add', [ProductController::class, 'store']); // Tambah produk dari MyToko
    Route::post('/shop/product/update/{id}', [ProductController::class, 'update']);
    Route::delete('/shop/product/{id}', [ProductController::class, 'destroy']);

    // Chat API
    Route::get('/chat', [\App\Http\Controllers\Api\ChatController::class, 'index']);
    Route::post('/chat', [\App\Http\Controllers\Api\ChatController::class, 'store']);
    Route::get('/chat/{id}', [\App\Http\Controllers\Api\ChatController::class, 'show']);
    Route::post('/chat/{id}/message', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
    
    // Cart Endpoints
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{cart}', [CartController::class, 'update']);
    Route::delete('/cart/{cart}', [CartController::class, 'destroy']);

    // Checkout
    Route::post('/checkout', [CheckoutController::class, 'process']);

    // Orders & Activity
    Route::get('/orders', [UserActivityController::class, 'orders']);
    Route::post('/orders/{order}/receive', [UserActivityController::class, 'receive']);
});
