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
        Schema::table('products', function (Blueprint $table) {
            $table->index('shop_id');
            $table->index('kategori');
            $table->index('is_flash_sale');
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('shop_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['shop_id']);
            $table->dropIndex(['kategori']);
            $table->dropIndex(['is_flash_sale']);
        });

        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['shop_id']);
            $table->dropIndex(['status']);
        });
    }
};
