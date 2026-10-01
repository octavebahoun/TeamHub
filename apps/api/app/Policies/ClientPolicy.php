<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Membership;
use App\Models\User;
use App\Support\OrganizationRole;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function view(User $user, Client $client): bool
    {
        return $this->canAccess($user, $client);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function update(User $user, Client $client): bool
    {
        return $this->canAccess($user, $client);
    }

    public function delete(User $user, Client $client): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true);
    }

    protected function canAccess(User $user, Client $client): bool
    {
        $role = OrganizationRole::of($user);

        if (in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)) {
            return true;
        }

        return $role === Membership::ROLE_MANAGER && $client->owner_id === $user->id;
    }
}
