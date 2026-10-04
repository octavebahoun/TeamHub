<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
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
        Activity::log($project, 'project.created', $request->user()->id, ['name' => $project->name]);

        $this->realtime->projectEvent('project.created', $project->organization_id, $project->id, [
            'name' => $project->name,
            'member_ids' => [$request->user()->id],
        ]);

        return response()->json($project, 201);
    }

    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);
        $project->load('owner', 'members', 'attachments')->loadCount($this->rootTaskCounts());

        $payload = $project->toArray();
        $payload['attachments'] = $project->attachments->map(fn ($a) => $a->toSummary())->values();

        return response()->json($payload);
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

        $previousStatus = $project->status;
        $project->update($data);

        if (array_key_exists('status', $data) && $project->status !== $previousStatus) {
            Activity::log($project, 'project.status_changed', $request->user()->id, [
                'name' => $project->name,
                'from' => $previousStatus,
                'to' => $project->status,
            ]);
        }

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->authorize('delete', $project);
        $project->update(['archived_at' => now()]);
        Activity::log($project, 'project.archived', $request->user()->id, ['name' => $project->name]);

        return response()->json(['message' => 'Projet archivé.']);
    }

    public function activity(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $taskIds = $project->tasks()->pluck('id');

        $activities = Activity::query()
            ->where(fn ($q) => $q
                ->where(fn ($w) => $w
                    ->where('subject_type', $project->getMorphClass())
                    ->where('subject_id', $project->id))
                ->orWhere(fn ($w) => $w
                    ->where('subject_type', (new Task)->getMorphClass())
                    ->whereIn('subject_id', $taskIds)))
            ->with('user:id,name')
            ->latest()
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'action' => $activity->action,
                'kind' => $activity->kind,
                'body' => $activity->sentence(),
                'meta' => $activity->meta,
                'user' => $activity->user ? ['id' => $activity->user->id, 'name' => $activity->user->name] : null,
                'created_at' => $activity->created_at,
            ])
            ->values();

        return response()->json($activities);
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
