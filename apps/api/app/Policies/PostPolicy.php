<?php

namespace App\Policies;

use App\Models\Membership;
use App\Models\Post;
use App\Models\User;
use App\Support\OrganizationRole;

class PostPolicy
{
    // Doc « Parcours par rôle » : le fil Social n'existe pas pour l'invité.
    public function viewAny(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function view(User $user, Post $post): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function update(User $user, Post $post): bool
    {
        return $post->author_id === $user->id
            || OrganizationRole::isManager($user);
    }

    public function delete(User $user, Post $post): bool
    {
        return $post->author_id === $user->id
            || in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true);
    }

    public function pin(User $user, Post $post): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true);
    }
}
