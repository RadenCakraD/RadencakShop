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
        Schema::table('users', function (Blueprint $table) {
            $table->string('coverage_province')->nullable()->after('mitra_name');
            $table->string('coverage_regency')->nullable()->after('coverage_province');
            $table->string('coverage_district')->nullable()->after('coverage_regency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['coverage_province', 'coverage_regency', 'coverage_district']);
        });
    }
};
