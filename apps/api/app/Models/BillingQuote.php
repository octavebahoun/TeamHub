<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasStringUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingQuote extends Model
{
    use BelongsToOrganization, HasStringUuid;

    protected $fillable = [
        'organization_id',
        'project_id',
        'client_id',
        'number',
        'status',
        'currency',
        'subtotal',
        'discount',
        'tax_rate_bps',
        'tax',
        'total',
        'valid_until',
        'notes',
        'items',
        'sent_at',
        'accepted_at',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'valid_until' => 'date',
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
            'tax_rate_bps' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'organizationId' => (string) $this->organization_id,
            'projectId' => 'wine-p-'.$this->project_id,
            'clientId' => 'wine-c-'.$this->client_id,
            'number' => $this->number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotalCents' => (string) $this->subtotal,
            'discountCents' => (string) $this->discount,
            'taxRateBps' => (int) $this->tax_rate_bps,
            'taxCents' => (string) $this->tax,
            'totalCents' => (string) $this->total,
            'validUntil' => $this->valid_until?->toDateString(),
            'notes' => $this->notes,
            'terms' => null,
            'pdfFileId' => null,
            'sentAt' => $this->sent_at?->toIso8601String(),
            'viewedAt' => null,
            'acceptedAt' => $this->accepted_at?->toIso8601String(),
            'acceptedByName' => null,
            'acceptedByEmail' => null,
            'rejectedAt' => $this->rejected_at?->toIso8601String(),
            'rejectionReason' => null,
            'pricingMode' => null,
            'desiredNetCents' => null,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'items' => $this->items ?? [],
        ];
    }
}
