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
            $table->renameColumn('tax_rate', 'cross_island_fee');
            $table->renameColumn('provinces', 'islands');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', function (Blueprint $table) {
            $table->renameColumn('cross_island_fee', 'tax_rate');
            $table->renameColumn('islands', 'provinces');
        });
    }
};
