<?php

namespace App\Support;

use App\Models\Membership;
use App\Models\User;

class OrganizationRole
{
    public const MANAGEMENT_ROLES = [
        Membership::ROLE_OWNER,
        Membership::ROLE_ADMIN,
        Membership::ROLE_MANAGER,
    ];

    public const CONTRIBUTOR_ROLES = [
        Membership::ROLE_OWNER,
        Membership::ROLE_ADMIN,
        Membership::ROLE_MANAGER,
        Membership::ROLE_MEMBER,
    ];

    public static function of(?User $user): ?string
    {
        $org = CurrentOrganization::get();
        if (! $user || ! $org) {
            return null;
        }

        return $user->memberships()->where('organization_id', $org->id)->value('role');
    }

    public static function isManager(?User $user): bool
    {
        return in_array(self::of($user), self::MANAGEMENT_ROLES, true);
    }

    public static function canContribute(?User $user): bool
    {
        return in_array(self::of($user), self::CONTRIBUTOR_ROLES, true);
    }
}
