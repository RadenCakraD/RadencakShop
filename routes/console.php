<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

Schedule::call(function () {
    $expiredOrders = Order::with('items')->where('status', 'pending')
        ->where('created_at', '<', now()->subHours(24))
        ->get();

    foreach ($expiredOrders as $order) {
        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled']);
            
            // Return stock
            foreach ($order->items as $item) {
                if ($item->variant_id) {
                    ProductVariant::where('id', $item->variant_id)->increment('stok', $item->qty);
                } else {
                    Product::where('id', $item->product_id)->increment('stok', $item->qty);
                }
            }
        });
    }
})->hourly();
