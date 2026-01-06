<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDetailsToReceiptsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->string('receipt_number')->unique()->after('id');
            $table->foreignId('contract_id')->after('receipt_number')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('issued_by')->nullable()->after('amount')->constrained('users'); // Owner who approved
            $table->foreignId('payment_proof_id')->nullable()->after('installment_id')->constrained('payment_proofs');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropForeign(['issued_by']);
            $table->dropForeign(['payment_proof_id']);
            $table->dropColumn(['receipt_number', 'contract_id', 'issued_by', 'payment_proof_id']);
        });
    }
}
