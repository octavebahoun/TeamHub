<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;
use App\Support\OrganizationRole;

class AttachmentPolicy
{
    // Voir/télécharger une pièce jointe : déléguée au projet ou à la tâche porteuse
    // (voir AttachmentController::authorizeAttachable). Ici, seule la suppression
    // a une règle propre à l'attachement lui-même.
    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->uploaded_by === $user->id || OrganizationRole::isManager($user);
    }
}
