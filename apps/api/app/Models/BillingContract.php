<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use App\Models\Concerns\HasStringUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingContract extends Model
{
    use BelongsToOrganization, HasStringUuid;

    protected $fillable = [
        'organization_id',
        'project_id',
        'client_id',
        'quote_id',
        'number',
        'title',
        'status',
        'body',
        'sent_at',
        'signed_at',
        'signature_token',
        'signer_name',
        'signer_email',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'organizationId' => (string) $this->organization_id,
            'projectId' => 'wine-p-'.$this->project_id,
            'clientId' => 'wine-c-'.$this->client_id,
            'quoteId' => $this->quote_id,
            'number' => $this->number,
            'title' => $this->title,
            'status' => $this->status,
            'bodyMarkdown' => $this->body,
            'pdfFileId' => null,
            'signedPdfFileId' => null,
            'sentAt' => $this->sent_at?->toIso8601String(),
            'signedAt' => $this->signed_at?->toIso8601String(),
            'signedByName' => $this->signer_name,
            'signedByEmail' => $this->signer_email,
            'signatureHash' => $this->signature_token,
            'expiresAt' => null,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
