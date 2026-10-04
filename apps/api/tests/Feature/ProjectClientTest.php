<?php

use App\Models\Client;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function projectClientOrg(string $name): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => $name, 'slug' => strtolower($name).'-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    CurrentOrganization::set($org);
    $client = Client::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Amina '.$name,
        'company' => 'Atelier '.$name,
    ]);
    $opportunity = Opportunity::create([
        'organization_id' => $org->id,
        'client_id' => $client->id,
        'owner_id' => $owner->id,
        'title' => 'Site '.$name,
        'stage' => Opportunity::STAGE_PROPOSAL,
    ]);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'client', 'opportunity');
}

afterEach(fn () => CurrentOrganization::set(null));

it('records the client chosen on a new project', function () {
    ['owner' => $owner, 'org' => $org, 'client' => $client] = projectClientOrg('Same');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Site vitrine', 'client_id' => $client->id])
        ->assertCreated()
        ->assertJsonPath('client_id', $client->id)
        ->assertJsonPath('client.company', 'Atelier Same');
});

it('refuses a client from another organization', function () {
    ['owner' => $owner, 'org' => $org] = projectClientOrg('Home');
    ['client' => $foreign] = projectClientOrg('Other');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Site vitrine', 'client_id' => $foreign->id])
        ->assertStatus(422)
        ->assertJsonValidationErrors('client_id');
});

it('keeps the client when an opportunity is won', function () {
    ['owner' => $owner, 'org' => $org, 'client' => $client, 'opportunity' => $opportunity] = projectClientOrg('Won');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson('/api/v1/opportunities/'.$opportunity->id, ['stage' => 'won'])
        ->assertOk();

    $projectId = $opportunity->refresh()->project_id;
    expect($projectId)->not->toBeNull()
        ->and(Project::find($projectId)->client_id)->toBe($client->id);
});
