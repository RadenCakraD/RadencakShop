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
        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn([
                'exchange_rate',
                'partner_fee',
                'logistics_fee',
                'courier_staff_fee',
                'logistics_staff_fee'
            ]);

            $table->decimal('logistics_fee_regular', 12, 2)->default(0)->after('shipping_fee_cepat');
            $table->decimal('courier_fee_regular', 12, 2)->default(0)->after('logistics_fee_regular');
            $table->decimal('logistics_fee_fast', 12, 2)->default(0)->after('courier_fee_regular');
            $table->decimal('courier_fee_fast', 12, 2)->default(0)->after('logistics_fee_fast');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('sender_logistics_id')->nullable()->constrained('users')->onDelete('set null')->after('pickup_courier_id');
            $table->foreignId('receiver_logistics_id')->nullable()->constrained('users')->onDelete('set null')->after('logistics_id');
            
            $table->decimal('logistics_pickup_fee_earned', 12, 2)->default(0)->after('delivery_fee_earned');
            $table->decimal('logistics_delivery_fee_earned', 12, 2)->default(0)->after('logistics_pickup_fee_earned');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn([
                'logistics_fee_regular',
                'courier_fee_regular',
                'logistics_fee_fast',
                'courier_fee_fast'
            ]);

            $table->decimal('exchange_rate', 15, 5)->default(1);
            $table->decimal('partner_fee', 12, 2)->default(2000);
            $table->decimal('logistics_fee', 12, 2)->default(2000);
            $table->decimal('courier_staff_fee', 12, 2)->default(2000);
            $table->decimal('logistics_staff_fee', 12, 2)->default(1000);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['sender_logistics_id']);
            $table->dropForeign(['receiver_logistics_id']);
            $table->dropColumn([
                'sender_logistics_id',
                'receiver_logistics_id',
                'logistics_pickup_fee_earned',
                'logistics_delivery_fee_earned'
            ]);
        });
    }
};
