<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;

echo "--- PRODUCTS ---\n";
$products = Product::all();
foreach($products as $p) {
    echo "ID: {$p->id} | Name: {$p->nama_produk}\n";
}

echo "\n--- IMAGES ---\n";
$images = ProductImage::all();
foreach($images as $img) {
    echo "P_ID: {$img->product_id} | URL: {$img->image_url} | Primary: " . ($img->is_primary ? 'Y' : 'N') . "\n";
}

echo "\n--- VARIANTS ---\n";
$variants = ProductVariant::all();
foreach($variants as $v) {
    echo "P_ID: {$v->product_id} | Name: {$v->nama_jenis} | Img: {$v->image_url}\n";
}
