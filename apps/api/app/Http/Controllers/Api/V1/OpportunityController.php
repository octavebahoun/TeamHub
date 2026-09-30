<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Project;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OpportunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $opportunities = Opportunity::query()
            ->when($request->filled('stage'), fn ($q) => $q->where('stage', $request->string('stage')))
            ->when($request->filled('client_id'), fn ($q) => $q->where('client_id', $request->integer('client_id')))
            ->with('client:id,name,company', 'owner:id,name', 'project:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($opportunities);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:200'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'stage' => ['nullable', 'in:'.implode(',', Opportunity::STAGES)],
            'next_follow_up' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['owner_id'] = $request->user()->id;
        $data['stage'] ??= Opportunity::STAGE_PROSPECT;

        $opportunity = Opportunity::create($data);
        Activity::log($opportunity, 'opportunity.created', $request->user()->id);

        return response()->json($opportunity, 201);
    }

    public function show(Opportunity $opportunity): JsonResponse
    {
        return response()->json(
            $opportunity->load('client', 'owner:id,name', 'project:id,name')
        );
    }

    public function update(Request $request, Opportunity $opportunity): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'stage' => ['sometimes', 'in:'.implode(',', Opportunity::STAGES)],
            'next_follow_up' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $previousStage = $opportunity->stage;
        $newStage = $data['stage'] ?? $previousStage;
        $stageChanged = $newStage !== $previousStage;

        DB::transaction(function () use ($opportunity, $data, $stageChanged, $newStage, $previousStage, $request) {
            if ($stageChanged && in_array($newStage, [Opportunity::STAGE_WON, Opportunity::STAGE_LOST], true)) {
                $data['closed_at'] = now();
            }

            $opportunity->update($data);

            if ($stageChanged) {
                Activity::log($opportunity, 'opportunity.stage_changed', $request->user()->id, [
                    'from' => $previousStage,
                    'to' => $newStage,
                ]);

                if ($newStage === Opportunity::STAGE_WON && ! $opportunity->project_id) {
                    $project = Project::create([
                        'owner_id' => $request->user()->id,
                        'name' => $opportunity->title,
                        'description' => "Créé depuis l'opportunité gagnée #{$opportunity->id}.",
                        'status' => Project::STATUS_UPCOMING,
                    ]);
                    $opportunity->update(['project_id' => $project->id]);
                    Activity::log($project, 'project.created_from_opportunity', $request->user()->id, [
                        'opportunity_id' => $opportunity->id,
                    ]);
                }
            }
        });

        return response()->json($opportunity->fresh()->load('project:id,name'));
    }

    public function destroy(Request $request, Opportunity $opportunity): JsonResponse
    {
        Activity::log($opportunity, 'opportunity.deleted', $request->user()->id);
        $opportunity->delete();

        return response()->json(['message' => 'Opportunité supprimée.']);
    }
}
