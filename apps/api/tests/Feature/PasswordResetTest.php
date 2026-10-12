<?php

use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

it('sends a reset link without revealing whether the account exists', function () {
    Notification::fake();
    config(['app.frontend_url' => 'https://wine.test']);

    $user = User::factory()->create(['email' => 'alice@test.com']);

    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'alice@test.com'])
        ->assertOk()
        ->assertJsonPath('message', PasswordResetController::SENT_MESSAGE);

    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'inconnu@test.com'])
        ->assertOk()
        ->assertJsonPath('message', PasswordResetController::SENT_MESSAGE);

    Notification::assertSentTo($user, ResetPasswordNotification::class, function (ResetPasswordNotification $notification) use ($user) {
        $url = $notification->resetUrl($user->email);

        return str_starts_with($url, 'https://wine.test/mot-de-passe-oublie/reinitialiser?')
            && str_contains($url, 'token='.$notification->token)
            && str_contains($url, 'email=alice%40test.com');
    });
    Notification::assertCount(1);
});

it('does not send a second email while the first link is still fresh', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
    $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentToTimes($user, ResetPasswordNotification::class, 1);
});

it('rejects a malformed email', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'pas-un-email'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('email');
});

it('resets the password, revokes sessions, and burns the token', function () {
    $user = User::factory()->create([
        'email' => 'alice@test.com',
        'password' => 'ancien-mot-de-passe',
    ]);
    $access = $user->createToken('api')->plainTextToken;
    $token = Password::broker()->createToken($user);

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => 'alice@test.com',
        'token' => $token,
        'password' => 'nouveau-mdp',
        'password_confirmation' => 'nouveau-mdp',
    ])->assertOk();

    expect(Hash::check('nouveau-mot-de-passe', $user->fresh()->password))->toBeFalse()
        ->and(Hash::check('nouveau-mdp', $user->fresh()->password))->toBeTrue()
        ->and($user->fresh()->tokens()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->withToken($access)->getJson('/api/v1/me')->assertUnauthorized();

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => 'alice@test.com',
        'token' => $token,
        'password' => 'encore-un-mdp',
        'password_confirmation' => 'encore-un-mdp',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

it('rejects an expired reset link', function () {
    $user = User::factory()->create();
    $token = Password::broker()->createToken($user);

    $this->travel(61)->minutes();

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => $user->email,
        'token' => $token,
        'password' => 'nouveau-mdp',
        'password_confirmation' => 'nouveau-mdp',
    ])->assertStatus(422);
});

it('rejects a confirmation that does not match', function () {
    $user = User::factory()->create();
    $token = Password::broker()->createToken($user);

    $this->postJson('/api/v1/auth/reset-password', [
        'email' => $user->email,
        'token' => $token,
        'password' => 'nouveau-mdp',
        'password_confirmation' => 'autre-chose',
    ])->assertStatus(422)->assertJsonValidationErrors('password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});
