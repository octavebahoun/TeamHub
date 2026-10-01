<?php

namespace App\Policies;

use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\User;
use App\Support\OrganizationRole;

class OpportunityPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function view(User $user, Opportunity $opportunity): bool
    {
        return $this->canAccess($user, $opportunity);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function update(User $user, Opportunity $opportunity): bool
    {
        return $this->canAccess($user, $opportunity);
    }

    public function delete(User $user, Opportunity $opportunity): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)
            || ($this->canAccess($user, $opportunity) && $opportunity->owner_id === $user->id);
    }

    protected function canAccess(User $user, Opportunity $opportunity): bool
    {
        $role = OrganizationRole::of($user);

        if (in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)) {
            return true;
        }

        return $role === Membership::ROLE_MANAGER && $opportunity->owner_id === $user->id;
    }
}
