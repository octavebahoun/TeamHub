<?php

use App\Models\Client;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\CurrentOrganization;

function contravoLinkOrg(string $name): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => $name, 'slug' => strtolower($name).'-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    CurrentOrganization::set($org);
    $client = Client::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Client '.$name]);
    $opportunity = Opportunity::create([
        'organization_id' => $org->id,
        'client_id' => $client->id,
        'owner_id' => $owner->id,
        'title' => 'Devis '.$name,
        'stage' => Opportunity::STAGE_PROPOSAL,
    ]);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Projet '.$name]);
    $task = Task::create(['organization_id' => $org->id, 'project_id' => $project->id, 'created_by' => $owner->id, 'title' => 'Livrable '.$name]);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'member', 'client', 'opportunity', 'project', 'task');
}

afterEach(fn () => CurrentOrganization::set(null));

it('links an opportunity to a Contravo quote id', function () {
    ['owner' => $owner, 'org' => $org, 'opportunity' => $opportunity] = contravoLinkOrg('LinkQuote');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_abc'])
        ->assertOk()
        ->assertJsonPath('ok', true);

    expect($opportunity->refresh()->contravo_quote_id)->toBe('q_abc');
});

it('links a project to a Contravo invoice id and a contract id independently', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = contravoLinkOrg('LinkProject');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'invoice', 'id' => $project->id, 'contravo_id' => 'inv_1'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'contract', 'id' => $project->id, 'contravo_id' => 'c_1'])
        ->assertOk();

    expect($project->refresh()->contravo_invoice_id)->toBe('inv_1')
        ->and($project->contravo_contract_id)->toBe('c_1');
});

it('links a project to a Contravo project id', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = contravoLinkOrg('LinkContravoProject');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'project', 'id' => $project->id, 'contravo_id' => 'prj_1'])
        ->assertOk()
        ->assertJsonPath('contravo_id', 'prj_1');

    expect($project->refresh()->contravo_project_id)->toBe('prj_1');
});

it('links a task to a deliverable id and a client to a Contravo client id', function () {
    ['owner' => $owner, 'org' => $org, 'task' => $task, 'client' => $client] = contravoLinkOrg('LinkTaskClient');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'deliverable', 'id' => $task->id, 'contravo_id' => 'd_1'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'client', 'id' => $client->id, 'contravo_id' => 'cli_1'])
        ->assertOk();

    expect($task->refresh()->contravo_deliverable_id)->toBe('d_1')
        ->and($client->refresh()->contravo_client_id)->toBe('cli_1');
});

it('is idempotent when the same link is posted twice', function () {
    ['owner' => $owner, 'org' => $org, 'opportunity' => $opportunity] = contravoLinkOrg('LinkIdempotent');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_same'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_same'])
        ->assertOk();

    expect($opportunity->refresh()->contravo_quote_id)->toBe('q_same');
});

it('rejects overwriting an existing link with a different Contravo id', function () {
    ['owner' => $owner, 'org' => $org, 'opportunity' => $opportunity] = contravoLinkOrg('LinkConflict');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_first'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_second'])
        ->assertStatus(409);

    expect($opportunity->refresh()->contravo_quote_id)->toBe('q_first');
});

it('rejects a Contravo id already used by another WINE object', function () {
    ['owner' => $owner, 'org' => $org] = contravoLinkOrg('LinkDuplicate');

    CurrentOrganization::set($org);
    $client = Client::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Autre client']);
    $opportunityA = Opportunity::create(['organization_id' => $org->id, 'client_id' => $client->id, 'owner_id' => $owner->id, 'title' => 'Devis A', 'stage' => Opportunity::STAGE_PROPOSAL]);
    $opportunityB = Opportunity::create(['organization_id' => $org->id, 'client_id' => $client->id, 'owner_id' => $owner->id, 'title' => 'Devis B', 'stage' => Opportunity::STAGE_PROPOSAL]);
    CurrentOrganization::set(null);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunityA->id, 'contravo_id' => 'q_dup'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunityB->id, 'contravo_id' => 'q_dup'])
        ->assertStatus(409);

    expect($opportunityB->refresh()->contravo_quote_id)->toBeNull();
});

it('forbids a simple member from linking an opportunity they do not own', function () {
    ['org' => $org, 'member' => $member, 'opportunity' => $opportunity] = contravoLinkOrg('LinkForbidden');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $opportunity->id, 'contravo_id' => 'q_x'])
        ->assertForbidden();
});

it('returns 404 when linking an object from another organization', function () {
    ['owner' => $owner, 'org' => $org] = contravoLinkOrg('LinkIsolationA');
    ['opportunity' => $otherOpportunity] = contravoLinkOrg('LinkIsolationB');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'quote', 'id' => $otherOpportunity->id, 'contravo_id' => 'q_cross'])
        ->assertNotFound();
});

it('rejects an unknown link type', function () {
    ['owner' => $owner, 'org' => $org, 'opportunity' => $opportunity] = contravoLinkOrg('LinkBadType');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/contravo/links', ['type' => 'bogus', 'id' => $opportunity->id, 'contravo_id' => 'x'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('type');
});
