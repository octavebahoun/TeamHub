<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function setupOrgWithRoles(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'OrgTest',
        'slug' => 'org-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $manager = User::factory()->create();
    Membership::create(['user_id' => $manager->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MANAGER]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    $guest = User::factory()->create();
    Membership::create(['user_id' => $guest->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_GUEST]);

    return compact('owner', 'org', 'manager', 'member', 'guest');
}

afterEach(fn () => CurrentOrganization::set(null));

// ------------------------------------------------------------------
// Projet · Liste — scope selon rôle
// ------------------------------------------------------------------

it('scopes project list correctly per role', function () {
    extract(setupOrgWithRoles());
    CurrentOrganization::set($org);

    $sharedWithMember = Project::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'Shared']);
    $sharedWithMember->members()->attach($member->id);

    $privateManagerProject = Project::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'PrivMgr']);
    $privateManagerProject->members()->attach($manager->id);

    $invisible = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'OwnerOnly']);
    CurrentOrganization::set(null);

    // Owner voit tout
    $resp = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)->getJson('/api/v1/projects');
    expect(collect($resp->json('data'))->pluck('name')->all())->toContain('Shared', 'PrivMgr', 'OwnerOnly');

    // Membre voit seulement les projets où il est ajouté
    $resp = $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)->getJson('/api/v1/projects');
    $names = collect($resp->json('data'))->pluck('name')->all();
    expect($names)->toContain('Shared')->not->toContain('PrivMgr', 'OwnerOnly');

    // Guest sans projets partagés → liste vide
    $resp = $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)->getJson('/api/v1/projects');
    expect($resp->json('data'))->toBeEmpty();
});

// ------------------------------------------------------------------
// CRM — Membre et Invité n'ont PAS accès
// ------------------------------------------------------------------

it('forbids members and guests from accessing CRM', function () {
    extract(setupOrgWithRoles());

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/clients')->assertForbidden();

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/opportunities')->assertForbidden();

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/clients')->assertForbidden();
});

it('allows manager to see only their own clients', function () {
    extract(setupOrgWithRoles());

    $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'MgrClient'])->assertCreated();

    // Admin crée un autre client (via owner ici)
    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'OwnerClient'])->assertCreated();

    // Le manager ne voit que le sien
    $resp = $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/clients');
    $names = collect($resp->json('data'))->pluck('name')->all();
    expect($names)->toContain('MgrClient')->not->toContain('OwnerClient');
});

// ------------------------------------------------------------------
// Analytics — Membre et Invité 403
// ------------------------------------------------------------------

it('forbids members and guests from analytics', function () {
    extract(setupOrgWithRoles());

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/overview')->assertForbidden();

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/pipeline')->assertForbidden();
});

// ------------------------------------------------------------------
// Members endpoint
// ------------------------------------------------------------------

it('lists org members for contributors, denies for guests', function () {
    extract(setupOrgWithRoles());

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/members')->assertOk()->assertJsonCount(4);

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/members')->assertForbidden();
});

// ------------------------------------------------------------------
// Project member add — manager-only sur ses projets
// ------------------------------------------------------------------

it('lets project owner add members, forbids others', function () {
    extract(setupOrgWithRoles());
    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'Mine']);
    CurrentOrganization::set(null);

    $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/members", ['user_id' => $member->id])
        ->assertCreated();

    // Un autre manager (sans rôle sur ce projet) ne peut pas
    $other = User::factory()->create();
    Membership::create(['user_id' => $other->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MANAGER]);

    $this->actingAs($other, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/members", ['user_id' => $guest->id])
        ->assertForbidden();
});

// ------------------------------------------------------------------
// Task comments — guest ne peut pas commenter
// ------------------------------------------------------------------

it('allows member to comment tasks in their projects, forbids guest', function () {
    extract(setupOrgWithRoles());
    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'Shared']);
    $project->members()->attach([$member->id, $guest->id]);
    $task = \App\Models\Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $manager->id,
        'title' => 'T',
    ]);
    CurrentOrganization::set(null);

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'coucou'])
        ->assertCreated();

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'nope'])
        ->assertForbidden();
});
