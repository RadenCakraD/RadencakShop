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
        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('service_fee', 10, 2)->default(500);
            $table->decimal('shipping_fee_santai', 10, 2)->default(5000);
            $table->decimal('shipping_fee_cepat', 10, 2)->default(15000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
