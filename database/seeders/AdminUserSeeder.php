<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'radencakstudio@gmail.com'],
            [
                'name' => 'Owner RadenCak',
                'username' => 'RadenDCak',
                'password' => Hash::make('Raden5254'),
                'role' => 'admin',
            ]
        );
    }
}
