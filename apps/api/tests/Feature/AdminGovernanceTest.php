<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Services\RealtimePublisher;
use App\Support\CurrentOrganization;

// Organisation avec un membre par rôle utile : owner, admin, admin2, member.
function governanceOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => 'GovCo', 'slug' => 'gov-'.uniqid(), 'owner_id' => $owner->id]);
    $users = ['owner' => $owner];
    foreach (['owner' => $owner, 'admin' => null, 'admin2' => null, 'member' => null] as $key => $user) {
        $user ??= User::factory()->create();
        $role = $key === 'admin2' ? Membership::ROLE_ADMIN : $key;
        Membership::create(['user_id' => $user->id, 'organization_id' => $org->id, 'role' => $role]);
        $users[$key] = $user;
    }

    return [$org, $users];
}

afterEach(fn () => CurrentOrganization::set(null));

it('reserves inviting an admin to the owner', function () {
    [$org, $u] = governanceOrg();

    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'new-admin@test.com', 'role' => 'admin'])
        ->assertForbidden();

    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'new-member@test.com', 'role' => 'member'])
        ->assertCreated();

    $this->actingAs($u['owner'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'new-admin@test.com', 'role' => 'admin'])
        ->assertCreated();
});

it('reserves promoting or demoting an admin to the owner', function () {
    [$org, $u] = governanceOrg();

    // Un admin ne peut ni promouvoir un membre admin, ni rétrograder un autre admin.
    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/members/{$u['member']->id}", ['role' => 'admin'])
        ->assertForbidden();
    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/members/{$u['admin2']->id}", ['role' => 'member'])
        ->assertForbidden();

    // Il peut toujours gérer les autres rôles.
    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/members/{$u['member']->id}", ['role' => 'manager'])
        ->assertOk();

    $this->actingAs($u['owner'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/members/{$u['admin2']->id}", ['role' => 'member'])
        ->assertOk()
        ->assertJsonPath('role', 'member');
});

it('reserves removing an admin to the owner', function () {
    [$org, $u] = governanceOrg();

    $this->actingAs($u['admin'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/members/{$u['admin2']->id}")
        ->assertForbidden();

    $this->actingAs($u['owner'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/members/{$u['admin2']->id}")
        ->assertOk();
});

it('cuts access immediately when a member is removed', function () {
    [$org, $u] = governanceOrg();
    $member = $u['member'];

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $u['owner']->id, 'name' => 'Shared']);
    $project->members()->attach([$u['owner']->id, $member->id]);
    CurrentOrganization::set(null);

    $this->mock(RealtimePublisher::class, function ($mock) use ($member, $org, $project, $u) {
        $mock->shouldReceive('projectEvent')->once()
            ->withArgs(fn ($action, $orgId, $projectId, $payload) => $action === 'project.members_changed'
                && $orgId === $org->id
                && $projectId === $project->id
                && $payload['member_ids'] === [$u['owner']->id]);
        $mock->shouldReceive('revokeUser')->once()->with($member->id, $org->id);
    });

    $this->actingAs($u['owner'], 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/members/{$member->id}")
        ->assertOk();

    expect($project->members()->whereKey($member->id)->exists())->toBeFalse();

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/projects')
        ->assertForbidden();
});

it('closes other sessions when the password changes', function () {
    $user = User::factory()->create(['password' => 'ancien-mdp']);
    $current = $user->createToken('current')->plainTextToken;
    $user->createToken('other-device');

    $this->withToken($current)
        ->putJson('/api/v1/me/password', ['current_password' => 'ancien-mdp', 'password' => 'nouveau-mdp'])
        ->assertOk();

    expect($user->tokens()->pluck('name')->all())->toBe(['current']);
});
