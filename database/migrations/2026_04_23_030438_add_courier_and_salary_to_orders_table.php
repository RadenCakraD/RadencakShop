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
            if (!Schema::hasColumn('orders', 'pickup_courier_id')) {
                $table->foreignId('pickup_courier_id')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('orders', 'logistics_id')) {
                $table->foreignId('logistics_id')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('orders', 'delivery_courier_id')) {
                $table->foreignId('delivery_courier_id')->nullable()->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('orders', 'pickup_fee_earned')) {
                $table->decimal('pickup_fee_earned', 12, 2)->default(0);
            }
            
            // Note: the 'status' column in orders should be able to hold:
            // pending, processing, ready_for_pickup, picking_up, at_logistics, delivering, delivered, completed, cancelled.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['pickup_courier_id']);
            $table->dropForeign(['logistics_id']);
            $table->dropForeign(['delivery_courier_id']);
            $table->dropColumn([
                'pickup_courier_id', 
                'logistics_id', 
                'delivery_courier_id', 
                'pickup_fee_earned'
            ]);
        });
    }
};
