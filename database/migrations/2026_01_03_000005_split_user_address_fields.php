<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SplitUserAddressFields extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('address_house_no')->nullable()->after('address');
            $table->string('address_village')->nullable()->after('address_house_no');
            $table->string('address_floor')->nullable()->after('address_village');
            $table->string('address_moo')->nullable()->after('address_floor');
            $table->string('address_soi')->nullable()->after('address_moo');
            $table->string('address_road')->nullable()->after('address_soi');
            $table->string('address_sub_district')->nullable()->after('address_road');
            $table->string('address_district')->nullable()->after('address_sub_district');
            $table->string('address_province')->nullable()->after('address_district');
            $table->string('address_postal_code')->nullable()->after('address_province');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address_house_no',
                'address_village',
                'address_floor',
                'address_moo',
                'address_soi',
                'address_road',
                'address_sub_district',
                'address_district',
                'address_province',
                'address_postal_code',
            ]);
        });
    }
}
