<?php

use Illuminate\Database\Seeder;

class ThaiAddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('tambons')->truncate();
        DB::table('amphures')->truncate();
        DB::table('provinces')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Provinces
        $this->command->info('Fetching and Seeding Provinces...');
        $json = file_get_contents('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province.json');
        $provinces = json_decode($json, true);

        $data = [];
        foreach ($provinces as $p) {
            $data[] = [
                'id' => $p['id'],
                'name_th' => $p['name_th'],
                'name_en' => $p['name_en'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('provinces')->insert($data);

        // 2. Amphures (Districts)
        $this->command->info('Fetching and Seeding Amphures...');
        $json = file_get_contents('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/district.json');
        $amphures = json_decode($json, true);

        $data = [];
        foreach ($amphures as $a) {
            $data[] = [
                'id' => $a['id'],
                'name_th' => $a['name_th'],
                'name_en' => $a['name_en'],
                'province_id' => $a['province_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        foreach (array_chunk($data, 500) as $chunk) {
            DB::table('amphures')->insert($chunk);
        }

        // 3. Tambons (SubDistricts)
        $this->command->info('Fetching and Seeding Tambons...');
        $json = file_get_contents('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/sub_district.json');
        $tambons = json_decode($json, true);

        $data = [];
        foreach ($tambons as $t) {
            $data[] = [
                'id' => $t['id'],
                'name_th' => $t['name_th'],
                'name_en' => $t['name_en'],
                'amphure_id' => $t['district_id'],
                'zip_code' => $t['zip_code'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        foreach (array_chunk($data, 500) as $chunk) {
            DB::table('tambons')->insert($chunk);
        }

        $this->command->info('Thai Address Database Seeded Successfully!');
    }
}
