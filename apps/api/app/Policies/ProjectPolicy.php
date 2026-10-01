<?php

namespace App\Policies;

use App\Models\Membership;
use App\Models\Project;
use App\Models\User;
use App\Support\OrganizationRole;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::of($user) !== null;
    }

    public function view(User $user, Project $project): bool
    {
        $role = OrganizationRole::of($user);

        return match ($role) {
            Membership::ROLE_OWNER, Membership::ROLE_ADMIN => true,
            Membership::ROLE_MANAGER => $project->owner_id === $user->id
                || $project->members()->whereKey($user->id)->exists(),
            Membership::ROLE_MEMBER, Membership::ROLE_GUEST => $project->members()->whereKey($user->id)->exists(),
            default => false,
        };
    }

    public function create(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function update(User $user, Project $project): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)
            || $project->owner_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)
            || $project->owner_id === $user->id;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)
            || $project->owner_id === $user->id;
    }
}
