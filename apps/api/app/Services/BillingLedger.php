<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\BillingContract;
use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\BillingQuote;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BillingLedger
{
    public function project(string $ref): Project
    {
        $id = $this->idFromRef($ref, 'wine-p-');
        abort_unless($id, 422, 'Projet de facturation invalide.');

        $project = Project::query()->find($id);
        abort_unless($project, 404, 'Projet introuvable.');

        return $project;
    }

    public function createQuote(Project $project, array $data, ?User $user = null): BillingQuote
    {
        $client = $this->clientFor($project, $data['clientId']);
        $totals = $this->totals($data);

        $quote = DB::transaction(function () use ($project, $client, $data, $totals) {
            return BillingQuote::query()->create([
                'project_id' => $project->id,
                'client_id' => $client->id,
                'number' => $this->nextNumber(BillingQuote::class, 'DEV'),
                'status' => 'draft',
                'currency' => 'XOF',
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax_rate_bps' => $totals['tax_rate_bps'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'valid_until' => $data['validUntil'],
                'notes' => $data['notes'] ?? null,
                'items' => $totals['items'],
            ]);
        });

        if ($user) {
            $this->note($project, $user, 'project.quote_created', 'a créé le devis « '.$quote->number.' ».');
        }

        return $quote;
    }

    public function transition(User $user, BillingQuote $quote, string $action): BillingQuote
    {
        return DB::transaction(function () use ($user, $quote, $action) {
            $quote = BillingQuote::query()->lockForUpdate()->findOrFail($quote->id);

            if ($action === 'send') {
                $quote->update(['status' => 'sent', 'sent_at' => $quote->sent_at ?? now()]);
                $this->ensureInvoice($user, $quote);
            } elseif ($action === 'accept') {
                $quote->update(['status' => 'accepted', 'accepted_at' => $quote->accepted_at ?? now()]);
                $this->ensureInvoice($user, $quote);
            } elseif ($action === 'reject') {
                $quote->update(['status' => 'rejected', 'rejected_at' => now()]);
            } elseif ($action === 'cancel') {
                $quote->update(['status' => 'cancelled']);
            } else {
                abort(422, 'Action de devis inconnue.');
            }

            return $quote->fresh();
        });
    }

    public function listQuotes(Project $project, ?string $clientRef): array
    {
        return BillingQuote::query()
            ->where('project_id', $project->id)
            ->when($clientRef, function ($query) use ($project, $clientRef) {
                $client = $this->clientFor($project, $clientRef);

                return $query->where('client_id', $client->id);
            })
            ->latest()
            ->get()
            ->map(fn (BillingQuote $quote) => $quote->toApi())
            ->values()
            ->all();
    }

    public function listInvoices(Project $project, ?string $clientRef): array
    {
        return BillingInvoice::query()
            ->where('project_id', $project->id)
            ->when($clientRef, function ($query) use ($project, $clientRef) {
                $client = $this->clientFor($project, $clientRef);

                return $query->where('client_id', $client->id);
            })
            ->latest()
            ->get()
            ->map(fn (BillingInvoice $invoice) => $invoice->toApi())
            ->values()
            ->all();
    }

    public function listContracts(Project $project, ?string $clientRef): array
    {
        return BillingContract::query()
            ->where('project_id', $project->id)
            ->when($clientRef, function ($query) use ($project, $clientRef) {
                $client = $this->clientFor($project, $clientRef);

                return $query->where('client_id', $client->id);
            })
            ->latest()
            ->get()
            ->map(fn (BillingContract $contract) => $contract->toApi())
            ->values()
            ->all();
    }

    public function createContract(User $user, Project $project, array $data): BillingContract
    {
        $client = $this->clientFor($project, $data['clientId']);
        $quote = null;
        if (! empty($data['quoteId'])) {
            $quote = BillingQuote::query()->where('project_id', $project->id)->find($data['quoteId']);
            abort_unless($quote, 422, 'Ce devis n\'appartient pas au projet.');
        }

        $contract = DB::transaction(function () use ($project, $client, $data, $quote) {
            return BillingContract::query()->create([
                'project_id' => $project->id,
                'client_id' => $client->id,
                'quote_id' => $quote?->id,
                'number' => $this->nextNumber(BillingContract::class, 'CTR'),
                'title' => $data['title'],
                'status' => 'draft',
                'body' => $data['bodyMarkdown'] ?? null,
            ]);
        });

        if (! $project->contravo_contract_id) {
            $project->update(['contravo_contract_id' => $contract->id]);
        }

        $this->note($project, $user, 'project.contract_created', 'a créé le contrat « '.$contract->title.' ».');

        return $contract;
    }

    public function recordPayment(User $user, BillingInvoice $invoice, array $data): BillingPayment
    {
        $amount = $this->money($data['amountCents'] ?? null);
        abort_unless($amount > 0, 422, 'Montant invalide.');
        abort_unless($amount <= $invoice->amountDue(), 422, 'Le montant dépasse le reste à payer.');

        $method = $data['method'] ?? 'mobile_money';
        abort_unless(in_array($method, ['bank_transfer', 'mobile_money', 'card', 'cash', 'check', 'other'], true), 422, 'Mode de paiement invalide.');
        $channel = $data['channel'] ?? null;
        abort_unless(
            $channel === null || in_array($channel, ['mtn_momo', 'moov', 'celtiis', 'bank_transfer'], true),
            422,
            'Canal de paiement invalide.'
        );

        return DB::transaction(function () use ($user, $invoice, $amount, $method, $channel, $data) {
            $invoice = BillingInvoice::query()->lockForUpdate()->findOrFail($invoice->id);
            abort_unless($amount <= $invoice->amountDue(), 422, 'Le montant dépasse le reste à payer.');

            $payment = BillingPayment::query()->create([
                'invoice_id' => $invoice->id,
                'amount' => $amount,
                'method' => $method,
                'channel' => $channel,
                'reference' => $data['reference'] ?? null,
                'paid_at' => now(),
            ]);

            $paid = (int) $invoice->payments()->sum('amount');
            $settled = $paid >= (int) $invoice->total;
            $invoice->update([
                'amount_paid' => $paid,
                'status' => $settled ? 'paid' : 'partial',
                'paid_at' => $settled ? now() : null,
            ]);

            $project = $invoice->project;
            $client = Client::query()->find($invoice->client_id);
            $label = $this->fcfa($amount);
            $channelLabel = match ($payment->channel) {
                'mtn_momo' => 'MTN MoMo',
                'moov' => 'Moov Money',
                'celtiis' => 'Celtiis Cash',
                'bank_transfer' => 'virement',
                default => $method === 'mobile_money' ? 'Mobile Money' : $method,
            };
            $reference = filled($payment->reference) ? ' ('.$payment->reference.')' : '';
            $sentence = 'a encaissé '.$label.' FCFA via '.$channelLabel.$reference.'.';

            if ($project) {
                if (! $project->contravo_invoice_id) {
                    $project->contravo_invoice_id = $invoice->id;
                }
                if ($settled && $project->status === Project::STATUS_ON_HOLD) {
                    $project->status = Project::STATUS_IN_PROGRESS;
                    $this->note($project, $user, 'project.unlocked_by_payment', 'a débloqué le projet après le paiement '.$channelLabel.'.');
                }
                $project->save();
                $this->note($project, $user, 'project.payment_received', $sentence);
            }

            if ($client) {
                $this->note($client, $user, 'client.payment', $sentence);
            }

            return $payment;
        });
    }

    public function remind(User $user, BillingInvoice $invoice): void
    {
        $project = $invoice->project;
        if ($project) {
            $this->note($project, $user, 'invoice.reminded', 'a préparé une relance pour la facture « '.$invoice->number.' ».');
        }
        $client = Client::query()->find($invoice->client_id);
        if ($client) {
            $this->note($client, $user, 'client.reminder', 'Relance pour la facture '.$invoice->number.'.');
            $conversation = \App\Models\ClientConversation::query()->where('client_id', $client->id)->latest()->first();
            if ($conversation) {
                $conversation->messages()->create([
                    'sender' => 'freelance',
                    'body' => 'Relance pour la facture '.$invoice->number.'.',
                    'user_id' => $user->id,
                ]);
            }
        }
    }

    protected function ensureInvoice(User $user, BillingQuote $quote): BillingInvoice
    {
        $invoice = BillingInvoice::query()->where('quote_id', $quote->id)->first();
        if ($invoice) {
            return $invoice;
        }

        $invoice = BillingInvoice::query()->create([
            'project_id' => $quote->project_id,
            'client_id' => $quote->client_id,
            'quote_id' => $quote->id,
            'number' => $this->nextNumber(BillingInvoice::class, 'FAC'),
            'status' => 'sent',
            'currency' => $quote->currency,
            'subtotal' => $quote->subtotal,
            'discount' => $quote->discount,
            'tax_rate_bps' => $quote->tax_rate_bps,
            'tax' => $quote->tax,
            'total' => $quote->total,
            'amount_paid' => 0,
            'issue_date' => now()->toDateString(),
            'due_date' => $quote->valid_until?->toDateString() ?? now()->addDays(14)->toDateString(),
            'notes' => $quote->notes,
            'items' => $quote->items,
        ]);

        $project = Project::query()->find($quote->project_id);
        if ($project) {
            if (! $project->contravo_invoice_id) {
                $project->contravo_invoice_id = $invoice->id;
            }
            if ($project->status === Project::STATUS_UPCOMING) {
                $project->status = Project::STATUS_ON_HOLD;
            }
            $project->save();
        }

        if ($project) {
            $this->note($project, $user, 'invoice.issued', 'a émis la facture « '.$invoice->number.' » à encaisser.');
        }

        return $invoice;
    }

    protected function clientFor(Project $project, string $ref): Client
    {
        abort_unless($project->client_id, 422, 'Choisissez un client pour ce projet.');
        $id = $this->idFromRef($ref, 'wine-c-');
        abort_unless($id && $id === (int) $project->client_id, 422, 'Ce client n\'est pas celui du projet.');

        $client = Client::query()->find($id);
        abort_unless($client, 404, 'Client introuvable.');

        return $client;
    }

    protected function idFromRef(string $ref, string $prefix): ?int
    {
        if (! str_starts_with($ref, $prefix)) {
            return null;
        }
        $id = substr($ref, strlen($prefix));

        return ctype_digit($id) ? (int) $id : null;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{subtotal: int, discount: int, tax_rate_bps: int, tax: int, total: int, items: array<int, array<string, mixed>>}
     */
    protected function totals(array $data): array
    {
        $items = [];
        $subtotal = 0;
        foreach ($data['items'] as $index => $line) {
            $qty = (float) str_replace(',', '.', (string) ($line['quantity'] ?? '1'));
            $unit = $this->money($line['unitPriceCents'] ?? null);
            abort_unless($qty > 0, 422, 'Quantité invalide.');
            $lineTotal = (int) round($qty * $unit);
            $subtotal += $lineTotal;
            $items[] = [
                'id' => (string) ($index + 1),
                'description' => trim((string) $line['description']),
                'quantity' => (string) $line['quantity'],
                'unitPriceCents' => (string) $unit,
                'totalCents' => (string) $lineTotal,
            ];
        }

        $discount = min($subtotal, $this->money($data['discountCents'] ?? 0));
        $taxRate = (int) ($data['taxRateBps'] ?? 0);
        $after = $subtotal - $discount;
        $tax = (int) round($after * $taxRate / 10000);

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax_rate_bps' => $taxRate,
            'tax' => $tax,
            'total' => $after + $tax,
            'items' => $items,
        ];
    }

    protected function money(mixed $value): int
    {
        if (is_string($value)) {
            $value = str_replace([' ', "\u{00a0}", "\u{202f}"], '', $value);
        }
        if (! is_numeric($value)) {
            abort(422, 'Montant invalide.');
        }
        $amount = (int) round((float) $value);
        abort_if($amount < 0, 422, 'Montant invalide.');

        return $amount;
    }

    protected function nextNumber(string $model, string $prefix): string
    {
        $organizationId = \App\Support\CurrentOrganization::id();
        abort_unless($organizationId, 409, 'Organisation introuvable.');

        $year = now()->year;
        $head = sprintf('%s-%d-', $prefix, $year);
        $last = $model::query()
            ->where($model::make()->getTable().'.organization_id', $organizationId)
            ->where('number', 'like', $head.'%')
            ->lockForUpdate()
            ->orderByDesc('number')
            ->value('number');

        $seq = 1;
        if (is_string($last) && preg_match('/(\d+)$/', $last, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return $head.sprintf('%04d', $seq);
    }

    protected function fcfa(int $amount): string
    {
        return number_format($amount, 0, ',', ' ');
    }

    protected function note(Project|Client $subject, User $user, string $action, string $body): void
    {
        $activity = Activity::log($subject, $action, $user->id);
        $activity->update(['body' => $body]);
    }
}
