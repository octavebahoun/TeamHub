<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Services\InboxNotifier;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class TaskController extends Controller
{
    public function __construct(protected InboxNotifier $inbox) {}

    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('viewAny', Task::class);
        $tasks = $project->tasks()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('assignee_id'), fn ($q) => $q->where('assignee_id', $request->integer('assignee_id')))
            ->with('assignee')
            ->withCount([
                'subtasks',
                'subtasks as done_subtasks_count' => fn ($q) => $q->where('status', Task::STATUS_DONE),
                'comments',
            ])
            ->orderBy('position')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('create', Task::class);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', $this->orgMemberRule()],
            'parent_id' => ['nullable', 'exists:tasks,id'],
            'status' => ['nullable', 'in:'.implode(',', Task::STATUSES)],
            'priority' => ['nullable', 'in:'.implode(',', Task::PRIORITIES)],
            'due_date' => ['nullable', 'date'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['project_id'] = $project->id;
        $data['created_by'] = $request->user()->id;
        $data['status'] ??= Task::STATUS_TODO;
        $data['priority'] ??= 'normal';

        $task = Task::create($data);

        if ($task->assignee_id && $task->assignee_id !== $request->user()->id) {
            $this->inbox->toUser($task->assignee_id, 'task.assigned', 'Nouvelle tâche assignée', $task->title, '/taches/'.$task->id, [
                'task_id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
            ]);
        }

        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);
        $task->load('assignee', 'creator', 'subtasks', 'comments.author', 'attachments');

        $payload = $task->toArray();
        $payload['attachments'] = $task->attachments->map(fn ($a) => $a->toSummary())->values();

        return response()->json($payload);
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', $this->orgMemberRule()],
            'status' => ['sometimes', 'in:'.implode(',', Task::STATUSES)],
            'priority' => ['sometimes', 'in:'.implode(',', Task::PRIORITIES)],
            'due_date' => ['nullable', 'date'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (($data['status'] ?? null) === Task::STATUS_DONE && ! $task->completed_at) {
            $data['completed_at'] = now();
        } elseif (isset($data['status']) && $data['status'] !== Task::STATUS_DONE) {
            $data['completed_at'] = null;
        }

        $previousAssignee = $task->assignee_id;
        $task->update($data);

        if (array_key_exists('assignee_id', $data)
            && $task->assignee_id
            && $task->assignee_id !== $previousAssignee
            && $task->assignee_id !== $request->user()->id) {
            $this->inbox->toUser($task->assignee_id, 'task.assigned', 'Nouvelle tâche assignée', $task->title, '/taches/'.$task->id, [
                'task_id' => $task->id,
                'title' => $task->title,
                'project_id' => $task->project_id,
            ]);
        }

        return response()->json($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);
        $task->delete();

        return response()->json(['message' => 'Tâche supprimée.']);
    }

    protected function orgMemberRule(): Exists
    {
        return Rule::exists('memberships', 'user_id')
            ->where('organization_id', CurrentOrganization::id());
    }
}
