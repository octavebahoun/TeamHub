<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('updates the profile and keeps emails unique', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/me', [
            'name' => 'Nouveau Nom',
            'email' => 'nouveau@test.com',
            'title' => 'Chef de projet',
            'phone' => '+229 01 02 03 04',
        ])
        ->assertOk()
        ->assertJsonPath('user.name', 'Nouveau Nom')
        ->assertJsonPath('user.email', 'nouveau@test.com')
        ->assertJsonPath('user.title', 'Chef de projet')
        ->assertJsonPath('user.phone', '+229 01 02 03 04')
        ->assertJsonMissingPath('user.password');

    // Garder sa propre adresse est permis, prendre celle d'un autre non.
    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/me', ['email' => 'nouveau@test.com'])
        ->assertOk();

    $this->actingAs($user, 'sanctum')
        ->patchJson('/api/v1/me', ['email' => $other->email])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

it('changes the password only with the current one', function () {
    $user = User::factory()->create(['password' => 'ancien-mdp']);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/me/password', ['current_password' => 'faux', 'password' => 'nouveau-mdp'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['current_password']);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/me/password', ['current_password' => 'ancien-mdp', 'password' => 'court'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['password']);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/me/password', ['current_password' => 'ancien-mdp', 'password' => 'nouveau-mdp'])
        ->assertOk();

    expect(Hash::check('nouveau-mdp', $user->fresh()->password))->toBeTrue();
});

it('returns default notification preferences and persists changes', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/me/notifications')
        ->assertOk()
        ->assertExactJson([
            'task_assigned' => true,
            'due_reminder' => true,
            'chat_messages' => true,
            'weekly_digest' => false,
        ]);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/me/notifications', ['weekly_digest' => true, 'chat_messages' => false, 'unknown' => true])
        ->assertOk()
        ->assertJsonPath('weekly_digest', true)
        ->assertJsonPath('chat_messages', false)
        ->assertJsonMissingPath('unknown');

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/me/notifications')
        ->assertJsonPath('weekly_digest', true)
        ->assertJsonPath('task_assigned', true);

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/me/notifications', ['weekly_digest' => 'pas-un-booleen'])
        ->assertStatus(422);
});
