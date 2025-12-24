<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    Route::apiResource('assets', \App\Http\Controllers\Api\AssetController::class);
    
    Route::post('/contracts/preview', [\App\Http\Controllers\Api\ContractController::class, 'preview']);
    Route::apiResource('contracts', \App\Http\Controllers\Api\ContractController::class);
    
    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::post('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
});
