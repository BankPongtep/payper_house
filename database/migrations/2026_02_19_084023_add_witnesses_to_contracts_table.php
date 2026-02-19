<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddWitnessesToContractsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('witness1_name')->nullable();
            $table->string('witness1_signature_path')->nullable();
            $table->string('witness2_name')->nullable();
            $table->string('witness2_signature_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['witness1_name', 'witness1_signature_path', 'witness2_name', 'witness2_signature_path']);
        });
    }
}
