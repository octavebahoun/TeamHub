<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use App\Support\CurrentOrganization;

function crmOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'CrmCo',
        'slug' => 'crm-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);

    $manager = User::factory()->create();
    Membership::create(['user_id' => $manager->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MANAGER]);

    $otherManager = User::factory()->create();
    Membership::create(['user_id' => $otherManager->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MANAGER]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    return compact('owner', 'org', 'manager', 'otherManager', 'member');
}

afterEach(fn () => CurrentOrganization::set(null));

it('records exchanges and returns the client history newest first', function () {
    extract(crmOrg());

    $clientId = $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'Garage Paul', 'address' => 'Rue 12, Cotonou'])
        ->assertCreated()
        ->assertJsonPath('address', 'Rue 12, Cotonou')
        ->json('id');

    $opportunityId = $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/opportunities', ['client_id' => $clientId, 'title' => 'Site vitrine'])
        ->assertCreated()
        ->json('id');

    $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/opportunities/{$opportunityId}", ['stage' => 'contacted'])
        ->assertOk();

    $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/clients/{$clientId}/activities", ['kind' => 'call', 'body' => 'Appel de découverte.'])
        ->assertCreated()
        ->assertJsonPath('action', 'activity.call')
        ->assertJsonPath('kind', 'call')
        ->assertJsonPath('body', 'Appel de découverte.')
        ->assertJsonPath('user.id', $manager->id);

    $response = $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/clients/{$clientId}/activities")
        ->assertOk()
        ->assertJsonStructure([['id', 'action', 'kind', 'body', 'meta', 'user' => ['id', 'name'], 'created_at']]);

    $actions = collect($response->json())->pluck('action')->all();
    expect($actions[0])->toBe('activity.call');
    expect($actions)->toContain('client.created', 'opportunity.created', 'opportunity.stage_changed');

    $stageChange = collect($response->json())->firstWhere('action', 'opportunity.stage_changed');
    expect($stageChange['meta'])->toBe(['from' => 'prospect', 'to' => 'contacted']);
});

it('validates the kind of exchange', function () {
    extract(crmOrg());
    $clientId = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'C'])->json('id');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/clients/{$clientId}/activities", ['kind' => 'sms', 'body' => 'x'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['kind']);
});

it('restricts client history like viewing the client', function () {
    extract(crmOrg());
    $clientId = $this->actingAs($manager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'Mine'])->json('id');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/clients/{$clientId}/activities")->assertOk();

    $this->actingAs($otherManager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/clients/{$clientId}/activities")->assertForbidden();

    $this->actingAs($otherManager, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/clients/{$clientId}/activities", ['kind' => 'note', 'body' => 'x'])->assertForbidden();

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/clients/{$clientId}/activities")->assertForbidden();
});

it('does not expose another organization client history', function () {
    extract(crmOrg());
    $foreign = crmOrg();
    $clientId = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/clients', ['name' => 'Secret'])->json('id');

    $this->actingAs($foreign['owner'], 'sanctum')->withHeader('X-Organization-Id', $foreign['org']->id)
        ->getJson("/api/v1/clients/{$clientId}/activities")->assertNotFound();
});
