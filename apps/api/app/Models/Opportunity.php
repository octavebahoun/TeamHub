<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Opportunity extends Model
{
    use BelongsToOrganization, HasFactory;

    public const STAGE_PROSPECT = 'prospect';
    public const STAGE_CONTACTED = 'contacted';
    public const STAGE_PROPOSAL = 'proposal';
    public const STAGE_WON = 'won';
    public const STAGE_LOST = 'lost';

    public const STAGES = [
        self::STAGE_PROSPECT,
        self::STAGE_CONTACTED,
        self::STAGE_PROPOSAL,
        self::STAGE_WON,
        self::STAGE_LOST,
    ];

    protected $fillable = [
        'organization_id',
        'client_id',
        'owner_id',
        'project_id',
        'contravo_quote_id',
        'title',
        'amount',
        'stage',
        'next_follow_up',
        'notes',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'next_follow_up' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function isClosed(): bool
    {
        return in_array($this->stage, [self::STAGE_WON, self::STAGE_LOST], true);
    }
}
