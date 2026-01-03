<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateContractsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users');
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('asset_id')->constrained('assets');
            $table->string('contract_number')->unique();
            $table->string('type')->default('hire_purchase'); // hire_purchase, loan
            $table->decimal('total_price', 15, 2);
            $table->decimal('down_payment', 15, 2)->default(0);
            $table->decimal('principal_amount', 15, 2); // total - down
            $table->decimal('interest_rate', 5, 2)->default(0); // percent per year/month? Usually flat or effective. Assuming simple flat for now based on context.
            $table->integer('installments_count'); // number of months
            $table->decimal('installment_amount', 15, 2);
            $table->date('start_date');
            $table->string('status')->default('active'); // active, completed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
}
;
