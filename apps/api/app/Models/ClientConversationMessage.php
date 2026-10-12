<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientConversationMessage extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'conversation_id',
        'sender',
        'body',
        'user_id',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ClientConversation::class, 'conversation_id');
    }
}
