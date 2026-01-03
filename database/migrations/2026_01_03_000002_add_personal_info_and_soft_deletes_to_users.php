<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddPersonalInfoAndSoftDeletesToUsers extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('id_card_number')->nullable()->after('phone');
            $table->text('address')->nullable()->after('id_card_number');
            $table->softDeletes();
        });

        // Migrate existing data from customers table to users table
        // We do this using raw SQL for performance and simplicity in migration
        $customers = DB::table('customers')->whereNotNull('user_id')->get();
        foreach ($customers as $customer) {
            DB::table('users')
                ->where('id', $customer->user_id)
                ->update([
                    'phone' => $customer->phone,
                    'id_card_number' => $customer->id_card_number,
                    'address' => $customer->address
                ]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'id_card_number', 'address']);
            $table->dropSoftDeletes();
        });
    }
}
