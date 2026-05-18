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
        // 1. Perbarui Tabel Regions untuk mendukung Negara dan Jenis Wilayah
        Schema::table('regions', function (Blueprint $table) {
            $table->string('country')->default('Indonesia')->after('id');
            $table->string('type')->default('city')->after('name'); // e.g., province, city, district
        });

        // 2. Perbarui Tabel Users untuk mendukung Status Verifikasi, Region, dan Parent (Atasan)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('id')->constrained('regions')->onDelete('set null');
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('role'); // pending, active, rejected
            }
            if (!Schema::hasColumn('users', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('status')->comment('ID User pemilik/atasan untuk staff');
            }
            
            // Tambahkan index untuk performa pencarian regional
            $table->index(['region_id', 'status', 'role']);
        });

        // 3. Perbarui Tabel Shops untuk mendukung Region dan Status Verifikasi
        Schema::table('shops', function (Blueprint $table) {
            if (!Schema::hasColumn('shops', 'region_id')) {
                $table->foreignId('region_id')->nullable()->after('id')->constrained('regions')->onDelete('set null');
            }
            if (!Schema::hasColumn('shops', 'status')) {
                $table->string('status')->default('active')->after('shop_tier'); // pending, active, rejected
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shops', function (Blueprint $table) {
            $table->dropColumn(['region_id', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['region_id', 'status', 'parent_id']);
        });

        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn(['country', 'type']);
        });
    }
};
