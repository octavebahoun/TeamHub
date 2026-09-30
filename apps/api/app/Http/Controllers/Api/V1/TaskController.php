<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request, Project $project): JsonResponse
    {
        $tasks = $project->tasks()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('assignee_id'), fn ($q) => $q->where('assignee_id', $request->integer('assignee_id')))
            ->with('assignee')
            ->orderBy('position')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', 'exists:users,id'],
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

        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        return response()->json($task->load('assignee', 'creator', 'subtasks', 'comments.author'));
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'assignee_id' => ['nullable', 'exists:users,id'],
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

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json(['message' => 'Tâche supprimée.']);
    }
}
