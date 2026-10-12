<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Métadonnée d'un fichier dont le stockage réel vit chez Contravo (pont
 * uploads/presign → complete, scan antivirus inclus). WINE ne garde que la
 * référence (`contravo_file_id`) et l'état du scan, jamais les octets.
 */
class Attachment extends Model
{
    use BelongsToOrganization, HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_CLEAN = 'clean';
    public const STATUS_READY = 'ready';
    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CLEAN,
        self::STATUS_READY,
        self::STATUS_REJECTED,
    ];

    // Seuls ces statuts autorisent le téléchargement (règle de la roadmap Contravo).
    public const DOWNLOADABLE_STATUSES = [self::STATUS_CLEAN, self::STATUS_READY];

    protected $fillable = [
        'organization_id',
        'uploaded_by',
        'attachable_type',
        'attachable_id',
        'contravo_file_id',
        'name',
        'mime',
        'size',
        'scan_status',
    ];

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function isDownloadable(): bool
    {
        return in_array($this->scan_status, self::DOWNLOADABLE_STATUSES, true);
    }

    // Étiquette courte affichée dans la liste de fichiers (pas de dépendance à une lib de mime-types).
    public function kindLabel(): string
    {
        return match (true) {
            str_contains($this->mime, 'pdf') => 'PDF',
            str_starts_with($this->mime, 'image/') => 'Image',
            str_contains($this->mime, 'spreadsheet') || str_contains($this->mime, 'excel') => 'Feuille',
            str_contains($this->mime, 'word') || str_contains($this->mime, 'document') => 'Doc',
            str_starts_with($this->mime, 'video/') => 'Vidéo',
            default => strtoupper(pathinfo($this->name, PATHINFO_EXTENSION)) ?: 'Fichier',
        };
    }

    public function humanSize(): string
    {
        $bytes = (float) $this->size;

        if ($bytes >= 1_000_000) {
            return number_format($bytes / 1_000_000, 1, ',', ' ').' Mo';
        }
        if ($bytes >= 1_000) {
            return number_format($bytes / 1_000, 1, ',', ' ').' Ko';
        }

        return $bytes.' o';
    }

    public function toSummary(): array
    {
        return [
            'id' => $this->id,
            'kind' => $this->kindLabel(),
            'name' => $this->name,
            'size' => $this->humanSize(),
            'scan_status' => $this->scan_status,
        ];
    }
}
