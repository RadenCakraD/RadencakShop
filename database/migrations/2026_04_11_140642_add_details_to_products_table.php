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
            $table->decimal('harga_jual', 15, 2)->default(0);
            $table->decimal('harga_dasar', 15, 2)->default(0);
            $table->string('kondisi')->default('baru');
            $table->integer('stok')->default(0);
            $table->decimal('berat', 8, 2)->default(0);
            $table->integer('panjang')->default(1);
            $table->integer('lebar')->default(1);
            $table->integer('tinggi')->default(1);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'harga_jual', 'harga_dasar', 'kondisi', 'stok', 'berat', 'panjang', 'lebar', 'tinggi'
            ]);
        });
    }
};
