<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Membership;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);
        $user = $request->user();

        $clients = Client::query()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when(
                OrganizationRole::of($user) === Membership::ROLE_MANAGER,
                fn ($q) => $q->where('owner_id', $user->id)
            )
            ->with('owner:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Client::class);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'company' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['owner_id'] = $request->user()->id;

        $client = Client::create($data);
        Activity::log($client, 'client.created', $request->user()->id);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);
        return response()->json(
            $client->load('owner:id,name', 'opportunities')
        );
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'company' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $client->update($data);
        Activity::log($client, 'client.updated', $request->user()->id);

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->authorize('delete', $client);
        Activity::log($client, 'client.deleted', $request->user()->id);
        $client->delete();

        return response()->json(['message' => 'Client supprimé.']);
    }
}
