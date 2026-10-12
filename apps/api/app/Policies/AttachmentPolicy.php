<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;

class AttachmentPolicy
{
    public function view(User $user, Attachment $attachment): bool
    {
        $orgId = CurrentOrganization::id() ?? $user->current_organization_id;

        return OrganizationRole::of($user) !== null
            && $orgId
            && (int) $attachment->organization_id === (int) $orgId;
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->uploaded_by === $user->id || OrganizationRole::isManager($user);
    }
}
