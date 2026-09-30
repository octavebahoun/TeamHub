<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;
use App\Support\OrganizationRole;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function view(User $user, Client $client): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function update(User $user, Client $client): bool
    {
        return OrganizationRole::isManager($user)
            || $client->owner_id === $user->id;
    }

    public function delete(User $user, Client $client): bool
    {
        return OrganizationRole::isManager($user);
    }
}
