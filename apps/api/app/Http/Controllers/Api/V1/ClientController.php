<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $clients = Client::query()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->string('q').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->with('owner:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'company' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['owner_id'] = $request->user()->id;

        $client = Client::create($data);
        Activity::log($client, 'client.created', $request->user()->id);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json(
            $client->load('owner:id,name', 'opportunities')
        );
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'company' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
        ]);

        $client->update($data);
        Activity::log($client, 'client.updated', $request->user()->id);

        return response()->json($client);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        Activity::log($client, 'client.deleted', $request->user()->id);
        $client->delete();

        return response()->json(['message' => 'Client supprimé.']);
    }
}
