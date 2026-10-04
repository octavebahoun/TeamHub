<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    use BelongsToOrganization, HasFactory;

    // Échanges CRM saisis à la main (POST /clients/{id}/activities).
    public const KINDS = ['note', 'call', 'email', 'meeting'];

    protected $fillable = [
        'organization_id',
        'user_id',
        'subject_type',
        'subject_id',
        'action',
        'kind',
        'body',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(Model $subject, string $action, ?int $userId = null, array $meta = []): self
    {
        return static::create([
            'user_id' => $userId,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'action' => $action,
            'meta' => $meta,
        ]);
    }

    /** Phrase affichée après le prénom (« Amina a créé la tâche … »). */
    public function sentence(): string
    {
        if (filled($this->body)) {
            return $this->body;
        }

        $title = $this->meta['title'] ?? $this->meta['name'] ?? null;
        $quoted = is_string($title) && $title !== '' ? ' « '.$title.' »' : '';

        return match ($this->action) {
            'project.created' => 'a créé le projet'.$quoted,
            'project.updated' => 'a mis à jour le projet'.$quoted,
            'project.status_changed' => 'a passé le projet'.$quoted.' en '.$this->statusLabel($this->meta['to'] ?? null, self::PROJECT_STATUS),
            'project.archived' => 'a archivé le projet'.$quoted,
            'project.created_from_opportunity' => 'a créé le projet depuis une opportunité',
            'project.unlocked_by_payment' => 'a débloqué le projet après un paiement',
            'project.review_submitted' => 'a enregistré un avis client',
            'task.created' => 'a créé la tâche'.$quoted,
            'task.status_changed' => 'a passé la tâche'.$quoted.' en '.$this->statusLabel($this->meta['to'] ?? null, self::TASK_STATUS),
            'task.deleted' => 'a supprimé la tâche'.$quoted,
            'task.commented' => 'a commenté la tâche'.$quoted,
            'task.deliverable_approved' => 'a validé un livrable'.$quoted,
            default => 'a enregistré une activité',
        };
    }

    /** @param  array<string, string>  $labels */
    protected function statusLabel(mixed $status, array $labels): string
    {
        $key = is_string($status) ? $status : '';

        return $labels[$key] ?? ($key !== '' ? $key : 'un autre état');
    }

    private const PROJECT_STATUS = [
        'upcoming' => '« à venir »',
        'in_progress' => '« en cours »',
        'on_hold' => '« en pause »',
        'done' => '« terminé »',
    ];

    private const TASK_STATUS = [
        'todo' => '« à faire »',
        'in_progress' => '« en cours »',
        'review' => '« en revue »',
        'done' => '« terminée »',
    ];
}
