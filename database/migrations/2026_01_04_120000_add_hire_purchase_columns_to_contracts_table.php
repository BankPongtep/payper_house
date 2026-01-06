<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddHirePurchaseColumnsToContractsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('contract_type')->default('installment');
            $table->decimal('balloon_payment', 15, 2)->nullable();
            $table->unsignedBigInteger('parent_contract_id')->nullable();
            $table->date('end_date')->nullable();
            $table->date('original_end_date')->nullable();

            $table->foreign('parent_contract_id')
                ->references('id')
                ->on('contracts')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['parent_contract_id']);
            $table->dropColumn(['contract_type', 'balloon_payment', 'parent_contract_id', 'end_date', 'original_end_date']);
        });
    }
}
