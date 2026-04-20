<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;

$product = Product::with(['images', 'variants'])->where('nama_produk', 'like', '%Stylish%')->first();

if ($product) {
    echo "Product: {$product->nama_produk} (ID: {$product->id})\n";
    echo "Images:\n";
    foreach($product->images as $img) {
        echo " - ID: {$img->id} | URL: {$img->image_url}\n";
    }
    echo "Variants:\n";
    foreach($product->variants as $v) {
        echo " - ID: {$v->id} | Name: {$v->nama_jenis} | Image: {$v->image_url}\n";
    }
} else {
    echo "Product not found\n";
}
