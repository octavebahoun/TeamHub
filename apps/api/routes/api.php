<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\OrganizationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [MeController::class, 'show']);
        Route::post('organizations/{organization}/switch', [OrganizationController::class, 'switch']);
        Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

        Route::middleware('organization')->group(function () {
            Route::post('invitations', [InvitationController::class, 'store']);
        });
    });
});
