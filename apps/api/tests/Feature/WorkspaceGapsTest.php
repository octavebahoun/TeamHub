<?php

use App\Models\Client;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function workspaceOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'DeskCo',
        'slug' => 'desk-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create([
        'user_id' => $owner->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_OWNER,
    ]);
    $owner->update(['current_organization_id' => $org->id]);

    CurrentOrganization::set($org);
    $client = Client::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Amina Desk',
        'company' => 'Atelier Desk',
        'email' => 'amina@desk.test',
    ]);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'client_id' => $client->id,
        'name' => 'Site Desk',
        'status' => Project::STATUS_UPCOMING,
    ]);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'client', 'project');
}

afterEach(fn () => CurrentOrganization::set(null));

it('ajoute des jalons, met un projet en attente d\'acompte et signe le contrat', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = workspaceOrg();
    $as = fn () => $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id);

    $as()->postJson("/api/v1/projects/{$project->id}/milestones", ['title' => 'Cadrage'])
        ->assertCreated()
        ->assertJsonPath('0.title', 'Cadrage')
        ->assertJsonPath('0.code', 'J1')
        ->assertJsonPath('0.current', true);

    $milestoneId = $as()->getJson("/api/v1/projects/{$project->id}")->json('milestones.0.id');

    $as()->patchJson("/api/v1/projects/{$project->id}/milestones/{$milestoneId}", ['done' => true])
        ->assertOk()
        ->assertJsonPath('0.done', true);

    $quoteId = $as()->postJson('/api/v1/billing/quotes', [
        'projectId' => 'wine-p-'.$project->id,
        'clientId' => 'wine-c-'.$project->client_id,
        'validUntil' => now()->addDays(14)->toDateString(),
        'taxRateBps' => 0,
        'discountCents' => '0',
        'items' => [
            ['description' => 'Acompte', 'quantity' => '1', 'unitPriceCents' => '500000'],
        ],
    ])->assertCreated()->json('id');

    $as()->postJson('/api/v1/billing/quotes/'.$quoteId.'/transition', ['action' => 'send'])->assertOk();

    expect($project->fresh()->status)->toBe(Project::STATUS_ON_HOLD);

    $as()->getJson("/api/v1/projects/{$project->id}")
        ->assertOk()
        ->assertJsonPath('funding.state', 'awaiting');

    $invoiceId = $as()->getJson('/api/v1/billing/invoices?projectId=wine-p-'.$project->id)->json('0.id');

    $as()->postJson('/api/v1/billing/invoices/'.$invoiceId.'/payments', [
        'amountCents' => '200000',
        'method' => 'mobile_money',
        'channel' => 'mtn_momo',
        'reference' => 'TXN-9',
    ])->assertCreated()->assertJsonPath('channel', 'mtn_momo');

    expect($project->fresh()->status)->toBe(Project::STATUS_ON_HOLD);

    $contract = $as()->postJson('/api/v1/billing/contracts', [
        'projectId' => 'wine-p-'.$project->id,
        'clientId' => 'wine-c-'.$project->client_id,
        'title' => 'Contrat desk',
    ])->assertCreated()->json();

    $signed = $as()->postJson('/api/v1/billing/contracts/'.$contract['id'].'/sign', [
        'signerName' => 'Amina Desk',
        'signerEmail' => 'amina@desk.test',
    ])->assertOk()->assertJsonPath('status', 'signed')->json();

    $this->getJson('/api/v1/signatures/'.$signed['signatureHash'])
        ->assertOk()
        ->assertJsonPath('valid', true)
        ->assertJsonPath('signerName', 'Amina Desk');

    $this->getJson('/api/v1/signatures/inconnu')
        ->assertOk()
        ->assertJsonPath('valid', false);
});

it('ouvre une conversation, publie un avis et les retrouve dans la recherche', function () {
    ['owner' => $owner, 'org' => $org, 'client' => $client] = workspaceOrg();
    $as = fn () => $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id);

    $thread = $as()->postJson('/api/v1/conversations', [
        'clientId' => 'wine-c-'.$client->id,
        'channel' => 'whatsapp',
    ])->assertCreated()->json();

    $as()->postJson('/api/v1/conversations/'.$thread['id'].'/messages', [
        'text' => 'Bonjour depuis le fil WhatsApp unique',
    ])->assertCreated();

    $as()->postJson("/api/v1/clients/{$client->id}/reviews", [
        'rating' => 5,
        'comment' => 'Prestation impeccable',
    ])->assertCreated();

    $as()->getJson('/api/v1/reviews')
        ->assertOk()
        ->assertJsonPath('0.rating', 5)
        ->assertJsonPath('0.comment', 'Prestation impeccable');

    $as()->getJson('/api/v1/search?q=WhatsApp+unique')
        ->assertOk()
        ->assertJsonPath('messages.0.client_id', $client->id);
});

it('refuse le téléchargement d\'un fichier EICAR', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = workspaceOrg();
    Storage::fake('local');

    $file = UploadedFile::fake()->createWithContent(
        'note.jpg',
        'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
    );

    $id = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->post("/api/v1/projects/{$project->id}/attachments", ['file' => $file])
        ->assertCreated()
        ->assertJsonPath('scan_status', 'infected')
        ->json('id');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->get("/api/v1/attachments/{$id}/download")
        ->assertStatus(422);
});

it('sert les analytics même si le service data est arrêté', function () {
    ['owner' => $owner, 'org' => $org] = workspaceOrg();
    Http::preventStrayRequests();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/overview')
        ->assertOk()
        ->assertJsonPath('finance.revenue_xof', 0)
        ->assertJsonPath('finance.cash_xof', 0);
});
