<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function makeOrgWith(string $role): array
{
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => 'Org-'.uniqid(),
        'slug' => 'org-'.uniqid(),
        'owner_id' => $user->id,
    ]);
    Membership::create([
        'user_id' => $user->id,
        'organization_id' => $org->id,
        'role' => $role,
    ]);
    $user->update(['current_organization_id' => $org->id]);

    return [$user, $org];
}

afterEach(fn () => CurrentOrganization::set(null));

it('allows managers to create projects', function () {
    [$manager, $org] = makeOrgWith(Membership::ROLE_MANAGER);

    $this->actingAs($manager, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Managed'])
        ->assertCreated();
});

it('forbids simple members from creating projects', function () {
    [$owner, $org] = makeOrgWith(Membership::ROLE_OWNER);
    $member = User::factory()->create();
    Membership::create([
        'user_id' => $member->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    $this->actingAs($member, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Forbidden'])
        ->assertForbidden();
});

it('allows the project owner to update their project even as member', function () {
    [$owner, $org] = makeOrgWith(Membership::ROLE_OWNER);
    $member = User::factory()->create();
    Membership::create([
        'user_id' => $member->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);
    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $member->id,
        'name' => 'Owned by member',
    ]);
    CurrentOrganization::set(null);

    $this->actingAs($member, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->patchJson('/api/v1/projects/'.$project->id, ['name' => 'Renamed'])
        ->assertOk();
});
