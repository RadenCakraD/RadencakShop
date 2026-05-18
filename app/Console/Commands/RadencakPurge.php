<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RadencakPurge extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'radencak:purge';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pembersihan Total Produk, Varian, Gambar, dan Data Pesanan terkait.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('Apakah Anda yakin ingin menghapus SELURUH data produk dan pesanan? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        $this->info("Memulai Pembersihan Total Produk...");

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            $this->warn("- Mengosongkan tabel detail...");
            DB::table('product_images')->truncate();
            DB::table('product_variants')->truncate();
            DB::table('reviews')->truncate();
            DB::table('carts')->truncate();
            DB::table('order_items')->truncate();
            DB::table('orders')->truncate();
            DB::table('order_trackings')->truncate();
            
            $this->warn("- Mengosongkan tabel products...");
            DB::table('products')->truncate();

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->warn("- Menghapus file fisik di storage/products...");
            Storage::disk('public')->deleteDirectory('products');
            Storage::disk('public')->makeDirectory('products');
            Storage::disk('public')->makeDirectory('products/variants');

            $this->info("BERHASIL! Semua data produk dan file telah dihapus bersih.");

        } catch (\Exception $e) {
            $this->error("GAGAL: " . $e->getMessage());
        }
    }
}
