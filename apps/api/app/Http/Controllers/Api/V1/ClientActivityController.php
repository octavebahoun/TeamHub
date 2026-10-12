<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Opportunity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientActivityController extends Controller
{
    // Historique d'un client : échanges saisis (note, appel…) + actions journalisées
    // sur le client et sur ses opportunités (création, changement d'étape…).
    public function index(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        $opportunityIds = $client->opportunities()->pluck('id');

        $activities = Activity::query()
            ->where(fn ($q) => $q
                ->where(fn ($w) => $w
                    ->where('subject_type', $client->getMorphClass())
                    ->where('subject_id', $client->id))
                ->orWhere(fn ($w) => $w
                    ->where('subject_type', (new Opportunity)->getMorphClass())
                    ->whereIn('subject_id', $opportunityIds)))
            ->with('user:id,name')
            ->latest()
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        return response()->json($activities);
    }

    public function store(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $data = $request->validate([
            'kind' => ['required', 'in:'.implode(',', Activity::KINDS)],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $activity = Activity::create([
            'user_id' => $request->user()->id,
            'subject_type' => $client->getMorphClass(),
            'subject_id' => $client->id,
            'action' => 'activity.'.$data['kind'],
            'kind' => $data['kind'],
            'body' => $data['body'],
        ]);

        return response()->json($activity->load('user:id,name'), 201);
    }
}
