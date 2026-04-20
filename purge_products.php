<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

echo "Memulai Pembersihan Total Produk (V2)...\n";

try {
    // 1. Matikan Foreign Key Check (MySQL)
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    // 2. Kosongkan Tabel (Satu per satu tanpa transaksi karena truncate bersifat DDL)
    echo "- Mengosongkan tabel detail...\n";
    DB::table('product_images')->truncate();
    DB::table('product_variants')->truncate();
    DB::table('reviews')->truncate();
    DB::table('carts')->truncate();
    DB::table('order_items')->truncate();
    DB::table('orders')->truncate();
    
    echo "- Mengosongkan tabel products...\n";
    DB::table('products')->truncate();

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    // 3. Hapus File Fisik
    echo "- Menghapus file fisik di storage/products...\n";
    $files = Storage::disk('public')->allFiles('products');
    foreach($files as $file) {
        Storage::disk('public')->delete($file);
    }
    
    // Pastikan folder bersih
    Storage::disk('public')->deleteDirectory('products');
    Storage::disk('public')->makeDirectory('products');
    Storage::disk('public')->makeDirectory('products/variants');

    echo "\nBERHASIL! Semua data produk dan file telah dihapus bersih.\n";
    echo "Sistem sekarang dalam keadaan kosong total.\n";

} catch (\Exception $e) {
    echo "\nGAGAL: " . $e->getMessage() . "\n";
}
