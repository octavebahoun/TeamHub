<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasStringUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingPayment extends Model
{
    use BelongsToOrganization, HasStringUuid;

    protected $fillable = [
        'organization_id',
        'invoice_id',
        'amount',
        'method',
        'channel',
        'reference',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(BillingInvoice::class, 'invoice_id');
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'invoiceId' => $this->invoice_id,
            'amountCents' => (string) $this->amount,
            'method' => $this->method,
            'channel' => $this->channel,
            'reference' => $this->reference,
            'paidAt' => $this->paid_at?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
