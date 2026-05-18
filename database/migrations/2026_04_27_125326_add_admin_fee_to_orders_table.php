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
            $table->decimal('admin_fee_percentage', 5, 2)->default(2.50)->after('total_amount'); // Default 2.5%
            $table->decimal('admin_fee_amount', 15, 2)->default(0)->after('admin_fee_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['admin_fee_percentage', 'admin_fee_amount']);
        });
    }
};
