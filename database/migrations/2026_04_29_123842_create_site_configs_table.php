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
        Schema::create('site_configs', function (Blueprint $label) {
            $label->id();
            $label->string('key')->unique();
            $label->text('value')->nullable();
            $label->timestamps();
        });

        // Seed default values
        DB::table('site_configs')->insert([
            ['key' => 'platform_fee_percent', 'value' => '2.5'],
            ['key' => 'tax_percent', 'value' => '0'],
            ['key' => 'min_withdrawal', 'value' => '50000'],
            ['key' => 'site_name', 'value' => 'Radencak Shop'],
            ['key' => 'maintenance_mode', 'value' => '0'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_configs');
    }
};
