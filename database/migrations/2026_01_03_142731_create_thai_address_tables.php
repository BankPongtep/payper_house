<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateThaiAddressTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('name_th');
            $table->string('name_en');
            $table->timestamps();
        });

        Schema::create('amphures', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('name_th');
            $table->string('name_en');
            $table->integer('province_id');
            $table->timestamps();

            $table->foreign('province_id')->references('id')->on('provinces')->onDelete('cascade');
        });

        Schema::create('tambons', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('name_th');
            $table->string('name_en');
            $table->integer('amphure_id');
            $table->integer('zip_code')->nullable();
            $table->timestamps();

            $table->foreign('amphure_id')->references('id')->on('amphures')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tambons');
        Schema::dropIfExists('amphures');
        Schema::dropIfExists('provinces');
    }
}
