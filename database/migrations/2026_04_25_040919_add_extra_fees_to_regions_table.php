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
            $table->decimal('partner_fee', 10, 2)->default(0)->after('shipping_fee_cepat');
            $table->decimal('logistics_fee', 10, 2)->default(0)->after('partner_fee');
            $table->decimal('courier_staff_fee', 10, 2)->default(0)->after('logistics_fee');
            $table->decimal('logistics_staff_fee', 10, 2)->default(0)->after('courier_staff_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn(['partner_fee', 'logistics_fee', 'courier_staff_fee', 'logistics_staff_fee']);
        });
    }
};
