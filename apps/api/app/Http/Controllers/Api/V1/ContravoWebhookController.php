<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Post;
use App\Models\Project;
use App\Models\Task;
use App\Services\InboxNotifier;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Reçoit les événements Contravo (devis, factures, contrats). Route publique,
 * jamais authentifiée par Sanctum : la seule protection est la signature
 * HMAC-SHA256 vérifiée ci-dessous. Toujours idempotent — Contravo peut
 * renvoyer le même événement plusieurs fois.
 *
 * Contravo référence ses objets par ses propres identifiants. En l'absence
 * d'un identifiant déjà connu (contravo_quote_id, contravo_invoice_id...),
 * on retombe sur `data.reference`, l'identifiant WINE que l'on transmettra
 * à Contravo lors de la création du devis/de la facture (câblage à faire
 * côté bouton « Générer devis »).
 */
class ContravoWebhookController extends Controller
{
    public function __construct(protected InboxNotifier $inbox) {}

    public function __invoke(Request $request): JsonResponse
    {
        $this->verifySignature($request);

        $event = (string) $request->input('event');
        $data = (array) $request->input('data', []);

        match ($event) {
            'quote.accepted' => $this->handleQuoteAccepted($data),
            'quote.rejected' => $this->handleQuoteRejected($data),
            'invoice.paid' => $this->handleInvoicePaid($data),
            'invoice.overdue' => $this->handleInvoiceOverdue($data),
            'contract.signed' => $this->handleContractSigned($data),
            'deliverable.approved' => $this->handleDeliverableApproved($data),
            'deliverable.rejected' => $this->handleDeliverableRejected($data),
            'conversation.message_received' => $this->handleConversationMessageReceived($data),
            'review.submitted' => $this->handleReviewSubmitted($data),
            default => Log::info('Webhook Contravo ignoré', ['event' => $event]),
        };

        return response()->json(['ok' => true]);
    }

    protected function verifySignature(Request $request): void
    {
        $secret = config('services.contravo.webhook_secret');
        abort_if(blank($secret), 500, 'CONTRAVO_WEBHOOK_SECRET manquant.');

        $signature = (string) $request->header('X-Contravo-Signature');
        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        abort_unless($signature !== '' && hash_equals($expected, $signature), 401, 'Signature invalide.');
    }

    protected function handleQuoteAccepted(array $data): void
    {
        $opportunity = $this->findOpportunity($data);
        abort_unless($opportunity, 404, 'Opportunité introuvable pour ce devis.');

        CurrentOrganization::set($opportunity->organization);

        if ($opportunity->stage !== Opportunity::STAGE_WON) {
            DB::transaction(function () use ($opportunity, $data) {
                $opportunity->update([
                    'stage' => Opportunity::STAGE_WON,
                    'closed_at' => now(),
                    'contravo_quote_id' => $this->externalId($data, 'quote_id') ?? $opportunity->contravo_quote_id,
                ]);

                Activity::log($opportunity, 'opportunity.stage_changed', null, [
                    'to' => Opportunity::STAGE_WON,
                    'source' => 'contravo_webhook',
                ]);

                if (! $opportunity->project_id) {
                    // Statut "on_hold" : le projet attend l'acompte (invoice.paid) pour démarrer.
                    $project = Project::create([
                        'owner_id' => $opportunity->owner_id,
                        'name' => $opportunity->title,
                        'description' => "Créé automatiquement depuis le devis Contravo accepté.",
                        'status' => Project::STATUS_ON_HOLD,
                    ]);
                    $project->members()->syncWithoutDetaching([$opportunity->owner_id]);
                    $opportunity->update(['project_id' => $project->id]);

                    Activity::log($project, 'project.created_from_opportunity', null, [
                        'opportunity_id' => $opportunity->id,
                        'source' => 'contravo_webhook',
                    ]);
                }
            });
        }

        CurrentOrganization::set(null);
    }

    protected function handleQuoteRejected(array $data): void
    {
        $opportunity = $this->findOpportunity($data);
        abort_unless($opportunity, 404, 'Opportunité introuvable pour ce devis.');

        CurrentOrganization::set($opportunity->organization);
        Activity::log($opportunity, 'opportunity.quote_rejected', null, ['source' => 'contravo_webhook']);

        // Alerte au commercial responsable de l'opportunité (exigence de la roadmap Contravo).
        $this->inbox->toUser(
            $opportunity->owner_id,
            'quote.rejected',
            'Devis refusé',
            $opportunity->title,
            '/crm/'.$opportunity->client_id,
            ['opportunity_id' => $opportunity->id],
        );

        CurrentOrganization::set(null);
    }

    protected function handleInvoicePaid(array $data): void
    {
        $project = $this->findProjectByInvoice($data);
        abort_unless($project, 404, 'Projet introuvable pour cette facture.');

        CurrentOrganization::set($project->organization);

        if ($project->status === Project::STATUS_ON_HOLD) {
            $project->update([
                'status' => Project::STATUS_IN_PROGRESS,
                'contravo_invoice_id' => $this->externalId($data, 'invoice_id') ?? $project->contravo_invoice_id,
            ]);

            Activity::log($project, 'project.unlocked_by_payment', null, ['source' => 'contravo_webhook']);

            $this->notifyTeam($project, 'project.unlocked', 'Projet débloqué', $project->name, '/projets/'.$project->id, [
                'project_id' => $project->id,
            ]);
        }

        CurrentOrganization::set(null);
    }

    protected function handleInvoiceOverdue(array $data): void
    {
        $project = $this->findProjectByInvoice($data);
        abort_unless($project, 404, 'Projet introuvable pour cette facture.');

        CurrentOrganization::set($project->organization);

        $managerIds = Membership::query()
            ->where('organization_id', $project->organization_id)
            ->whereIn('role', OrganizationRole::MANAGEMENT_ROLES)
            ->pluck('user_id')
            ->all();

        $this->inbox->toUsers($managerIds, $project->organization_id, 'invoice.overdue', 'Facture en retard', $project->name, '/projets/'.$project->id, [
            'project_id' => $project->id,
        ]);

        CurrentOrganization::set(null);
    }

    protected function handleContractSigned(array $data): void
    {
        $project = $this->findProjectByContract($data);
        abort_unless($project, 404, 'Projet introuvable pour ce contrat.');

        CurrentOrganization::set($project->organization);

        $project->update([
            'contravo_contract_id' => $this->externalId($data, 'contract_id') ?? $project->contravo_contract_id,
        ]);

        $this->notifyTeam($project, 'contract.signed', 'Contrat signé', $project->name, '/projets/'.$project->id, [
            'project_id' => $project->id,
        ]);

        CurrentOrganization::set(null);
    }

    protected function handleDeliverableApproved(array $data): void
    {
        $task = $this->findTaskByDeliverable($data);
        abort_unless($task, 404, 'Tâche introuvable pour ce livrable.');

        CurrentOrganization::set($task->organization);

        if ($task->status !== Task::STATUS_DONE) {
            $task->update([
                'status' => Task::STATUS_DONE,
                'completed_at' => now(),
                'contravo_deliverable_id' => $this->externalId($data, 'deliverable_id') ?? $task->contravo_deliverable_id,
            ]);

            Activity::log($task, 'task.deliverable_approved', null, ['source' => 'contravo_webhook']);
        }

        CurrentOrganization::set(null);
    }

    protected function handleDeliverableRejected(array $data): void
    {
        $task = $this->findTaskByDeliverable($data);
        abort_unless($task, 404, 'Tâche introuvable pour ce livrable.');

        CurrentOrganization::set($task->organization);

        $task->update([
            'contravo_deliverable_id' => $this->externalId($data, 'deliverable_id') ?? $task->contravo_deliverable_id,
        ]);

        // Idempotent : si une révision est déjà en cours pour ce livrable, on n'en recrée pas une.
        $alreadyRequested = Task::query()
            ->where('parent_id', $task->id)
            ->where('title', 'Révision demandée')
            ->where('status', '!=', Task::STATUS_DONE)
            ->exists();

        if (! $alreadyRequested) {
            $comment = $data['comment'] ?? null;

            $revision = Task::create([
                'organization_id' => $task->organization_id,
                'project_id' => $task->project_id,
                'parent_id' => $task->id,
                'assignee_id' => $task->assignee_id,
                'created_by' => $task->created_by,
                'title' => 'Révision demandée',
                'description' => trim("Le client a demandé une révision du livrable « {$task->title} »."
                    .($comment ? "\n\nCommentaire du client : {$comment}" : '')),
                'status' => Task::STATUS_TODO,
                'priority' => 'high',
            ]);

            $recipientId = $revision->assignee_id ?? $task->created_by;

            if ($recipientId) {
                $this->inbox->toUser(
                    $recipientId,
                    'deliverable.rejected',
                    'Révision demandée',
                    $task->title,
                    '/taches/'.$revision->id,
                    ['task_id' => $revision->id, 'original_task_id' => $task->id],
                );
            }
        }

        CurrentOrganization::set(null);
    }

    protected function handleConversationMessageReceived(array $data): void
    {
        $client = $this->findClientByConversation($data);
        abort_unless($client, 404, 'Client introuvable pour cette conversation.');

        CurrentOrganization::set($client->organization);

        $clientId = $this->externalId($data, 'client_id');
        if ($clientId && ! $client->contravo_client_id) {
            $client->update(['contravo_client_id' => $clientId]);
        }

        if ($client->owner_id) {
            $this->inbox->toUser(
                $client->owner_id,
                'conversation.message_received',
                'Nouveau message WhatsApp',
                $client->name,
                '/crm/'.$client->id,
                ['client_id' => $client->id],
            );
        }

        CurrentOrganization::set(null);
    }

    protected function handleReviewSubmitted(array $data): void
    {
        $project = $this->findProjectForReview($data);
        abort_unless($project, 404, 'Projet introuvable pour cet avis.');

        CurrentOrganization::set($project->organization);

        $reviewId = $this->externalId($data, 'review_id');

        $alreadyPosted = $reviewId !== null && Activity::query()
            ->where('subject_type', $project->getMorphClass())
            ->where('subject_id', $project->id)
            ->where('action', 'project.review_submitted')
            ->where('meta->review_id', $reviewId)
            ->exists();

        if (! $alreadyPosted) {
            $rating = $data['rating'] ?? null;
            $comment = $data['comment'] ?? null;

            $body = $rating
                ? "⭐ Nouvel avis {$rating}/5 pour « {$project->name} »"
                : "⭐ Nouvel avis client pour « {$project->name} »";

            if ($comment) {
                $body .= " : \"{$comment}\"";
            }

            Post::create([
                'author_id' => $project->owner_id,
                'body' => $body,
            ]);

            Activity::log($project, 'project.review_submitted', null, [
                'review_id' => $reviewId,
                'rating' => $rating,
                'source' => 'contravo_webhook',
            ]);
        }

        CurrentOrganization::set(null);
    }

    protected function notifyTeam(Project $project, string $type, string $title, ?string $body, string $link, array $payload): void
    {
        $memberIds = $project->members()->pluck('users.id')
            ->push($project->owner_id)
            ->unique()
            ->values()
            ->all();

        $this->inbox->toUsers($memberIds, $project->organization_id, $type, $title, $body, $link, $payload);
    }

    protected function findOpportunity(array $data): ?Opportunity
    {
        $quoteId = $this->externalId($data, 'quote_id');
        $reference = $data['reference'] ?? null;

        return Opportunity::query()
            ->where(function ($query) use ($quoteId, $reference) {
                if ($quoteId) {
                    $query->orWhere('contravo_quote_id', $quoteId);
                }
                if ($reference) {
                    $query->orWhere('id', $reference);
                }
            })
            ->first();
    }

    protected function findProjectByInvoice(array $data): ?Project
    {
        $invoiceId = $this->externalId($data, 'invoice_id');
        $reference = $data['reference'] ?? null;

        return Project::query()
            ->where(function ($query) use ($invoiceId, $reference) {
                if ($invoiceId) {
                    $query->orWhere('contravo_invoice_id', $invoiceId);
                }
                if ($reference) {
                    $query->orWhere('id', $reference);
                }
            })
            ->first();
    }

    protected function findProjectByContract(array $data): ?Project
    {
        $contractId = $this->externalId($data, 'contract_id');
        $reference = $data['reference'] ?? null;

        return Project::query()
            ->where(function ($query) use ($contractId, $reference) {
                if ($contractId) {
                    $query->orWhere('contravo_contract_id', $contractId);
                }
                if ($reference) {
                    $query->orWhere('id', $reference);
                }
            })
            ->first();
    }

    protected function findTaskByDeliverable(array $data): ?Task
    {
        $deliverableId = $this->externalId($data, 'deliverable_id');
        $reference = $data['reference'] ?? null;

        return Task::query()
            ->where(function ($query) use ($deliverableId, $reference) {
                if ($deliverableId) {
                    $query->orWhere('contravo_deliverable_id', $deliverableId);
                }
                if ($reference) {
                    $query->orWhere('id', $reference);
                }
            })
            ->first();
    }

    protected function findClientByConversation(array $data): ?Client
    {
        $clientId = $this->externalId($data, 'client_id');
        $reference = $data['reference'] ?? null;

        return Client::query()
            ->where(function ($query) use ($clientId, $reference) {
                if ($clientId) {
                    $query->orWhere('contravo_client_id', $clientId);
                }
                if ($reference) {
                    $query->orWhere('id', $reference);
                }
            })
            ->first();
    }

    protected function findProjectForReview(array $data): ?Project
    {
        $reference = $data['reference'] ?? null;

        return $reference ? Project::find($reference) : null;
    }

    protected function externalId(array $data, string $key): ?string
    {
        $value = $data[$key] ?? $data['id'] ?? null;

        return $value !== null ? (string) $value : null;
    }
}
