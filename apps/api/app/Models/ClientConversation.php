<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientConversation extends Model
{
    use BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'client_id',
        'channel',
        'display_name',
        'identifier_label',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ClientConversationMessage::class, 'conversation_id');
    }
}
