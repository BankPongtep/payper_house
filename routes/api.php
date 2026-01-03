<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User management (admin and owner only)
    Route::middleware(['role:admin,owner'])->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/toggle-lock', [UserController::class, 'toggleLock']);
    });

    // Settings (Admin only)
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
        Route::put('/settings', [\App\Http\Controllers\Api\SettingController::class, 'update']);
    });

    Route::apiResource('assets', \App\Http\Controllers\Api\AssetController::class);

    Route::post('/contracts/preview', [\App\Http\Controllers\Api\ContractController::class, 'preview']);
    Route::apiResource('contracts', \App\Http\Controllers\Api\ContractController::class);

    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::post('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);
    // Thai Address API
    Route::get('/thai-address/provinces', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getProvinces']);
    Route::get('/thai-address/amphures/{province}', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getAmphures']);
    Route::get('/thai-address/tambons/{amphure}', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getTambons']);
});

