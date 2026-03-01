<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVatAndInterestToUsersTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('vat_rate', 5, 2)->nullable()->after('payment_qr_code')->comment('Custom VAT rate for this user. If null, use global setting.');
            $table->decimal('interest_rate', 5, 2)->nullable()->after('vat_rate')->comment('Custom interest rate for this user. If null, use global setting.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['vat_rate', 'interest_rate']);
        });
    }
}
