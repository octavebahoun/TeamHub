<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use App\Support\CurrentOrganization;

function activityOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'ActivityCo',
        'slug' => 'activity-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create([
        'user_id' => $owner->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_OWNER,
    ]);
    $owner->update(['current_organization_id' => $org->id]);

    return [$owner, $org];
}

afterEach(fn () => CurrentOrganization::set(null));

it('lists project events newest first with a readable sentence', function () {
    [$owner, $org] = activityOrg();

    $projectId = $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Site vitrine'])
        ->assertCreated()
        ->json('id');

    $taskId = $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$projectId}/tasks", ['title' => 'Relancer le client'])
        ->assertCreated()
        ->json('id');

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/tasks/{$taskId}", ['status' => 'done'])
        ->assertOk();

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/tasks/{$taskId}/comments", ['body' => 'Client relancé.'])
        ->assertCreated();

    $response = $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/projects/{$projectId}/activity")
        ->assertOk()
        ->assertJsonStructure([['id', 'action', 'body', 'user' => ['id', 'name'], 'created_at']]);

    $actions = collect($response->json())->pluck('action')->all();
    expect($actions[0])->toBe('task.commented')
        ->and($actions)->toContain('task.status_changed', 'task.created', 'project.created')
        ->and($response->json('0.body'))->toContain('a commenté la tâche')
        ->and($response->json('0.body'))->toContain('Relancer le client')
        ->and($response->json('0.user.id'))->toBe($owner->id);

    $status = collect($response->json())->firstWhere('action', 'task.status_changed');
    expect($status['body'])->toContain('terminée');
});

it('hides another organization project activity', function () {
    [$owner, $org] = activityOrg();
    $projectId = $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/projects', ['name' => 'Privé'])
        ->assertCreated()
        ->json('id');

    [$other, $otherOrg] = activityOrg();

    $this->actingAs($other, 'sanctum')
        ->withHeader('X-Organization-Id', $otherOrg->id)
        ->getJson("/api/v1/projects/{$projectId}/activity")
        ->assertNotFound();
});
