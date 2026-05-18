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
use App\Http\Controllers\Api\InvitationController;

// Public Routes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:3,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/verify-2fa', [AuthController::class, 'verify2FA']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/flash-sales', [ProductController::class, 'getFlashSales']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/shop/{id}', [ShopController::class, 'showPublic'])->where('id', '[0-9]+');
Route::get('/banners/active', [\App\Http\Controllers\Api\AdminController::class, 'getActiveBanners']);
Route::get('/global-settings', [\App\Http\Controllers\Api\AdminController::class, 'getGlobalSettings']);
Route::post('/products/{id}/view', [ProductController::class, 'incrementView']);
Route::post('/products/{id}/cart-add', [ProductController::class, 'incrementCartAdd']);
Route::post('/payment/webhook', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'handleMidtrans']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Endpoints
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-otp', [AuthController::class, 'resendOTP']);
    Route::post('/toggle-2fa', [AuthController::class, 'toggle2FA']);
    Route::post('/user/apply-mitra', [AuthController::class, 'applyMitra']);
    Route::post('/user/apply-staff', [AuthController::class, 'applyStaff']);

    Route::get('/user', function (Request $request) {
        return $request->user()->load('shop');
    });
    // User Profile & Staff Management
    Route::post('/user/profile', [UserController::class, 'updateProfile']);
    Route::get('/user/staff', [UserController::class, 'getMyStaff']);
    Route::post('/user/staff/{id}/status', [UserController::class, 'updateStaffStatus']);
    Route::post('/user/accept-invite/{id}', [UserController::class, 'acceptInvite']);
    Route::delete('/user/staff/{id}', [UserController::class, 'fireStaff']);
    Route::post('/user/{id}/status', [UserController::class, 'updateUserStatus']);

    // Invitations
    Route::get('/invitations', [InvitationController::class, 'index']);
    Route::get('/invitations/received', [InvitationController::class, 'receivedInvitations']);
    Route::post('/invitations', [InvitationController::class, 'sendInvite']);
    Route::post('/invitations/{token}/accept', [InvitationController::class, 'acceptInvite']);
    Route::post('/invitations/{token}/cancel', [InvitationController::class, 'cancelInvite']);

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
    Route::post('/shop/invite-staff', [ShopController::class, 'inviteStaff']);
    Route::post('/shop/orders/{id}/status', [ShopController::class, 'updateOrderStatus']);
    Route::get('/shop/profit', [ShopController::class, 'getProfit']);
    Route::get('/shop/insights', [ShopController::class, 'getShopInsights']);

    // Chat API
    Route::get('/chat', [\App\Http\Controllers\Api\ChatController::class, 'index']);
    Route::get('/chat/unread-count', [\App\Http\Controllers\Api\ChatController::class, 'unreadCount']);
    Route::post('/chat', [\App\Http\Controllers\Api\ChatController::class, 'store']);
    Route::get('/chat/{id}', [\App\Http\Controllers\Api\ChatController::class, 'show']);
    Route::post('/chat/{id}/message', [\App\Http\Controllers\Api\ChatController::class, 'sendMessage']);
    
    // Raden AI Smart Assistant API
    Route::post('/ai/chat', [\App\Http\Controllers\Api\AIController::class, 'chat'])->middleware('throttle:30,1');
    
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
    Route::middleware('role:super_admin,admin_staff')->group(function () {
        Route::get('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'getAllUsers']);
        Route::put('/admin/users/{id}/role', [\App\Http\Controllers\Api\AdminController::class, 'updateUserRole']);
        Route::get('/admin/mitra/pending', [\App\Http\Controllers\Api\AdminController::class, 'getPendingMitra']);
        Route::post('/admin/mitra/{id}/status', [\App\Http\Controllers\Api\AdminController::class, 'updateMitraStatus']);
        Route::post('/admin/staff/create', [\App\Http\Controllers\Api\AdminController::class, 'createStaff']);
        Route::get('/admin/dashboard-stats', [\App\Http\Controllers\Api\AdminController::class, 'getDashboardStats']);
        Route::get('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'getBanners']);
        Route::post('/admin/banners', [\App\Http\Controllers\Api\AdminController::class, 'storeBanner']);
        Route::post('/admin/banners/reorder', [\App\Http\Controllers\Api\AdminController::class, 'reorderBanners']);
        Route::post('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'updateBanner']);
        Route::delete('/admin/banners/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroyBanner']);
        Route::get('/admin/products', [\App\Http\Controllers\Api\AdminController::class, 'fetchAllProducts']);
        Route::post('/admin/products/{id}/flash-sale', [\App\Http\Controllers\Api\AdminController::class, 'toggleFlashSale']);
        Route::post('/admin/products/bulk-flash-sale', [\App\Http\Controllers\Api\AdminController::class, 'bulkFlashSale']);
        Route::get('/admin/shops', [\App\Http\Controllers\Api\AdminController::class, 'getAllShops']);
        
        // Admin Withdrawals Management
        Route::get('/admin/withdrawals', [\App\Http\Controllers\Api\AdminController::class, 'getAllWithdrawals']);
        Route::post('/admin/withdrawals/{id}/approve', [\App\Http\Controllers\Api\AdminController::class, 'approveWithdrawal']);
        Route::post('/admin/withdrawals/{id}/reject', [\App\Http\Controllers\Api\AdminController::class, 'rejectWithdrawal']);
        Route::delete('/admin/users/{id}', [\App\Http\Controllers\Api\AdminController::class, 'destroyUser']);
        
        // Admin Vouchers Management
        Route::get('/admin/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'index']);
        Route::post('/admin/vouchers', [\App\Http\Controllers\Api\VoucherController::class, 'store']);
        Route::delete('/admin/vouchers/{id}', [\App\Http\Controllers\Api\VoucherController::class, 'destroy']);

        // Admin Settings Management
        Route::get('/admin/settings', [\App\Http\Controllers\Api\AdminController::class, 'getSettings']);
        Route::post('/admin/settings', [\App\Http\Controllers\Api\AdminController::class, 'updateSettings']);

        // Admin Complaints Management
        Route::get('/admin/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'adminIndex']);
        Route::post('/admin/complaints/{id}/resolve', [\App\Http\Controllers\Api\ComplaintController::class, 'resolve']);
    });

    // Courier Staff & Admin
    Route::middleware('role:admin_kurir,kurir_staff,admin_logistik,sortir_kurir,kurir')->group(function () {
        Route::get('/courier/staffs', [\App\Http\Controllers\Api\CourierController::class, 'getStaffs']);
        Route::post('/courier/staff/{id}/salary', [\App\Http\Controllers\Api\CourierController::class, 'updateStaffSalary']);
        Route::post('/courier/receive-hub/{id}', [\App\Http\Controllers\Api\CourierController::class, 'receiveAtHub']);
        Route::post('/courier/ready-logistics/{id}', [\App\Http\Controllers\Api\CourierController::class, 'readyForLogistics']);
        Route::post('/courier/mitra-review', [\App\Http\Controllers\Api\CourierController::class, 'submitMitraReview']);
        Route::get('/courier/mitra-reviews', [\App\Http\Controllers\Api\CourierController::class, 'getMitraReviews']);
        Route::get('/courier/tasks', [\App\Http\Controllers\Api\CourierController::class, 'getMyTasks']);
        Route::get('/courier/performance', [\App\Http\Controllers\Api\CourierController::class, 'getPerformance']);
        Route::post('/courier/scan', [\App\Http\Controllers\Api\CourierController::class, 'scanPackage']);
        Route::post('/courier/take-task/{id}', [\App\Http\Controllers\Api\CourierController::class, 'selfAssignPickup']);
        Route::post('/courier/pickup/{id}', [\App\Http\Controllers\Api\CourierController::class, 'pickupPackage']);
        Route::post('/courier/deliver/{id}', [\App\Http\Controllers\Api\CourierController::class, 'deliverPackage']);
        Route::post('/courier/assign/{id}', [\App\Http\Controllers\Api\CourierController::class, 'assignPickup']);
        Route::post('/courier/settings', [\App\Http\Controllers\Api\CourierController::class, 'updateSettings']);
    });

    // Logistics
    Route::middleware('role:admin_logistik,sortir_logistik,logistik_internal,logistik_external')->group(function () {
        Route::get('/logistics/stats', [\App\Http\Controllers\Api\LogisticsController::class, 'stats']);
        Route::get('/logistics/packages', [\App\Http\Controllers\Api\LogisticsController::class, 'getPackages']);
        Route::get('/logistics/tasks', [\App\Http\Controllers\Api\LogisticsController::class, 'getMyTasks']);
        Route::get('/logistics/radar', [\App\Http\Controllers\Api\LogisticsController::class, 'getRadarLog']);
        Route::post('/logistics/receive/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'receivePackage']);
        Route::post('/logistics/assign/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'assignDelivery']);
        Route::post('/logistics/staff/{id}/salary', [\App\Http\Controllers\Api\LogisticsController::class, 'updateStaffSalary']);
        Route::post('/logistics/pickup-hub/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'pickupFromCourierHub']);
        Route::post('/logistics/receive-hub/{id}', [\App\Http\Controllers\Api\LogisticsController::class, 'receiveAtLogisticsHub']);
        Route::post('/logistics/settings', [\App\Http\Controllers\Api\LogisticsController::class, 'updateSettings']);
    });

    // Tracking
    Route::get('/orders/{id}/tracking', [\App\Http\Controllers\Api\TrackingController::class, 'getTracking']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\TrackingController::class, 'unreadCount']);
    Route::get('/notifications', [\App\Http\Controllers\Api\TrackingController::class, 'getNotifications']);
    Route::post('/notifications/read', [\App\Http\Controllers\Api\TrackingController::class, 'markRead']);
    Route::post('/user/update', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
});

// Admin public API


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'index']);
    Route::post('/complaints', [\App\Http\Controllers\Api\ComplaintController::class, 'store']);
});

Route::post('/register-mitra', [\App\Http\Controllers\Api\AuthController::class, 'registerMitra']);
Route::post('/register-staff', [\App\Http\Controllers\Api\AuthController::class, 'registerStaff']);
Route::get('/regions-public', [\App\Http\Controllers\Api\RegionController::class, 'index']);
Route::get('/mitra/list', [\App\Http\Controllers\Api\UserController::class, 'getMitraList']);

Route::get('/logistics/staffs', [\App\Http\Controllers\Api\LogisticsController::class, 'getStaffs'])->middleware('auth:sanctum');

Route::apiResource('regions', \App\Http\Controllers\Api\RegionController::class)->middleware('auth:sanctum');
