<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('region_id')->nullable()->after('shop_id')->constrained('regions')->onDelete('set null');
        });

        // Backfill region_id from shop's region_id for existing orders
        $orders = \App\Models\Order::all();
        foreach ($orders as $order) {
            $shop = \App\Models\Shop::find($order->shop_id);
            if ($shop && $shop->region_id) {
                $order->update(['region_id' => $shop->region_id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['region_id']);
            $table->dropColumn('region_id');
        });
    }
};
