<?php

use App\Models\InboxNotification;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Support\Facades\Redis;

function inboxOrg(string $name, string $role = Membership::ROLE_OWNER): array
{
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => $name,
        'slug' => strtolower($name).'-'.uniqid(),
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

function inboxNotice(User $user, Organization $org, array $overrides = []): InboxNotification
{
    CurrentOrganization::set($org);
    $notification = InboxNotification::create(array_merge([
        'organization_id' => $org->id,
        'user_id' => $user->id,
        'type' => 'task.assigned',
        'title' => 'Nouvelle tâche assignée',
        'body' => 'Relancer le client',
        'link' => '/taches/1',
    ], $overrides));
    CurrentOrganization::set(null);

    return $notification;
}

afterEach(fn () => CurrentOrganization::set(null));

it('lists only the current user notifications in the current organization', function () {
    [$alice, $orgA] = inboxOrg('InboxA');
    [$bob, $orgB] = inboxOrg('InboxB');
    Membership::create([
        'user_id' => $alice->id,
        'organization_id' => $orgB->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    inboxNotice($alice, $orgA, ['title' => 'Dans A']);
    inboxNotice($bob, $orgA, ['title' => 'Pour Bob']);
    inboxNotice($alice, $orgB, ['title' => 'Dans B']);

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $orgA->id)
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Dans A');
});

it('marks one notification as read and ignores another member', function () {
    [$alice, $org] = inboxOrg('InboxRead');
    $bob = User::factory()->create();
    Membership::create([
        'user_id' => $bob->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    $aliceNotice = inboxNotice($alice, $org);
    $bobNotice = inboxNotice($bob, $org, ['title' => 'Pour Bob']);

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/notifications/'.$bobNotice->id.'/read')
        ->assertNotFound();

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/notifications/'.$aliceNotice->id.'/read')
        ->assertOk()
        ->assertJsonPath('id', $aliceNotice->id);

    expect($aliceNotice->fresh()->read_at)->not->toBeNull()
        ->and($bobNotice->fresh()->read_at)->toBeNull();

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/notifications')
        ->assertJsonPath('unread_count', 0);
});

it('marks every unread notification of the current organization', function () {
    [$alice, $org] = inboxOrg('InboxAll');
    [$bob, $other] = inboxOrg('InboxAllOther');
    Membership::create([
        'user_id' => $alice->id,
        'organization_id' => $other->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    inboxNotice($alice, $org, ['title' => 'Un']);
    inboxNotice($alice, $org, ['title' => 'Deux']);
    $elsewhere = inboxNotice($alice, $other, ['title' => 'Ailleurs']);

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/notifications/read')
        ->assertOk()
        ->assertJsonPath('unread_count', 0);

    expect(InboxNotification::withoutGlobalScopes()->where('user_id', $alice->id)->whereNull('read_at')->pluck('id')->all())
        ->toBe([$elsewhere->id]);
});

it('persists a task assignment and publishes it for the bell', function () {
    [$owner, $org] = inboxOrg('InboxAssign');
    $assignee = User::factory()->create();
    Membership::create([
        'user_id' => $assignee->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'Site vitrine',
    ]);
    $project->members()->attach([$owner->id, $assignee->id]);
    CurrentOrganization::set(null);

    Redis::shouldReceive('publish')->once()->withArgs(function (string $channel, string $payload) use ($assignee) {
        $data = json_decode($payload, true);

        return $channel === 'wine:notifications'
            && $data['user_id'] === $assignee->id
            && $data['type'] === 'task.assigned'
            && $data['payload']['title'] === 'Relancer le client'
            && str_starts_with($data['payload']['link'], '/taches/');
    });

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects/'.$project->id.'/tasks', [
            'title' => 'Relancer le client',
            'assignee_id' => $assignee->id,
        ])
        ->assertCreated();

    $this->actingAs($assignee, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('data.0.type', 'task.assigned')
        ->assertJsonPath('data.0.body', 'Relancer le client');

    Redis::shouldReceive('publish')->never();

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects/'.$project->id.'/tasks', [
            'title' => 'Ma propre tâche',
            'assignee_id' => $owner->id,
        ])
        ->assertCreated();

    expect(InboxNotification::withoutGlobalScopes()->where('user_id', $owner->id)->count())->toBe(0);
});

it('keeps a social post out of the author inbox and out of the guest inbox', function () {
    [$owner, $org] = inboxOrg('InboxSocial');
    $member = User::factory()->create();
    $guest = User::factory()->create();
    Membership::create([
        'user_id' => $member->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);
    Membership::create([
        'user_id' => $guest->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_GUEST,
    ]);

    Redis::shouldReceive('publish')->once();

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/posts', ['body' => 'Livré.'])
        ->assertCreated();

    expect(InboxNotification::withoutGlobalScopes()->pluck('user_id')->all())->toBe([$member->id]);
});
