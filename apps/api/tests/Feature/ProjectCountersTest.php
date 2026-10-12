<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Support\CurrentOrganization;

// Projet avec 3 tâches racines (dont 1 terminée), 2 sous-tâches (dont 1 terminée)
// et 2 commentaires sur la première tâche.
function projectWithTasks(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'CountCo',
        'slug' => 'count-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Counted']);
    $project->members()->attach($owner->id);

    $make = fn (array $attrs) => Task::create([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $owner->id,
        'title' => 'T',
        ...$attrs,
    ]);
    $parent = $make(['status' => Task::STATUS_IN_PROGRESS]);
    $make(['status' => Task::STATUS_DONE]);
    $make(['status' => Task::STATUS_TODO]);
    $make(['parent_id' => $parent->id, 'status' => Task::STATUS_DONE]);
    $make(['parent_id' => $parent->id, 'status' => Task::STATUS_TODO]);
    TaskComment::create(['organization_id' => $org->id, 'task_id' => $parent->id, 'user_id' => $owner->id, 'body' => 'a']);
    TaskComment::create(['organization_id' => $org->id, 'task_id' => $parent->id, 'user_id' => $owner->id, 'body' => 'b']);
    CurrentOrganization::set(null);

    return [$owner, $org, $project, $parent];
}

afterEach(fn () => CurrentOrganization::set(null));

it('adds root task counters and members to the project list', function () {
    [$owner, $org, $project] = projectWithTasks();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/projects')
        ->assertOk()
        ->assertJsonPath('data.0.id', $project->id)
        ->assertJsonPath('data.0.tasks_count', 3)
        ->assertJsonPath('data.0.done_tasks_count', 1)
        ->assertJsonPath('data.0.members.0.id', $owner->id)
        ->assertJsonStructure(['data' => [['members' => [['id', 'name', 'avatar']]]]]);
});

it('adds done_tasks_count to the project detail', function () {
    [$owner, $org, $project] = projectWithTasks();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/projects/{$project->id}")
        ->assertOk()
        ->assertJsonPath('tasks_count', 3)
        ->assertJsonPath('done_tasks_count', 1);
});

it('adds subtask and comment counters to the task list', function () {
    [$owner, $org, $project, $parent] = projectWithTasks();

    $response = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/projects/{$project->id}/tasks")
        ->assertOk();

    $row = collect($response->json())->firstWhere('id', $parent->id);
    expect($row['subtasks_count'])->toBe(2)
        ->and($row['done_subtasks_count'])->toBe(1)
        ->and($row['comments_count'])->toBe(2);
});
