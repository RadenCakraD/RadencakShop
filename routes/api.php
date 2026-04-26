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
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
Route::get('/products', [ProductController::class, 'index']);
Route::get('/flash-sales', [ProductController::class, 'getFlashSales']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/shop/{id}', [ShopController::class, 'showPublic'])->where('id', '[0-9]+');
Route::get('/banners/active', [\App\Http\Controllers\Api\AdminController::class, 'getActiveBanners']); // Public banners

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Endpoints
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user()->load('shop');
    });
    // User Profile
    Route::post('/user/profile', [UserController::class, 'updateProfile']);

    // User Addresses
    Route::get('/addresses', [\App\Http\Controllers\Api\AddressController::class, 'index']);
    Route::post('/addresses', [\App\Http\Controllers\Api\AddressController::class, 'store']);
    Route::put('/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [\App\Http\Controllers\Api\AddressController::class, 'destroy']);
    Route::post('/addresses/{id}/primary', [\App\Http\Controllers\Api\AddressController::class, 'setPrimary']);

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
    Route::get('/chat/unread-count', [\App\Http\Controllers\Api\ChatController::class, 'unreadCount']);
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
    Route::post('/checkout', [CheckoutController::class, 'process'])->middleware('throttle:10,1');
    Route::post('/checkout/verify-bank', [CheckoutController::class, 'verifyBank'])->middleware('throttle:10,1');

    // Withdrawals
    Route::get('/withdrawals', [\App\Http\Controllers\Api\WithdrawalController::class, 'index']);
    Route::post('/withdrawals', [\App\Http\Controllers\Api\WithdrawalController::class, 'requestWithdrawal']);

    // Orders & Activity
    Route::get('/orders', [UserActivityController::class, 'orders']);
    Route::post('/orders/{order}/cancel', [UserActivityController::class, 'cancel']);
    Route::post('/orders/{order}/receive', [UserActivityController::class, 'receive']);
    Route::post('/orders/{order}/review', [UserActivityController::class, 'storeReview']);

    // Admin Endpoints
    Route::middleware('role:admin_staff')->group(function () {
        Route::get('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'getAllUsers']);
        Route::put('/admin/users/{id}/role', [\App\Http\Controllers\Api\AdminController::class, 'updateUserRole']);
        Route::get('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'getBanners']);
        Route::post('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'storeBanner']);
        Route::post('/admin/banners/reorder', [\App\Http\Controllers\Api\AdminController::class, 'reorderBanners']);
        Route::post('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateBanner']);
        Route::delete('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroyBanner']);
        Route::get('/admin/products', [\App\Http\Controllers\Api\AdminController::class, 'fetchAllProducts']);
        Route::post('/admin/products/{id}/flash-sale', [\App\Http\Controllers\Api\AdminController::class, 'toggleFlashSale']);
        Route::post('/admin/products/bulk-flash-sale', [\App\Http\Controllers\Api\AdminController::class, 'bulkFlashSale']);
        
        // Admin Withdrawals Management
        Route::get('/admin/withdrawals', [\App\Http\Controllers\Api\AdminController::class, 'getAllWithdrawals']);
        Route::post('/admin/withdrawals/{id}/approve', [\App\Http\Controllers\Api\AdminController::class, 'approveWithdrawal']);
        Route::post('/admin/withdrawals/{id}/reject', [\App\Http\Controllers\Api\AdminController::class, 'rejectWithdrawal']);
        Route::delete('/admin/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroyUser']);
        
        // Admin Complaints Management
        Route::get('/admin/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'adminIndex']);
        Route::post('/admin/complaints/{id}/resolve', [\App\Http\Controllers\Api\ComplaintController::class, 'resolve']);
    });

    // Courier Staff & Admin
    Route::middleware('role:admin_kurir,kurir_staff,admin_logistik,logistik_staff')->group(function () {
        Route::get('/courier/staffs', [\App\Http\Controllers\Api\CourierController::class, 'getStaffs']);
        Route::get('/courier/tasks', [\App\Http\Controllers\Api\CourierController::class, 'getMyTasks']);
        Route::post('/courier/take-task/{id}', [\App\Http\Controllers\Api\CourierController::class, 'selfAssignPickup']);
        Route::post('/courier/pickup/{id}', [\App\Http\Controllers\Api\CourierController::class, 'pickupPackage']);
        Route::post('/courier/deliver/{id}', [\App\Http\Controllers\Api\CourierController::class, 'deliverPackage']);
        Route::post('/courier/assign/{id}', [\App\Http\Controllers\Api\CourierController::class, 'assignPickup']);
    });

    // Logistics
    Route::middleware('role:admin_logistik,logistik_staff')->group(function () {
        Route::get('/logistics/stats', [\App\Http\Controllers\Api\LogisticsController::class, 'stats']);
        Route::get('/logistics/packages', [\App\Http\Controllers\Api\LogisticsController::class, 'getPackages']);
        Route::post('/logistics/receive/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'receivePackage']);
        Route::post('/logistics/assign/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'assignDelivery']);
    });

    // Tracking
    Route::get('/orders/{id}/tracking', [\App\Http\Controllers\Api\TrackingController::class, 'getTracking']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\TrackingController::class, 'unreadCount']);
    Route::get('/notifications', [\App\Http\Controllers\Api\TrackingController::class, 'getNotifications']);
    Route::post('/notifications/read', [\App\Http\Controllers\Api\TrackingController::class, 'markRead']);
    Route::post('/user/update', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
});

// Admin public API
Route::get('/banners/active', [\App\Http\Controllers\Api\AdminController::class, 'getActiveBanners']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'index']);
    Route::post('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'store']);
});

Route::post('/register-staff', [\App\Http\Controllers\Api\AuthController::class, 'registerStaff']);

Route::get('/logistics/staffs', [\App\Http\Controllers\Api\LogisticsController::class, 'getStaffs'])->middleware('auth:sanctum');

Route::apiResource('regions', \App\Http\Controllers\Api\RegionController::class)->middleware('auth:sanctum');
