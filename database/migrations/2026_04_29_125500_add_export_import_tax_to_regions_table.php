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
            $table->decimal('export_tax_rate', 5, 2)->default(0)->after('tax_rate');
            $table->decimal('import_tax_rate', 5, 2)->default(0)->after('export_tax_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', function (Blueprint $table) {
            $table->dropColumn(['export_tax_rate', 'import_tax_rate']);
        });
    }
};
