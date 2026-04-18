<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\VoucherController;

try {
    $admin = User::where('email', 'radencakstudio@gmail.com')->first();
    $request = Request::create('/api/vouchers', 'GET');
    $request->setUserResolver(function () use ($admin) {
        return $admin;
    });

    $controller = new VoucherController();
    $response = $controller->index($request);
    
    echo "Raw Output: " . json_encode($response->getData()) . "\n";
} catch (\Exception $e) {
    echo "ERROR!\n" . $e->getMessage();
}
