<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Banner;
use App\Models\Product;
use App\Models\Voucher;
use Illuminate\Http\Request;

echo "Testing Admin Data fetch...\n";
try {
    $banners = Banner::all();
    echo "Banners: " . count($banners) . "\n";
    $products = Product::with('shop')->get();
    echo "Products: " . count($products) . "\n";
    $users = User::with('shop')->get();
    echo "Users: " . count($users) . "\n";
    $vouchers = Voucher::whereNull('shop_id')->get();
    echo "Vouchers: " . count($vouchers) . "\n";
    echo "\nAll DB queries passed without crash.\n";
} catch (\Exception $e) {
    echo "CRASH!\n";
    echo $e->getMessage();
}
