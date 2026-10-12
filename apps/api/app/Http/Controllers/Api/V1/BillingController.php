<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BillingContract;
use App\Models\BillingInvoice;
use App\Models\BillingQuote;
use App\Models\Project;
use App\Services\BillingLedger;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Devis, contrats et encaissements Mobile Money tenus dans WINE
 * quand aucune clé Contravo n'est configurée.
 */
class BillingController extends Controller
{
    public function __construct(protected BillingLedger $ledger) {}

    public function quotes(Request $request): JsonResponse
    {
        $project = $this->project($request);
        $this->guard($request, $project, false);

        return response()->json($this->ledger->listQuotes($project, $request->string('clientId')->toString() ?: null));
    }

    public function storeQuote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projectId' => ['required', 'string'],
            'clientId' => ['required', 'string'],
            'validUntil' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:500'],
            'items.*.quantity' => ['required'],
            'items.*.unitPriceCents' => ['required'],
            'discountCents' => ['nullable'],
            'taxRateBps' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $project = $this->ledger->project($data['projectId']);
        $this->guard($request, $project, true);

        $quote = $this->ledger->createQuote($project, $data, $request->user());

        return response()->json($quote->toApi(), 201);
    }

    public function showQuote(BillingQuote $quote): JsonResponse
    {
        $this->authorize('view', $quote->project);

        return response()->json($quote->toApi());
    }

    public function transitionQuote(Request $request, BillingQuote $quote): JsonResponse
    {
        $data = $request->validate([
            'action' => ['required', 'in:send,accept,reject,cancel'],
        ]);
        $this->guard($request, $quote->project, true);

        $quote = $this->ledger->transition($request->user(), $quote, $data['action']);

        return response()->json($quote->toApi());
    }

    public function invoices(Request $request): JsonResponse
    {
        $project = $this->project($request);
        $this->guard($request, $project, false);

        return response()->json($this->ledger->listInvoices($project, $request->string('clientId')->toString() ?: null));
    }

    public function payInvoice(Request $request, BillingInvoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'amountCents' => ['required'],
            'method' => ['required', 'in:bank_transfer,mobile_money,card,cash,check,other'],
            'channel' => ['nullable', 'in:mtn_momo,moov,celtiis,bank_transfer'],
            'reference' => ['nullable', 'string', 'max:191'],
        ]);
        $this->guard($request, $invoice->project, true);

        $payment = $this->ledger->recordPayment($request->user(), $invoice, $data);

        return response()->json($payment->toApi(), 201);
    }

    public function remindInvoice(Request $request, BillingInvoice $invoice): JsonResponse
    {
        $this->guard($request, $invoice->project, true);
        $this->ledger->remind($request->user(), $invoice);

        return response()->json(['ok' => true]);
    }

    public function followUps(Request $request): JsonResponse
    {
        abort_unless(OrganizationRole::isManager($request->user()), 403);
        $invoices = \App\Models\BillingInvoice::query()
            ->whereIn('status', ['sent', 'partial', 'overdue'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($invoice) => $invoice->toApi());
        $quotes = \App\Models\BillingQuote::query()
            ->whereIn('status', ['sent'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($quote) => $quote->toApi());

        return response()->json([
            'invoices' => $invoices,
            'quotes' => $quotes,
        ]);
    }

    public function contracts(Request $request): JsonResponse
    {
        $project = $this->project($request);
        $this->guard($request, $project, false);

        return response()->json($this->ledger->listContracts($project, $request->string('clientId')->toString() ?: null));
    }

    public function showContract(BillingContract $contract): JsonResponse
    {
        $this->authorize('view', $contract->project);

        return response()->json($contract->toApi());
    }

    public function storeContract(Request $request): JsonResponse
    {
        $data = $request->validate([
            'projectId' => ['required', 'string'],
            'clientId' => ['required', 'string'],
            'quoteId' => ['nullable', 'uuid'],
            'title' => ['required', 'string', 'max:191'],
            'bodyMarkdown' => ['nullable', 'string', 'max:20000'],
        ]);
        $project = $this->ledger->project($data['projectId']);
        $this->guard($request, $project, true);

        $contract = $this->ledger->createContract($request->user(), $project, $data);

        return response()->json($contract->toApi(), 201);
    }

    protected function project(Request $request): Project
    {
        $data = $request->validate(['projectId' => ['required', 'string']]);

        return $this->ledger->project($data['projectId']);
    }

    protected function guard(Request $request, ?Project $project, bool $write): void
    {
        abort_unless($project, 404, 'Projet introuvable.');
        $this->authorize('view', $project);
        if ($write) {
            $user = $request->user();
            abort_unless(
                $user->can('update', $project) || OrganizationRole::isManager($user),
                403,
                'Vous ne pouvez pas facturer ce projet.'
            );
        }
    }
}
