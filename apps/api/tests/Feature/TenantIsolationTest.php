<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function makeOrgWithOwner(string $name): array
{
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => $name,
        'slug' => strtolower($name),
        'owner_id' => $user->id,
    ]);
    Membership::create([
        'user_id' => $user->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_OWNER,
    ]);
    $user->update(['current_organization_id' => $org->id]);
    return [$user, $org];
}

it('lists only projects of the current organization', function () {
    [$alice, $orgA] = makeOrgWithOwner('AlphaCo');
    [$bob, $orgB] = makeOrgWithOwner('BravoCo');

    CurrentOrganization::set($orgA);
    Project::create(['organization_id' => $orgA->id, 'owner_id' => $alice->id, 'name' => 'A-project']);

    CurrentOrganization::set($orgB);
    Project::create(['organization_id' => $orgB->id, 'owner_id' => $bob->id, 'name' => 'B-project']);

    CurrentOrganization::set($orgA);
    $names = Project::pluck('name')->all();
    expect($names)->toContain('A-project')->not->toContain('B-project');

    CurrentOrganization::set($orgB);
    $names = Project::pluck('name')->all();
    expect($names)->toContain('B-project')->not->toContain('A-project');
});

it('blocks HTTP access to another org project', function () {
    [$alice, $orgA] = makeOrgWithOwner('AlphaHttp');
    [$bob, $orgB] = makeOrgWithOwner('BravoHttp');

    CurrentOrganization::set($orgA);
    $projectA = Project::create(['organization_id' => $orgA->id, 'owner_id' => $alice->id, 'name' => 'Alpha']);
    CurrentOrganization::set(null);

    $this->actingAs($bob, 'sanctum')
        ->withHeader('X-Organization-Id', $orgB->id)
        ->getJson('/api/v1/projects/'.$projectA->id)
        ->assertNotFound();
});
