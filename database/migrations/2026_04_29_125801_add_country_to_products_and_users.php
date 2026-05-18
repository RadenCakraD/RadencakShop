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
            $table->string('country')->default('Indonesia')->after('shop_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('country')->default('Indonesia')->after('region_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('country');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('country');
        });
    }
};
