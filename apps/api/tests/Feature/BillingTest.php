<?php

use App\Models\Activity;
use App\Models\Client;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function billingOrg(string $name): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => $name, 'slug' => strtolower($name).'-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    CurrentOrganization::set($org);
    $client = Client::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Amina '.$name,
        'company' => 'Atelier '.$name,
        'email' => 'amina@'.strtolower($name).'.test',
    ]);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'client_id' => $client->id,
        'name' => 'Site '.$name,
        'status' => Project::STATUS_ON_HOLD,
    ]);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'member', 'client', 'project');
}

function billingPayload(Project $project): array
{
    return [
        'projectId' => 'wine-p-'.$project->id,
        'clientId' => 'wine-c-'.$project->client_id,
        'validUntil' => now()->addDays(30)->toDateString(),
        'taxRateBps' => 0,
        'discountCents' => '0',
        'items' => [
            ['description' => 'Site vitrine', 'quantity' => '2', 'unitPriceCents' => '1000'],
        ],
    ];
}

afterEach(fn () => CurrentOrganization::set(null));

it('crée un devis, le contrat et encaisse le Mobile Money sur le projet', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = billingOrg('Atelier');

    $quote = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($project))
        ->assertCreated()
        ->assertJsonPath('status', 'draft')
        ->assertJsonPath('totalCents', '2000')
        ->json();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/quotes/'.$quote['id'].'/transition', ['action' => 'send'])
        ->assertOk()
        ->assertJsonPath('status', 'sent');

    $invoices = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/billing/invoices?projectId=wine-p-'.$project->id.'&clientId=wine-c-'.$project->client_id)
        ->assertOk()
        ->json();

    expect($invoices)->toHaveCount(1)
        ->and($invoices[0]['amountDueCents'])->toBe('2000');

    $invoiceId = $invoices[0]['id'];

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/invoices/'.$invoiceId.'/payments', [
            'amountCents' => '500',
            'method' => 'mobile_money',
            'reference' => 'MTN MoMo · TXN-1',
        ])
        ->assertCreated()
        ->assertJsonPath('method', 'mobile_money');

    expect($project->fresh()->status)->toBe(Project::STATUS_ON_HOLD);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/invoices/'.$invoiceId.'/payments', [
            'amountCents' => '1500',
            'method' => 'mobile_money',
            'reference' => 'Moov Money · TXN-2',
        ])
        ->assertCreated();

    $project->refresh();
    expect($project->status)->toBe(Project::STATUS_IN_PROGRESS)
        ->and($project->contravo_invoice_id)->toBe($invoiceId);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/contracts', [
            'projectId' => 'wine-p-'.$project->id,
            'clientId' => 'wine-c-'.$project->client_id,
            'quoteId' => $quote['id'],
            'title' => 'Contrat site',
        ])
        ->assertCreated()
        ->assertJsonPath('title', 'Contrat site');

    expect($project->fresh()->contravo_contract_id)->not->toBeNull()
        ->and(Activity::query()->where('action', 'client.payment')->count())->toBe(2);
});

it('refuse la facturation à un membre et à une autre organisation', function () {
    ['owner' => $owner, 'org' => $org, 'member' => $member, 'project' => $project] = billingOrg('Maison');
    ['owner' => $other, 'org' => $otherOrg] = billingOrg('Voisin');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($project))
        ->assertForbidden();

    $quoteId = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($project))
        ->assertCreated()
        ->json('id');

    $this->actingAs($other, 'sanctum')->withHeader('X-Organization-Id', $otherOrg->id)
        ->getJson('/api/v1/billing/quotes/'.$quoteId)
        ->assertNotFound();
});

it('recommence la numérotation des devis dans chaque espace', function () {
    ['owner' => $alpha, 'org' => $orgA, 'project' => $projectA] = billingOrg('Alpha');
    ['owner' => $beta, 'org' => $orgB, 'project' => $projectB] = billingOrg('Beta');
    $year = now()->year;

    $first = $this->actingAs($alpha, 'sanctum')->withHeader('X-Organization-Id', $orgA->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($projectA))
        ->assertCreated()
        ->json('number');
    $other = $this->actingAs($beta, 'sanctum')->withHeader('X-Organization-Id', $orgB->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($projectB))
        ->assertCreated()
        ->json('number');
    $second = $this->actingAs($alpha, 'sanctum')->withHeader('X-Organization-Id', $orgA->id)
        ->postJson('/api/v1/billing/quotes', billingPayload($projectA))
        ->assertCreated()
        ->json('number');

    expect($first)->toBe("DEV-{$year}-0001")
        ->and($other)->toBe("DEV-{$year}-0001")
        ->and($second)->toBe("DEV-{$year}-0002")
        ->and(Activity::withoutGlobalScopes()->where('action', 'project.quote_created')->count())->toBe(3);
});

it('garde la clé Contravo sur l\'espace du propriétaire', function () {
    ['owner' => $owner, 'org' => $org, 'member' => $member] = billingOrg('Cle');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->putJson('/api/v1/integrations/contravo', ['api_key' => 'sk_espace_cle'])
        ->assertForbidden();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->putJson('/api/v1/integrations/contravo', [
            'api_key' => 'sk_espace_cle',
            'billing_name' => 'Espace Cle',
            'billing_city' => 'Cotonou',
            'billing_email' => 'facturation@cle.test',
        ])
        ->assertOk()
        ->assertJsonPath('configured', true)
        ->assertJsonPath('billing_name', 'Espace Cle')
        ->assertJsonPath('billing_city', 'Cotonou')
        ->assertJsonMissing(['api_key' => 'sk_espace_cle']);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/integrations/contravo/credential')
        ->assertOk()
        ->assertJsonPath('api_key', 'sk_espace_cle');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonMissing(['contravo_api_key' => 'sk_espace_cle']);
});
