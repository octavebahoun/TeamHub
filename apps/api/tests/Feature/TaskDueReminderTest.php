<?php

use App\Jobs\SendTaskDueReminders;
use App\Models\InboxNotification;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskDueReminderNotification;
use App\Support\CurrentOrganization;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Redis;

function reminderOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create(['name' => 'ReminderCo', 'slug' => 'reminder-'.uniqid(), 'owner_id' => $owner->id]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $assignee = User::factory()->create();
    Membership::create(['user_id' => $assignee->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Lancement']);
    $project->members()->attach([$owner->id, $assignee->id]);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'assignee', 'project');
}

function makeReminderTask(Organization $org, Project $project, User $creator, array $attrs = []): Task
{
    CurrentOrganization::set($org);
    $task = Task::create(array_merge([
        'organization_id' => $org->id,
        'project_id' => $project->id,
        'created_by' => $creator->id,
        'title' => 'Livrer la maquette',
        'priority' => 'urgent',
        'due_date' => now()->addDay()->toDateString(),
    ], $attrs));
    CurrentOrganization::set(null);

    return $task;
}

function runReminderJob(): void
{
    Redis::shouldReceive('publish')->zeroOrMoreTimes();
    app()->call([new SendTaskDueReminders, 'handle']);
}

afterEach(fn () => CurrentOrganization::set(null));

it('reminds the assignee of a critical task due tomorrow and marks it sent', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    $task = makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id]);

    Notification::fake();
    runReminderJob();

    Notification::assertSentTo($assignee, TaskDueReminderNotification::class, fn ($n) => $n->unassigned === false && $n->task->id === $task->id);

    expect($task->fresh()->due_reminder_sent_at)->not->toBeNull();

    $notice = InboxNotification::withoutGlobalScopes()->where('user_id', $assignee->id)->first();
    expect($notice->type)->toBe('task.due_soon')
        ->and($notice->body)->toBe('Livrer la maquette');
});

it('alerts the project owner when the critical task has no assignee', function () {
    ['owner' => $owner, 'org' => $org, 'project' => $project] = reminderOrg();
    $task = makeReminderTask($org, $project, $owner, ['assignee_id' => null]);

    Notification::fake();
    runReminderJob();

    Notification::assertSentTo($owner, TaskDueReminderNotification::class, fn ($n) => $n->unassigned === true && $n->task->id === $task->id);

    $notice = InboxNotification::withoutGlobalScopes()->where('user_id', $owner->id)->first();
    expect($notice->type)->toBe('task.unassigned_due_soon');
});

it('ignores a normal priority task even if due tomorrow', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id, 'priority' => 'normal']);

    Notification::fake();
    runReminderJob();

    Notification::assertNothingSent();
});

it('ignores tasks due in two days or already past due', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id, 'due_date' => now()->addDays(2)->toDateString()]);
    makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id, 'due_date' => now()->subDay()->toDateString()]);

    Notification::fake();
    runReminderJob();

    Notification::assertNothingSent();
});

it('ignores an already completed critical task', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    makeReminderTask($org, $project, $owner, [
        'assignee_id' => $assignee->id,
        'status' => Task::STATUS_DONE,
        'completed_at' => now(),
    ]);

    Notification::fake();
    runReminderJob();

    Notification::assertNothingSent();
});

it('sends only once per task even if the job runs twice', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id]);

    Notification::fake();
    runReminderJob();
    runReminderJob();

    Notification::assertSentToTimes($assignee, TaskDueReminderNotification::class, 1);
    expect(InboxNotification::withoutGlobalScopes()->where('user_id', $assignee->id)->count())->toBe(1);
});

it('allows a new reminder after the due date is pushed back', function () {
    ['owner' => $owner, 'org' => $org, 'assignee' => $assignee, 'project' => $project] = reminderOrg();
    $task = makeReminderTask($org, $project, $owner, ['assignee_id' => $assignee->id]);

    Notification::fake();
    runReminderJob();
    Notification::assertSentToTimes($assignee, TaskDueReminderNotification::class, 1);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/tasks/{$task->id}", ['due_date' => now()->addDays(5)->toDateString()])
        ->assertOk();

    expect($task->fresh()->due_reminder_sent_at)->toBeNull();

    $task->fresh()->update(['due_date' => now()->addDay()->toDateString()]);
    runReminderJob();

    Notification::assertSentToTimes($assignee, TaskDueReminderNotification::class, 2);
});
