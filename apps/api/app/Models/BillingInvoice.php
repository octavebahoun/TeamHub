<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasStringUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillingInvoice extends Model
{
    use BelongsToOrganization, HasStringUuid;

    protected $fillable = [
        'organization_id',
        'project_id',
        'client_id',
        'quote_id',
        'number',
        'status',
        'currency',
        'subtotal',
        'discount',
        'tax_rate_bps',
        'tax',
        'total',
        'amount_paid',
        'issue_date',
        'due_date',
        'paid_at',
        'notes',
        'items',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'tax_rate_bps' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BillingPayment::class, 'invoice_id');
    }

    public function amountDue(): int
    {
        return max(0, (int) $this->total - (int) $this->amount_paid);
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'organizationId' => (string) $this->organization_id,
            'projectId' => 'wine-p-'.$this->project_id,
            'clientId' => 'wine-c-'.$this->client_id,
            'contractId' => null,
            'number' => $this->number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotalCents' => (string) $this->subtotal,
            'discountCents' => (string) $this->discount,
            'taxRateBps' => (int) $this->tax_rate_bps,
            'taxCents' => (string) $this->tax,
            'totalCents' => (string) $this->total,
            'amountPaidCents' => (string) $this->amount_paid,
            'amountDueCents' => (string) $this->amountDue(),
            'issueDate' => $this->issue_date?->toDateString(),
            'dueDate' => $this->due_date?->toDateString(),
            'paidAt' => $this->paid_at?->toIso8601String(),
            'pdfFileId' => null,
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'items' => $this->items ?? [],
        ];
    }
}
