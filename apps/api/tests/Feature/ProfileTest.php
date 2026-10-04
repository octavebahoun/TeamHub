<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\CurrentOrganization;
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

it('anonymizes the account and keeps work done in a shared organization', function () {
    $owner = User::factory()->create();
    $org = Organization::create(['name' => 'SharedCo', 'slug' => 'shared-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);

    $member = User::factory()->create(['email' => 'membre@test.com', 'password' => 'mot-de-passe']);
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);
    $member->update(['current_organization_id' => $org->id]);
    $member->createToken('phone');

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site']);
    $project->members()->attach([$owner->id, $member->id]);
    $task = Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $member->id,
        'title' => 'Ma tâche',
    ]);
    CurrentOrganization::set(null);

    $this->actingAs($member, 'sanctum')
        ->deleteJson('/api/v1/me')
        ->assertNoContent();

    $fresh = $member->fresh();
    expect($fresh->name)->toBe('Compte supprimé')
        ->and($fresh->email)->toBe('deleted-'.$member->id.'@compte.supprime')
        ->and($fresh->tokens)->toHaveCount(0)
        ->and($fresh->memberships)->toHaveCount(0)
        ->and($task->fresh()->title)->toBe('Ma tâche')
        ->and($task->fresh()->created_by)->toBe($member->id)
        ->and(Organization::find($org->id))->not->toBeNull();

    $this->postJson('/api/v1/auth/login', ['email' => 'membre@test.com', 'password' => 'mot-de-passe'])
        ->assertStatus(422);
});

it('refuses to delete the owner of an organization that still has members', function () {
    $owner = User::factory()->create(['email' => 'patron@test.com']);
    $org = Organization::create(['name' => 'Famille', 'slug' => 'famille-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    $this->actingAs($owner, 'sanctum')
        ->deleteJson('/api/v1/me')
        ->assertStatus(422)
        ->assertJsonPath('message', 'Transférez la propriété de Famille avant de supprimer votre compte.');

    expect($owner->fresh()->email)->toBe('patron@test.com')
        ->and(Organization::find($org->id))->not->toBeNull();
});

it('removes an organization when its only member deletes their account', function () {
    $owner = User::factory()->create();
    $org = Organization::create(['name' => 'Solo', 'slug' => 'solo-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $this->actingAs($owner, 'sanctum')
        ->deleteJson('/api/v1/me')
        ->assertNoContent();

    expect(Organization::find($org->id))->toBeNull()
        ->and($owner->fresh()->name)->toBe('Compte supprimé')
        ->and($owner->fresh()->current_organization_id)->toBeNull();
});
