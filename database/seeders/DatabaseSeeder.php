<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        if (!User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'is_admin' => false,
            ]);
        }

        if (!User::where('email', 'admin@yopihijab.com')->exists()) {
            User::factory()->create([
                'name' => 'Admin Yopi Hijab',
                'email' => 'admin@yopihijab.com',
                'password' => bcrypt('password123'),
                'is_admin' => true,
            ]);
        }

        $this->call(ProductSeeder::class);
    }
}
