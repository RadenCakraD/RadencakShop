<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ProductImage;
use App\Models\ProductVariant;

echo "--- ALL IMAGE URLS ---\n";
foreach(ProductImage::all() as $i) {
    echo "ID: {$i->id} | P_ID: {$i->product_id} | URL: {$i->image_url}\n";
}

echo "\n--- ALL VARIANT NAMES ---\n";
foreach(ProductVariant::all() as $v) {
    echo "ID: {$v->id} | P_ID: {$v->product_id} | Name: {$v->nama_jenis} | URL: {$v->image_url}\n";
}
