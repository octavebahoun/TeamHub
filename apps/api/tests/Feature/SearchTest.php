<?php

use App\Models\Client;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\CurrentOrganization;

function searchOrgWithRoles(): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => 'SearchCo', 'slug' => 'search-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $manager = User::factory()->create();
    Membership::create(['user_id' => $manager->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MANAGER]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    $guest = User::factory()->create();
    Membership::create(['user_id' => $guest->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_GUEST]);

    CurrentOrganization::set($org);

    // Projet "Phénix" : owner + member + guest. Projet "Secret manager" : owner + manager seulement.
    $phenix = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Phénix Mobile']);
    $phenix->members()->attach([$owner->id, $member->id, $guest->id]);

    $secretManagerProject = Project::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'Phénix Comptabilité']);
    $secretManagerProject->members()->attach([$manager->id]);

    $taskInPhenix = Task::create(['organization_id' => $org->id, 'project_id' => $phenix->id, 'created_by' => $owner->id, 'title' => 'Finaliser le logo Phénix']);
    Task::create(['organization_id' => $org->id, 'project_id' => $secretManagerProject->id, 'created_by' => $manager->id, 'title' => 'Clôturer le mois Phénix']);

    $clientPhenix = Client::create(['organization_id' => $org->id, 'owner_id' => $manager->id, 'name' => 'Phénix SARL']);
    Client::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Autre client Phénix']);

    CurrentOrganization::set(null);

    return compact('owner', 'org', 'manager', 'member', 'guest', 'phenix', 'secretManagerProject', 'taskInPhenix', 'clientPhenix');
}

afterEach(fn () => CurrentOrganization::set(null));

it('rejects an empty query', function () {
    ['owner' => $owner, 'org' => $org] = searchOrgWithRoles();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search')
        ->assertStatus(422)
        ->assertJsonValidationErrors('q');
});

it('lets the owner search across projects, tasks and clients of the organization', function () {
    ['owner' => $owner, 'org' => $org] = searchOrgWithRoles();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Phénix')
        ->assertOk()
        ->assertJsonCount(2, 'projects')
        ->assertJsonCount(2, 'tasks')
        ->assertJsonCount(2, 'clients');
});

it('restricts a member to the projects and tasks they belong to, hides the CRM entirely', function () {
    ['org' => $org, 'member' => $member] = searchOrgWithRoles();

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Phénix')
        ->assertOk()
        ->assertJsonCount(1, 'projects')
        ->assertJsonPath('projects.0.name', 'Phénix Mobile')
        ->assertJsonCount(1, 'tasks')
        ->assertJsonPath('tasks.0.title', 'Finaliser le logo Phénix')
        ->assertJsonCount(0, 'clients');
});

it('restricts a guest to their own project only, hides the CRM entirely', function () {
    ['org' => $org, 'guest' => $guest] = searchOrgWithRoles();

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Phénix')
        ->assertOk()
        ->assertJsonCount(1, 'projects')
        ->assertJsonPath('projects.0.name', 'Phénix Mobile')
        ->assertJsonCount(1, 'tasks')
        ->assertJsonCount(0, 'clients');
});

it('restricts a manager to their own projects and clients only', function () {
    ['org' => $org, 'manager' => $manager] = searchOrgWithRoles();

    $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Phénix')
        ->assertOk()
        ->assertJsonCount(1, 'projects')
        ->assertJsonPath('projects.0.name', 'Phénix Comptabilité')
        ->assertJsonCount(1, 'tasks')
        ->assertJsonPath('tasks.0.title', 'Clôturer le mois Phénix')
        ->assertJsonCount(1, 'clients')
        ->assertJsonPath('clients.0.name', 'Phénix SARL');
});

it('does not leak results from another organization', function () {
    ['org' => $org, 'owner' => $owner] = searchOrgWithRoles();

    $otherOwner = User::factory()->create();
    $otherOrg = Organization::create(['name' => 'OtherSearch', 'slug' => 'other-search-'.uniqid(), 'owner_id' => $otherOwner->id]);
    Membership::create(['user_id' => $otherOwner->id, 'organization_id' => $otherOrg->id, 'role' => Membership::ROLE_OWNER]);

    CurrentOrganization::set($otherOrg);
    Project::create(['organization_id' => $otherOrg->id, 'owner_id' => $otherOwner->id, 'name' => 'Phénix Ailleurs']);
    CurrentOrganization::set(null);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Phénix')
        ->assertOk()
        ->assertJsonCount(2, 'projects');
});

it('finds a project by its description and a task by its description', function () {
    ['owner' => $owner, 'org' => $org] = searchOrgWithRoles();

    CurrentOrganization::set($org);
    Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Sans rapport', 'description' => 'Contient le mot Griffon quelque part']);
    CurrentOrganization::set(null);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/search?q=Griffon')
        ->assertOk()
        ->assertJsonCount(1, 'projects')
        ->assertJsonPath('projects.0.name', 'Sans rapport');
});
