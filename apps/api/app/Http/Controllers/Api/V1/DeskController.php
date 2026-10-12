<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingContract;
use App\Models\Client;
use App\Models\ClientConversation;
use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Services\TeamDesk;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeskController extends Controller
{
    public function __construct(protected TeamDesk $desk) {}

    public function storeMilestone(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate(['title' => ['required', 'string', 'max:160']]);
        $this->desk->addMilestone($request->user(), $project, $data['title']);

        return response()->json($this->desk->milestones($project), 201);
    }

    public function updateMilestone(Request $request, Project $project, ProjectMilestone $milestone): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate(['done' => ['required', 'boolean']]);
        $this->desk->toggleMilestone($request->user(), $project, $milestone, $data['done']);

        return response()->json($this->desk->milestones($project));
    }

    public function deliverables(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        return response()->json($this->desk->deliverables($project));
    }

    public function storeDeliverable(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'fileName' => ['nullable', 'string', 'max:255'],
        ]);
        $created = $this->desk->addDeliverable($request->user(), $project, $data['title'], $data['fileName'] ?? null);

        return response()->json($this->desk->deliverableApi($created), 201);
    }

    public function conversations(Request $request): JsonResponse
    {
        $this->guardCrm($request);
        $clientId = $this->clientId($request->string('clientId')->toString());

        return response()->json($this->desk->listConversations($clientId));
    }

    public function storeConversation(Request $request): JsonResponse
    {
        $this->guardCrm($request);
        $data = $request->validate([
            'clientId' => ['required', 'string'],
            'channel' => ['required', 'in:whatsapp,telegram'],
        ]);
        $client = $this->client($data['clientId']);
        $this->authorize('view', $client);
        $conversation = $this->desk->openConversation($client, $data['channel']);

        return response()->json($this->desk->thread($conversation), 201);
    }

    public function showConversation(Request $request, ClientConversation $conversation): JsonResponse
    {
        $this->guardCrm($request);
        $this->authorize('view', $conversation->client);

        return response()->json($this->desk->thread($conversation));
    }

    public function reply(Request $request, ClientConversation $conversation): JsonResponse
    {
        $this->guardCrm($request);
        $this->authorize('view', $conversation->client);
        $data = $request->validate(['text' => ['required', 'string', 'max:4000']]);
        $message = $this->desk->reply($request->user(), $conversation, $data['text']);

        return response()->json([
            'message' => [
                'id' => (string) $message->id,
                'sender' => 'freelance',
                'content' => $message->body,
                'deliveryStatus' => 'sent',
                'createdAt' => $message->created_at?->toIso8601String(),
            ],
            'iaActive' => false,
        ], 201);
    }

    public function reviews(Request $request): JsonResponse
    {
        $this->guardCrm($request);

        return response()->json($this->desk->reviews());
    }

    public function storeReview(Request $request, Client $client): JsonResponse
    {
        $this->authorize('view', $client);
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'projectId' => ['nullable', 'integer'],
            'submittedByName' => ['nullable', 'string', 'max:120'],
        ]);
        $this->desk->addReview(
            $request->user(),
            $client,
            $data['rating'],
            $data['comment'] ?? null,
            $data['projectId'] ?? null,
            $data['submittedByName'] ?? null
        );

        return response()->json($this->desk->reviews(), 201);
    }

    public function signContract(Request $request, BillingContract $contract): JsonResponse
    {
        $this->authorize('update', $contract->project);
        $data = $request->validate([
            'signerName' => ['required', 'string', 'max:120'],
            'signerEmail' => ['nullable', 'email', 'max:160'],
        ]);
        $contract = $this->desk->sign($request->user(), $contract, $data['signerName'], $data['signerEmail'] ?? null);

        return response()->json($contract->toApi());
    }

    public function verifySignature(string $token): JsonResponse
    {
        return response()->json($this->desk->verify($token));
    }

    protected function guardCrm(Request $request): void
    {
        abort_unless(OrganizationRole::isManager($request->user()), 403, 'Réservé au CRM.');
    }

    protected function client(string $ref): Client
    {
        $id = $this->clientId($ref);
        abort_unless($id, 422, 'Client invalide.');
        $client = Client::query()->find($id);
        abort_unless($client, 404, 'Client introuvable.');

        return $client;
    }

    protected function clientId(string $ref): ?int
    {
        if ($ref === '') {
            return null;
        }
        if (str_starts_with($ref, 'wine-c-')) {
            $ref = substr($ref, 7);
        }

        return ctype_digit($ref) ? (int) $ref : null;
    }
}
