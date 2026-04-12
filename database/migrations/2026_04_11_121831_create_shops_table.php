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
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nama_toko');
            $table->string('url_toko')->unique();
            $table->string('foto_profil')->nullable();
            $table->string('banner_toko')->nullable();
            $table->string('slogan')->nullable();
            $table->string('no_telepon')->nullable();
            $table->text('alamat_toko')->nullable();
            $table->json('kurir')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shops');
    }
};
