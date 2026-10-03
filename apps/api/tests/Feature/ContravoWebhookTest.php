<?php

use App\Models\Activity;
use App\Models\Client;
use App\Models\InboxNotification;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Organization;
use App\Models\Post;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Support\Facades\Redis;

function contravoOrgWithOpportunity(string $name): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => $name,
        'slug' => strtolower($name).'-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create([
        'user_id' => $owner->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_OWNER,
    ]);
    $owner->update(['current_organization_id' => $org->id]);

    CurrentOrganization::set($org);
    $opportunity = Opportunity::create([
        'client_id' => \App\Models\Client::create([
            'organization_id' => $org->id,
            'name' => 'Client '.$name,
        ])->id,
        'owner_id' => $owner->id,
        'title' => 'Site vitrine',
        'stage' => Opportunity::STAGE_PROPOSAL,
    ]);
    CurrentOrganization::set(null);

    return [$owner, $org, $opportunity];
}

function signedWebhook(array $payload): \Illuminate\Testing\TestResponse
{
    $raw = json_encode($payload);
    $signature = hash_hmac('sha256', $raw, config('services.contravo.webhook_secret'));

    return test()->withHeader('X-Webhook-Signature', $signature)
        ->postJson('/api/v1/webhooks/contravo', $payload);
}

afterEach(fn () => CurrentOrganization::set(null));

it('rejects a webhook with a missing or wrong signature', function () {
    $payload = ['event' => 'quote.accepted', 'data' => ['reference' => 1]];

    test()->postJson('/api/v1/webhooks/contravo', $payload)->assertUnauthorized();

    test()->withHeader('X-Webhook-Signature', 'faux-signature')
        ->postJson('/api/v1/webhooks/contravo', $payload)
        ->assertUnauthorized();
});

it('marks the opportunity won and creates an on-hold project on quote.accepted', function () {
    [$owner, $org, $opportunity] = contravoOrgWithOpportunity('ContravoWon');

    signedWebhook([
        'event' => 'quote.accepted',
        'data' => ['quoteId' => 'q_123', 'reference' => $opportunity->id],
    ])->assertOk()->assertJsonPath('ok', true);

    $opportunity->refresh();
    expect($opportunity->stage)->toBe(Opportunity::STAGE_WON)
        ->and($opportunity->contravo_quote_id)->toBe('q_123')
        ->and($opportunity->project_id)->not->toBeNull();

    $project = Project::withoutGlobalScopes()->find($opportunity->project_id);
    expect($project->status)->toBe(Project::STATUS_ON_HOLD)
        ->and($project->organization_id)->toBe($org->id);

    expect(Activity::withoutGlobalScopes()->where('subject_id', $opportunity->id)->where('action', 'opportunity.stage_changed')->exists())->toBeTrue();
});

it('is idempotent when quote.accepted is replayed', function () {
    [$owner, $org, $opportunity] = contravoOrgWithOpportunity('ContravoReplay');

    signedWebhook(['event' => 'quote.accepted', 'data' => ['quoteId' => 'q_abc', 'reference' => $opportunity->id]])->assertOk();
    $firstProjectId = $opportunity->refresh()->project_id;

    signedWebhook(['event' => 'quote.accepted', 'data' => ['quoteId' => 'q_abc', 'reference' => $opportunity->id]])->assertOk();

    expect($opportunity->refresh()->project_id)->toBe($firstProjectId)
        ->and(Project::withoutGlobalScopes()->where('organization_id', $org->id)->count())->toBe(1);
});

it('returns 404 when no opportunity matches the quote', function () {
    signedWebhook(['event' => 'quote.accepted', 'data' => ['quoteId' => 'unknown']])->assertNotFound();
});

it('logs a rejected quote without changing the stage', function () {
    [$owner, $org, $opportunity] = contravoOrgWithOpportunity('ContravoRejected');

    signedWebhook(['event' => 'quote.rejected', 'data' => ['quoteId' => 'q_rej', 'reference' => $opportunity->id]])
        ->assertOk();

    expect($opportunity->refresh()->stage)->toBe(Opportunity::STAGE_PROPOSAL)
        ->and(Activity::withoutGlobalScopes()->where('subject_id', $opportunity->id)->where('action', 'opportunity.quote_rejected')->exists())->toBeTrue();
});

it('unlocks an on-hold project and notifies the team on invoice.paid', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoPaid');
    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Site vitrine',
        'status' => Project::STATUS_ON_HOLD,
    ]);
    $project->members()->attach([$owner->id, $member->id]);
    CurrentOrganization::set(null);

    Redis::shouldReceive('publish')->once()->withArgs(function (string $channel, string $payload) use ($org) {
        $data = json_decode($payload, true);

        return $channel === 'wine:notifications'
            && $data['organization_id'] === $org->id
            && $data['type'] === 'project.unlocked';
    });

    signedWebhook(['event' => 'invoice.paid', 'data' => ['invoiceId' => 'inv_1', 'reference' => $project->id]])
        ->assertOk();

    expect($project->refresh()->status)->toBe(Project::STATUS_IN_PROGRESS)
        ->and($project->contravo_invoice_id)->toBe('inv_1');

    $recipients = InboxNotification::withoutGlobalScopes()->where('type', 'project.unlocked')->pluck('user_id')->sort()->values()->all();
    expect($recipients)->toBe(collect([$owner->id, $member->id])->sort()->values()->all());
});

it('does not re-notify when invoice.paid is replayed on an already unlocked project', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoPaidTwice');

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Déjà payé',
        'status' => Project::STATUS_ON_HOLD,
    ]);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'invoice.paid', 'data' => ['invoiceId' => 'inv_2', 'reference' => $project->id]])->assertOk();

    Redis::shouldReceive('publish')->never();

    signedWebhook(['event' => 'invoice.paid', 'data' => ['invoiceId' => 'inv_2', 'reference' => $project->id]])->assertOk();

    expect(InboxNotification::withoutGlobalScopes()->where('type', 'project.unlocked')->count())->toBe(1);
});

it('alerts only managers on invoice.overdue', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoOverdue');
    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Facture en retard',
        'status' => Project::STATUS_IN_PROGRESS,
    ]);
    CurrentOrganization::set(null);

    Redis::shouldReceive('publish')->once();

    signedWebhook(['event' => 'invoice.overdue', 'data' => ['invoiceId' => 'inv_3', 'reference' => $project->id]])->assertOk();

    expect(InboxNotification::withoutGlobalScopes()->where('type', 'invoice.overdue')->pluck('user_id')->all())
        ->toBe([$owner->id]);
});

it('stores the contract id and notifies the team on contract.signed', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoContract');

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Contrat',
        'status' => Project::STATUS_ON_HOLD,
    ]);
    CurrentOrganization::set(null);

    Redis::shouldReceive('publish')->once();

    signedWebhook(['event' => 'contract.signed', 'data' => ['contractId' => 'c_1', 'reference' => $project->id]])
        ->assertOk();

    expect($project->refresh()->contravo_contract_id)->toBe('c_1');
});

it('ignores an unknown event without failing', function () {
    signedWebhook(['event' => 'something.else', 'data' => []])->assertOk()->assertJsonPath('ok', true);
});

it('unlocks the project from a real-shaped invoice.paid payload (camelCase, no reference)', function () {
    // Payload réel observé depuis Contravo : camelCase, pas de champ `reference`.
    // Le seul moyen de matcher est contravo_invoice_id, déjà posé via /contravo/links.
    [$owner, $org] = contravoOrgWithOpportunity('ContravoRealPayload');

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Site vitrine',
        'status' => Project::STATUS_ON_HOLD,
        'contravo_invoice_id' => 'inv_98457230495',
    ]);
    CurrentOrganization::set(null);

    Redis::shouldReceive('publish')->once();

    signedWebhook([
        'event' => 'invoice.paid',
        'timestamp' => '2026-08-14T17:00:00Z',
        'data' => [
            'invoiceId' => 'inv_98457230495',
            'invoiceNumber' => 'FAC-2026-004',
            'amountPaidCents' => 15000000,
            'currency' => 'XOF',
            'status' => 'paid',
            'clientId' => 'cli_309248239',
        ],
    ])->assertOk();

    expect($project->refresh()->status)->toBe(Project::STATUS_IN_PROGRESS);
});

it('returns 404 instead of matching an unrelated project when no identifier is recognized', function () {
    // Régression : avant le fix, un data[] sans identifiant reconnu finissait
    // par matcher le premier projet trouvé (where(fn () => {}) ne filtre rien).
    [$owner, $org] = contravoOrgWithOpportunity('ContravoNoMatch');

    CurrentOrganization::set($org);
    $unrelatedProject = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Projet sans rapport',
        'status' => Project::STATUS_ON_HOLD,
    ]);
    CurrentOrganization::set(null);

    signedWebhook([
        'event' => 'invoice.paid',
        'data' => ['someUnexpectedField' => 'whatever'],
    ])->assertNotFound();

    expect($unrelatedProject->refresh()->status)->toBe(Project::STATUS_ON_HOLD);
});

it('alerts the opportunity owner on quote.rejected', function () {
    [$owner, $org, $opportunity] = contravoOrgWithOpportunity('ContravoRejectedAlert');

    Redis::shouldReceive('publish')->once();

    signedWebhook(['event' => 'quote.rejected', 'data' => ['quoteId' => 'q_rej2', 'reference' => $opportunity->id]])
        ->assertOk();

    expect(InboxNotification::withoutGlobalScopes()->where('type', 'quote.rejected')->pluck('user_id')->all())
        ->toBe([$owner->id]);
});

it('marks the matching task done on deliverable.approved', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoDeliverableApproved');

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site vitrine', 'status' => Project::STATUS_IN_PROGRESS]);
    $task = Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $owner->id,
        'title' => 'Maquette v1',
        'status' => Task::STATUS_REVIEW,
    ]);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'deliverable.approved', 'data' => ['deliverableId' => 'd_1', 'reference' => $task->id]])
        ->assertOk();

    expect($task->refresh()->status)->toBe(Task::STATUS_DONE)
        ->and($task->completed_at)->not->toBeNull()
        ->and($task->contravo_deliverable_id)->toBe('d_1');
});

it('is idempotent when deliverable.approved is replayed', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoDeliverableApprovedTwice');

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site vitrine', 'status' => Project::STATUS_IN_PROGRESS]);
    $task = Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $owner->id,
        'title' => 'Maquette v1',
        'status' => Task::STATUS_REVIEW,
    ]);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'deliverable.approved', 'data' => ['deliverableId' => 'd_2', 'reference' => $task->id]])->assertOk();
    $firstCompletedAt = $task->refresh()->completed_at;

    signedWebhook(['event' => 'deliverable.approved', 'data' => ['deliverableId' => 'd_2', 'reference' => $task->id]])->assertOk();

    expect($task->refresh()->completed_at->eq($firstCompletedAt))->toBeTrue()
        ->and(Activity::withoutGlobalScopes()->where('action', 'task.deliverable_approved')->count())->toBe(1);
});

it('creates a review task on deliverable.rejected and does not duplicate it on replay', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoDeliverableRejected');

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site vitrine', 'status' => Project::STATUS_IN_PROGRESS]);
    $task = Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'assignee_id' => $owner->id,
        'created_by' => $owner->id,
        'title' => 'Maquette v1',
        'status' => Task::STATUS_REVIEW,
    ]);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'deliverable.rejected', 'data' => ['deliverableId' => 'd_3', 'reference' => $task->id, 'comment' => 'Trop sombre']])->assertOk();

    $revision = Task::withoutGlobalScopes()->where('parent_id', $task->id)->first();
    expect($revision)->not->toBeNull()
        ->and($revision->title)->toBe('Révision demandée')
        ->and($revision->status)->toBe(Task::STATUS_TODO)
        ->and($revision->description)->toContain('Trop sombre')
        ->and(InboxNotification::withoutGlobalScopes()->where('type', 'deliverable.rejected')->pluck('user_id')->all())->toBe([$owner->id]);

    signedWebhook(['event' => 'deliverable.rejected', 'data' => ['deliverableId' => 'd_3', 'reference' => $task->id]])->assertOk();

    expect(Task::withoutGlobalScopes()->where('parent_id', $task->id)->count())->toBe(1);
});

it('notifies the client owner on conversation.message_received', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoConversation');

    CurrentOrganization::set($org);
    $client = Client::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Client WhatsApp']);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'conversation.message_received', 'data' => ['clientId' => 'c_1', 'reference' => $client->id]])
        ->assertOk();

    expect($client->refresh()->contravo_client_id)->toBe('c_1')
        ->and(InboxNotification::withoutGlobalScopes()->where('type', 'conversation.message_received')->pluck('user_id')->all())
        ->toBe([$owner->id]);
});

it('publishes a social post on review.submitted and does not duplicate it on replay', function () {
    [$owner, $org] = contravoOrgWithOpportunity('ContravoReview');

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site vitrine', 'status' => Project::STATUS_IN_PROGRESS]);
    CurrentOrganization::set(null);

    signedWebhook(['event' => 'review.submitted', 'data' => ['reviewId' => 'r_1', 'reference' => $project->id, 'rating' => 5, 'comment' => 'Super travail']])
        ->assertOk();

    $post = Post::withoutGlobalScopes()->where('organization_id', $org->id)->first();
    expect($post)->not->toBeNull()
        ->and($post->author_id)->toBe($owner->id)
        ->and($post->body)->toContain('5/5')
        ->and($post->body)->toContain('Super travail');

    signedWebhook(['event' => 'review.submitted', 'data' => ['reviewId' => 'r_1', 'reference' => $project->id, 'rating' => 5]])->assertOk();

    expect(Post::withoutGlobalScopes()->where('organization_id', $org->id)->count())->toBe(1);
});
