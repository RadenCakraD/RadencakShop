<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
$user = User::where('email', 'radencakstudio@gmail.com')->first();
if ($user) {
    echo "Found user!\n";
    echo "ID: " . $user->id . "\n";
    echo "Email: " . $user->email . "\n";
    echo "Username: " . $user->username . "\n";
    echo "Role: " . $user->role . "\n";
    
    // Test the password
    if (password_verify('Raden 5254', $user->password)) {
        echo "Password 'Raden 5254' is CORRECT.\n";
    } else {
        echo "Password 'Raden 5254' is INCORRECT!\n";
        // Reset password just in case
        $user->password = Hash::make('Raden 5254');
        $user->save();
        echo "Password has been forcibly re-hashed.\n";
    }
} else {
    echo "User NOT found!\n";
}
