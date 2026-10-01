<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Project;
use App\Models\Task;
use App\Services\RealtimePublisher;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(protected RealtimePublisher $realtime) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);
        $user = $request->user();
        $role = OrganizationRole::of($user);

        $projects = Project::query()
            ->when($request->boolean('archived'),
                fn ($q) => $q->whereNotNull('archived_at'),
                fn ($q) => $q->whereNull('archived_at'))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when(
                in_array($role, [Membership::ROLE_MEMBER, Membership::ROLE_GUEST], true),
                fn ($q) => $q->whereHas('members', fn ($m) => $m->whereKey($user->id))
            )
            ->when(
                $role === Membership::ROLE_MANAGER,
                fn ($q) => $q->where(fn ($w) => $w
                    ->where('owner_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->whereKey($user->id)))
            )
            ->with('owner', 'members:id,name,avatar')
            ->withCount($this->rootTaskCounts())
            ->latest()
            ->paginate(20);

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Project::class);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:'.implode(',', Project::STATUSES)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $data['owner_id'] = $request->user()->id;
        $data['status'] ??= Project::STATUS_UPCOMING;

        $project = Project::create($data);
        $project->members()->syncWithoutDetaching([$request->user()->id]);

        $this->realtime->projectEvent('project.created', $project->organization_id, $project->id, [
            'name' => $project->name,
            'member_ids' => [$request->user()->id],
        ]);

        return response()->json($project, 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        return response()->json(
            $project->load('owner', 'members')->loadCount($this->rootTaskCounts())
        );
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:'.implode(',', Project::STATUSES)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->update(['archived_at' => now()]);

        return response()->json(['message' => 'Projet archivé.']);
    }

    // Avancement : tâches racines uniquement (les sous-tâches ne comptent pas).
    protected function rootTaskCounts(): array
    {
        return [
            'tasks' => fn ($q) => $q->whereNull('parent_id'),
            'tasks as done_tasks_count' => fn ($q) => $q->whereNull('parent_id')
                ->where('status', Task::STATUS_DONE),
        ];
    }
}
