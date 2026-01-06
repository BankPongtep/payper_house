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

    // Profile Management
    Route::get('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\Api\ProfileController::class, 'update']);

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
    Route::post('assets/{asset}/images/{image}/main', [\App\Http\Controllers\Api\AssetController::class, 'setMainImage']);
    Route::delete('assets/{asset}/images/{image}', [\App\Http\Controllers\Api\AssetController::class, 'deleteImage']);

    Route::post('/contracts/preview', [\App\Http\Controllers\Api\ContractController::class, 'preview']);
    Route::apiResource('contracts', \App\Http\Controllers\Api\ContractController::class);

    Route::apiResource('customers', \App\Http\Controllers\Api\CustomerController::class);
    Route::get('/dashboard/owner-stats', [\App\Http\Controllers\Api\DashboardController::class, 'ownerStats']);
    Route::post('/payments', [\App\Http\Controllers\Api\PaymentController::class, 'store']);

    // Owner Settings
    Route::get('/owner/settings', [\App\Http\Controllers\Api\OwnerSettingController::class, 'index']);
    Route::put('/owner/settings', [\App\Http\Controllers\Api\OwnerSettingController::class, 'update']);
    Route::post('/owner/qrcode', [\App\Http\Controllers\Api\OwnerSettingController::class, 'uploadQrCode']);
    Route::delete('/owner/qrcode', [\App\Http\Controllers\Api\OwnerSettingController::class, 'deleteQrCode']);

    // Customer Contract APIs
    Route::get('/customer/contracts', [\App\Http\Controllers\Api\CustomerContractController::class, 'index']);
    Route::get('/customer/contracts/{id}', [\App\Http\Controllers\Api\CustomerContractController::class, 'show']);
    Route::get('/customer/contracts/{id}/qrcode', [\App\Http\Controllers\Api\CustomerContractController::class, 'getQrCode']);

    // Receipt API
    Route::get('/receipts/{id}', [\App\Http\Controllers\Api\ReceiptController::class, 'show']);

    // Payment Proof APIs - Customer
    Route::get('/customer/payments', [\App\Http\Controllers\Api\PaymentProofController::class, 'customerIndex']);
    Route::post('/customer/payments', [\App\Http\Controllers\Api\PaymentProofController::class, 'store']);

    // Payment Proof APIs - Owner
    Route::get('/owner/payments', [\App\Http\Controllers\Api\PaymentProofController::class, 'ownerIndex']);
    Route::put('/owner/payments/{id}/approve', [\App\Http\Controllers\Api\PaymentProofController::class, 'approve']);
    Route::put('/owner/payments/{id}/reject', [\App\Http\Controllers\Api\PaymentProofController::class, 'reject']);

    // Thai Address API
    Route::get('/thai-address/provinces', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getProvinces']);
    Route::get('/thai-address/amphures/{province}', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getAmphures']);
    Route::get('/thai-address/tambons/{amphure}', [\App\Http\Controllers\Api\ThaiAddressController::class, 'getTambons']);
});

