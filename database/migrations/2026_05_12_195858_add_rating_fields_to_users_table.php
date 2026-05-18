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
            $table->decimal('rating', 3, 2)->default(5.00)->after('status'); // Average rating (e.g. 4.85)
            $table->integer('rating_count')->default(0)->after('rating');    // Total number of ratings received
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['rating', 'rating_count']);
        });
    }
};
