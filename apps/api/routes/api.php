<?php

use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\MyTaskController;
use App\Http\Controllers\Api\V1\OpportunityController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\ProjectMemberController;
use App\Http\Controllers\Api\V1\PostCommentController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\PostReactionController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\TaskCommentController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Internal\OrganizationMembersController;
use App\Http\Controllers\Internal\VerifyController;
use Illuminate\Support\Facades\Route;

// Health public (routé par Caddy sous /api/up — jamais sous /up).
Route::get('up', fn () => response()->json(['ok' => true, 'service' => 'api']));

Route::prefix('internal')->middleware('internal')->group(function () {
    Route::post('verify', VerifyController::class);
    Route::get('organizations/{organizationId}/members', OrganizationMembersController::class)
        ->whereNumber('organizationId');
});

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    // Invitations publiques (lien reçu par e-mail) : aperçu et création de compte.
    Route::get('invitations/{token}', [InvitationController::class, 'show'])->middleware('throttle:30,1');
    Route::post('invitations/{token}/register', [InvitationController::class, 'register'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [MeController::class, 'show']);
        Route::post('organizations/{organization}/switch', [OrganizationController::class, 'switch']);
        Route::post('invitations/{token}/accept', [InvitationController::class, 'accept']);

        Route::middleware('organization')->group(function () {
            Route::get('invitations', [InvitationController::class, 'index']);
            Route::post('invitations', [InvitationController::class, 'store']);
            Route::delete('invitations/{invitationId}', [InvitationController::class, 'destroy'])->whereNumber('invitationId');
            Route::post('invitations/{invitationId}/resend', [InvitationController::class, 'resend'])->whereNumber('invitationId');

            Route::get('members', [MemberController::class, 'index']);
            Route::patch('members/{user}', [MemberController::class, 'updateRole']);
            Route::delete('members/{user}', [MemberController::class, 'destroy']);

            Route::apiResource('projects', ProjectController::class);
            Route::post('projects/{project}/members', [ProjectMemberController::class, 'store']);
            Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);
            Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
            Route::post('projects/{project}/tasks', [TaskController::class, 'store']);
            Route::get('tasks/{task}', [TaskController::class, 'show']);
            Route::patch('tasks/{task}', [TaskController::class, 'update']);
            Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
            Route::post('tasks/{task}/comments', [TaskCommentController::class, 'store']);
            Route::get('me/tasks', [MyTaskController::class, 'index']);

            Route::apiResource('clients', ClientController::class);
            Route::apiResource('opportunities', OpportunityController::class);

            Route::apiResource('posts', PostController::class);
            Route::post('posts/{post}/pin', [PostController::class, 'pin']);
            Route::post('posts/{post}/reactions', [PostReactionController::class, 'store']);
            Route::delete('posts/{post}/reactions/{emoji}', [PostReactionController::class, 'destroy']);
            Route::post('posts/{post}/comments', [PostCommentController::class, 'store']);

            Route::get('analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('analytics/pipeline', [AnalyticsController::class, 'pipeline']);
            Route::get('analytics/activity', [AnalyticsController::class, 'activity']);
        });
    });
});
