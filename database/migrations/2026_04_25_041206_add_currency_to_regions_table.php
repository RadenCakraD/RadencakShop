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
            $table->string('currency_code', 10)->default('IDR')->after('name');
            $table->string('currency_symbol', 10)->default('Rp')->after('currency_code');
            $table->decimal('exchange_rate', 15, 6)->default(1.000000)->after('currency_symbol');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn(['currency_code', 'currency_symbol', 'exchange_rate']);
        });
    }
};
