<?php

use Illuminate\Support\Facades\Route;

Route::get('/login', function () {
    return response()->json(['message' => 'Unauthorized'], 401);
})->name('login');

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
