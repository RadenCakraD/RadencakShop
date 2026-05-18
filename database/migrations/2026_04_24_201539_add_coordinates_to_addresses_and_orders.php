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
        Schema::table('user_addresses', function (Blueprint $table) {
            if (Schema::hasColumn('user_addresses', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->change();
            } else {
                $table->decimal('latitude', 10, 8)->nullable();
            }

            if (Schema::hasColumn('user_addresses', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->change();
            } else {
                $table->decimal('longitude', 11, 8)->nullable();
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('shipping_latitude', 10, 8)->nullable()->after('address_info');
            $table->decimal('shipping_longitude', 11, 8)->nullable()->after('shipping_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_addresses', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_latitude', 'shipping_longitude']);
        });
    }
};
