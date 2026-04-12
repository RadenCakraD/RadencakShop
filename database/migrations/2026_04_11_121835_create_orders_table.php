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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('shop_id')->constrained()->onDelete('cascade');
            $table->string('order_number')->unique();
            $table->string('status')->default('Belum Bayar'); // Belum Bayar, Dikemas, Dikirim, Selesai
            $table->decimal('total_amount', 12, 2);
            $table->string('address_info');
            $table->string('payment_method');
            $table->string('shipping_method');
            $table->string('voucher_code')->nullable();
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
