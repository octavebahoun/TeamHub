<?php

namespace App\Policies;

use App\Models\Opportunity;
use App\Models\User;
use App\Support\OrganizationRole;

class OpportunityPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function view(User $user, Opportunity $opportunity): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function update(User $user, Opportunity $opportunity): bool
    {
        return OrganizationRole::isManager($user)
            || $opportunity->owner_id === $user->id;
    }

    public function delete(User $user, Opportunity $opportunity): bool
    {
        return OrganizationRole::isManager($user)
            || $opportunity->owner_id === $user->id;
    }
}
