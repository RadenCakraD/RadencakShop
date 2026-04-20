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
    Route::post('/shop/verify', [ShopController::class, 'upgradeTier']);
    Route::post('/shop/orders/{id}/status', [ShopController::class, 'updateOrderStatus']);
    Route::get('/shop/profit', [ShopController::class, 'getProfit']);

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

    // Vouchers
    Route::get('/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'index']);
    Route::post('/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'store']);
    Route::delete('/vouchers/{id}', [\App\Http\Controllers\Api\VoucherController::class, 'destroy']);
    Route::post('/vouchers/check', [\App\Http\Controllers\Api\VoucherController::class, 'check']);

    // Checkout
    Route::post('/checkout', [CheckoutController::class, 'process']);
    Route::post('/checkout/success-prototype', [CheckoutController::class, 'successPrototype']);
    Route::post('/checkout/verify-bank', [CheckoutController::class, 'verifyBank']);

    // Orders & Activity
    Route::get('/orders', [UserActivityController::class, 'orders']);
    Route::post('/orders/{order}/cancel', [UserActivityController::class, 'cancel']);
    Route::post('/orders/{order}/receive', [UserActivityController::class, 'receive']);
    Route::post('/orders/{order}/review', [UserActivityController::class, 'storeReview']);

    // Admin & Courier
    Route::get('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'getAllUsers']);
    Route::put('/admin/users/{id}/role', [\App\Http\Controllers\Api\AdminController::class, 'updateUserRole']);
    Route::get('/admin/shipped-orders', [\App\Http\Controllers\Api\AdminController::class, 'getShippedOrders']);
    Route::post('/admin/orders/{id}/delivered', [\App\Http\Controllers\Api\AdminController::class, 'markAsDelivered']);
    Route::get('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'getBanners']);
    Route::post('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'storeBanner']);
    Route::post('/admin/banners/reorder', [\App\Http\Controllers\Api\AdminController::class, 'reorderBanners']);
    Route::post('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateBanner']);
    Route::delete('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroyBanner']);
    Route::get('/admin/products', [\App\Http\Controllers\Api\AdminController::class, 'fetchAllProducts']);
    Route::post('/admin/products/{id}/flash-sale', [\App\Http\Controllers\Api\AdminController::class, 'toggleFlashSale']);
});

// Admin public API
Route::get('/banners/active', [\App\Http\Controllers\Api\AdminController::class, 'getActiveBanners']);
