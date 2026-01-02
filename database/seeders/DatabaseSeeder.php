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
        // ====================================
        // 1. Create Admin User
        // ====================================
        $admin = User::firstOrCreate(
            ['email' => 'admin@payper.com'],
            [
                'name' => 'ผู้ดูแลระบบ',
                'password' => bcrypt('password'),
                'role' => 'admin',
            ]
        );

        // ====================================
        // 2. Create Owner Users (Landlords)
        // ====================================
        $owner1 = User::firstOrCreate(
            ['email' => 'owner1@payper.com'],
            [
                'name' => 'สมชาย เจ้าของบ้าน',
                'password' => bcrypt('password'),
                'role' => 'owner',
            ]
        );

        $owner2 = User::firstOrCreate(
            ['email' => 'owner2@payper.com'],
            [
                'name' => 'สมหญิง เจ้าของห้อง',
                'password' => bcrypt('password'),
                'role' => 'owner',
            ]
        );

        // ====================================
        // 3. Create Customer Users (Tenants)
        // ====================================

        // Customers for Owner 1
        $customerUser1 = User::firstOrCreate(
            ['email' => 'tenant1@payper.com'],
            [
                'name' => 'นายสมปอง ผู้เช่า',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ]
        );

        $customerUser2 = User::firstOrCreate(
            ['email' => 'tenant2@payper.com'],
            [
                'name' => 'นางสาวมะลิ รักเรียน',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ]
        );

        // Customers for Owner 2
        $customerUser3 = User::firstOrCreate(
            ['email' => 'tenant3@payper.com'],
            [
                'name' => 'นายวิชัย ใจดี',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ]
        );

        $customerUser4 = User::firstOrCreate(
            ['email' => 'tenant4@payper.com'],
            [
                'name' => 'นางสาวน้ำฝน สายลม',
                'password' => bcrypt('password'),
                'role' => 'customer',
            ]
        );

        // ====================================
        // 4. Create Customer Profiles (Link to Owners)
        // ====================================

        // Customers linked to Owner 1
        $customer1 = Customer::firstOrCreate(
            ['user_id' => $customerUser1->id],
            [
                'owner_id' => $owner1->id,
                'name' => 'นายสมปอง ผู้เช่า',
                'phone' => '081-234-5678',
                'id_card_number' => '1100501234567',
                'address' => '123 ซอยสุขใจ แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500',
            ]
        );

        $customer2 = Customer::firstOrCreate(
            ['user_id' => $customerUser2->id],
            [
                'owner_id' => $owner1->id,
                'name' => 'นางสาวมะลิ รักเรียน',
                'phone' => '089-876-5432',
                'id_card_number' => '1100502345678',
                'address' => '456 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
            ]
        );

        // Customers linked to Owner 2
        $customer3 = Customer::firstOrCreate(
            ['user_id' => $customerUser3->id],
            [
                'owner_id' => $owner2->id,
                'name' => 'นายวิชัย ใจดี',
                'phone' => '062-111-2222',
                'id_card_number' => '1100503456789',
                'address' => '789 ซอยอ่อนนุช แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ 10250',
            ]
        );

        $customer4 = Customer::firstOrCreate(
            ['user_id' => $customerUser4->id],
            [
                'owner_id' => $owner2->id,
                'name' => 'นางสาวน้ำฝน สายลม',
                'phone' => '095-333-4444',
                'id_card_number' => '1100504567890',
                'address' => '321 ซอยลาดพร้าว แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
            ]
        );

        // ====================================
        // 5. Create Assets for Owners
        // ====================================

        // Assets for Owner 1
        Asset::firstOrCreate(
            ['name' => 'ห้องพัก A101'],
            [
                'owner_id' => $owner1->id,
                'description' => 'ห้องพักขนาด 24 ตร.ม. พร้อมเฟอร์นิเจอร์ แอร์ 1 ตัว',
                'price' => 4500,
                'status' => 'available',
            ]
        );

        Asset::firstOrCreate(
            ['name' => 'ห้องพัก A102'],
            [
                'owner_id' => $owner1->id,
                'description' => 'ห้องพักขนาด 28 ตร.ม. พร้อมเฟอร์นิเจอร์ แอร์ 1 ตัว ระเบียง',
                'price' => 5500,
                'status' => 'rented',
            ]
        );

        Asset::firstOrCreate(
            ['name' => 'Honda Wave 110i สีแดง'],
            [
                'owner_id' => $owner1->id,
                'description' => 'รถจักรยานยนต์ ปี 2024 ไมล์ 5,000 กม.',
                'price' => 45000,
                'status' => 'available',
            ]
        );

        // Assets for Owner 2
        Asset::firstOrCreate(
            ['name' => 'ห้องพัก B201'],
            [
                'owner_id' => $owner2->id,
                'description' => 'ห้องพักขนาด 30 ตร.ม. ห้องน้ำในตัว แอร์ 1 ตัว',
                'price' => 6000,
                'status' => 'available',
            ]
        );

        Asset::firstOrCreate(
            ['name' => 'ห้องพัก B202'],
            [
                'owner_id' => $owner2->id,
                'description' => 'ห้องพักขนาด 35 ตร.ม. ห้องน้ำในตัว แอร์ 2 ตัว วิวสวน',
                'price' => 7500,
                'status' => 'rented',
            ]
        );

        // Log seeding results
        $this->command->info('✅ Database seeded successfully!');
        $this->command->table(
            ['Role', 'Count'],
            [
                ['Admin', User::where('role', 'admin')->count()],
                ['Owner', User::where('role', 'owner')->count()],
                ['Customer', User::where('role', 'customer')->count()],
            ]
        );
    }
}

