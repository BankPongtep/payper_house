<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPromptPayTypeToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Check if column exists before adding it
            if (!Schema::hasColumn('users', 'promptpay_type')) {
                $table->string('promptpay_type')->nullable()->after('bank_account_name');
            }
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
            if (Schema::hasColumn('users', 'promptpay_type')) {
                $table->dropColumn('promptpay_type');
            }
        });
    }
}
