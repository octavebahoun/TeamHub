<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\RealtimePublisher;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectMemberController extends Controller
{
    public function __construct(protected RealtimePublisher $realtime) {}

    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $data = $request->validate([
            'user_id' => [
                'required',
                Rule::exists('memberships', 'user_id')
                    ->where('organization_id', CurrentOrganization::id()),
            ],
        ]);

        $project->members()->syncWithoutDetaching([$data['user_id']]);

        $this->realtime->projectEvent('project.members_changed', $project->organization_id, $project->id, [
            'name' => $project->name,
            'member_ids' => $project->members()->pluck('users.id')->all(),
        ]);

        return response()->json($project->members()->get(), 201);
    }

    public function destroy(Request $request, Project $project, int $userId): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        abort_if($userId === $project->owner_id, 403, 'Impossible de retirer le propriétaire du projet.');

        $project->members()->detach($userId);

        $this->realtime->projectEvent('project.members_changed', $project->organization_id, $project->id, [
            'name' => $project->name,
            'member_ids' => $project->members()->pluck('users.id')->all(),
        ]);

        return response()->json(['message' => 'Membre retiré du projet.']);
    }
}
