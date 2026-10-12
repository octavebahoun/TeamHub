<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\BillingContract;
use App\Models\Client;
use App\Models\ClientConversation;
use App\Models\ClientConversationMessage;
use App\Models\ClientReview;
use App\Models\Project;
use App\Models\ProjectDeliverable;
use App\Models\ProjectMilestone;
use App\Models\User;
use Illuminate\Support\Str;

class TeamDesk
{
    public function milestones(Project $project): array
    {
        $rows = $project->milestones()->orderBy('position')->orderBy('id')->get();
        $currentId = $rows->first(fn (ProjectMilestone $m) => ! $m->done)?->id;

        return $rows->map(fn (ProjectMilestone $m) => [
            'id' => $m->id,
            'code' => $m->code,
            'title' => $m->title,
            'done' => $m->done,
            'current' => $m->id === $currentId,
        ])->values()->all();
    }

    public function addMilestone(User $user, Project $project, string $title): ProjectMilestone
    {
        $position = (int) $project->milestones()->max('position') + 1;
        $milestone = $project->milestones()->create([
            'code' => 'J'.$position,
            'title' => $title,
            'done' => false,
            'position' => $position,
        ]);
        Activity::log($project, 'project.milestone_added', $user->id, ['title' => $title]);

        return $milestone;
    }

    public function toggleMilestone(User $user, Project $project, ProjectMilestone $milestone, bool $done): void
    {
        abort_unless($milestone->project_id === $project->id, 404);
        $milestone->update(['done' => $done]);
        Activity::log($project, $done ? 'project.milestone_done' : 'project.milestone_reopened', $user->id, [
            'title' => $milestone->title,
        ]);
    }

    public function deliverables(Project $project): array
    {
        return $project->deliverables()->latest()->get()->map(fn (ProjectDeliverable $d) => $this->deliverableApi($d))->values()->all();
    }

    public function addDeliverable(User $user, Project $project, string $title, ?string $fileName): ProjectDeliverable
    {
        $version = (int) $project->deliverables()->where('title', $title)->max('version') + 1;
        $deliverable = $project->deliverables()->create([
            'title' => $title,
            'status' => 'submitted',
            'version' => max(1, $version),
            'file_name' => $fileName,
            'submitted_at' => now(),
        ]);
        Activity::log($project, 'project.deliverable_submitted', $user->id, ['title' => $title]);

        return $deliverable;
    }

    public function deliverableApi(ProjectDeliverable $d): array
    {
        return [
            'id' => (string) $d->id,
            'organizationId' => (string) $d->organization_id,
            'projectId' => 'wine-p-'.$d->project_id,
            'title' => $d->title,
            'description' => null,
            'status' => $d->status,
            'fileId' => null,
            'fileName' => $d->file_name,
            'fileSizeBytes' => null,
            'fileMime' => null,
            'submittedAt' => $d->submitted_at?->toIso8601String(),
            'reviewedAt' => null,
            'reviewedByName' => null,
            'reviewedByEmail' => null,
            'rejectionReason' => null,
            'version' => $d->version,
            'parentId' => null,
            'createdAt' => $d->created_at?->toIso8601String(),
            'updatedAt' => $d->updated_at?->toIso8601String(),
        ];
    }

    public function listConversations(?int $clientId): array
    {
        return ClientConversation::query()
            ->with('messages')
            ->when($clientId, fn ($q) => $q->where('client_id', $clientId))
            ->latest()
            ->get()
            ->map(fn (ClientConversation $c) => $this->summary($c))
            ->values()
            ->all();
    }

    public function openConversation(Client $client, string $channel): ClientConversation
    {
        abort_unless(in_array($channel, ['whatsapp', 'telegram'], true), 422, 'Canal inconnu.');

        return ClientConversation::query()->firstOrCreate(
            ['client_id' => $client->id, 'channel' => $channel],
            [
                'display_name' => $client->company ?: $client->name,
                'identifier_label' => $client->phone ?: $client->email ?: $client->name,
            ]
        );
    }

    public function thread(ClientConversation $conversation): array
    {
        $conversation->load('messages');

        return $this->summary($conversation) + [
            'messages' => $conversation->messages->sortBy('id')->map(fn (ClientConversationMessage $m) => [
                'id' => (string) $m->id,
                'sender' => $m->sender,
                'content' => $m->body,
                'deliveryStatus' => 'sent',
                'createdAt' => $m->created_at?->toIso8601String(),
            ])->values()->all(),
            'collected' => ['need' => null, 'budget' => null, 'notes' => null],
        ];
    }

    public function reply(User $user, ClientConversation $conversation, string $text): ClientConversationMessage
    {
        $message = $conversation->messages()->create([
            'sender' => 'freelance',
            'body' => $text,
            'user_id' => $user->id,
        ]);
        $conversation->touch();
        if ($conversation->client) {
            $channel = $conversation->channel === 'telegram' ? 'Telegram' : 'WhatsApp';
            $activity = Activity::log($conversation->client, 'client.message', $user->id);
            $activity->update(['body' => 'a écrit sur '.$channel.' : '.$text]);
        }

        return $message;
    }

    public function reviews(): array
    {
        return ClientReview::query()->latest('submitted_at')->limit(20)->get()->map(fn (ClientReview $r) => [
            'id' => (string) $r->id,
            'organizationId' => (string) $r->organization_id,
            'requestId' => (string) $r->id,
            'projectId' => $r->project_id ? 'wine-p-'.$r->project_id : '',
            'clientId' => 'wine-c-'.$r->client_id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'submittedAt' => $r->submitted_at?->toIso8601String(),
            'submittedByName' => $r->submitted_by_name,
            'submittedByEmail' => null,
            'isPublic' => $r->rating === 5,
            'moderationStatus' => 'published',
        ])->values()->all();
    }

    public function addReview(User $user, Client $client, int $rating, ?string $comment, ?int $projectId, ?string $name): ClientReview
    {
        $review = ClientReview::query()->create([
            'client_id' => $client->id,
            'project_id' => $projectId,
            'rating' => $rating,
            'comment' => $comment,
            'submitted_by_name' => $name ?: $client->name,
            'submitted_at' => now(),
        ]);
        Activity::log($client, 'client.review', $user->id);

        return $review;
    }

    public function sign(User $user, BillingContract $contract, string $signerName, ?string $signerEmail): BillingContract
    {
        $token = $contract->signature_token ?: Str::lower(Str::random(32));
        $contract->update([
            'status' => 'signed',
            'signed_at' => $contract->signed_at ?? now(),
            'signature_token' => $token,
            'signer_name' => $signerName,
            'signer_email' => $signerEmail,
        ]);
        if ($contract->project) {
            Activity::log($contract->project, 'project.contract_signed', $user->id, ['title' => $contract->title]);
        }

        return $contract->fresh();
    }

    public function verify(string $token): array
    {
        $contract = BillingContract::query()->withoutGlobalScopes()->where('signature_token', $token)->first();
        if (! $contract || ! $contract->signed_at) {
            return [
                'valid' => false,
                'signedAt' => null,
                'signerName' => null,
                'documentNumber' => null,
                'signatureHash' => null,
            ];
        }

        return [
            'valid' => true,
            'signedAt' => $contract->signed_at->toIso8601String(),
            'signerName' => $contract->signer_name,
            'documentNumber' => $contract->number,
            'signatureHash' => hash('sha256', $contract->signature_token.'|'.$contract->number),
        ];
    }

    public function summary(ClientConversation $c): array
    {
        $last = $c->messages->sortByDesc('id')->first();

        return [
            'id' => (string) $c->id,
            'channel' => $c->channel,
            'displayName' => $c->display_name,
            'identifierLabel' => $c->identifier_label ?? '',
            'iaActive' => false,
            'lastMessageAt' => $last?->created_at?->toIso8601String(),
            'lastMessage' => $last ? ['sender' => $last->sender, 'preview' => $last->body] : null,
            'quote' => null,
        ];
    }
}
