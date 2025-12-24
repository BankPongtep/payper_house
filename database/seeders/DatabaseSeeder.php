<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;
use App\Models\Asset;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an Owner
        $owner = User::firstOrCreate(
            ['email' => 'owner@payper.com'],
            [
                'name' => 'Owner User',
                'password' => bcrypt('password'),
                'role' => 'owner',
            ]
        );

        // Create a Customer
        $customer = Customer::create([
            'owner_id' => $owner->id,
            'name' => 'Test Customer',
            'phone' => '0812345678',
            'id_card_number' => '1234567890123',
            'address' => '123 Test St, Bangkok',
        ]);

        // Create an Asset
        $asset = Asset::create([
            'owner_id' => $owner->id,
            'name' => 'Honda Wave 110i',
            'description' => 'Red color, 2024 model',
            'price' => 45000,
            'status' => 'available',
        ]);
    }
}
