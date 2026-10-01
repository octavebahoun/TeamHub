<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    // Préférences de notification par défaut (fusionnées avec celles enregistrées).
    public const NOTIFICATION_DEFAULTS = [
        'task_assigned' => true,
        'due_reminder' => true,
        'chat_messages' => true,
        'weekly_digest' => false,
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'title',
        'phone',
        'notification_preferences',
        'current_organization_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'notification_preferences',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'array',
        ];
    }

    public function notificationSettings(): array
    {
        return array_merge(
            self::NOTIFICATION_DEFAULTS,
            array_intersect_key($this->notification_preferences ?? [], self::NOTIFICATION_DEFAULTS)
        );
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function currentOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function ownedOrganizations(): HasMany
    {
        return $this->hasMany(Organization::class, 'owner_id');
    }

    public function roleIn(Organization $organization): ?string
    {
        return $this->memberships()
            ->where('organization_id', $organization->id)
            ->value('role');
    }
}
