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
        return OrganizationRole::of($user) !== null;
    }

    public function create(User $user): bool
    {
        return OrganizationRole::isManager($user);
    }

    public function update(User $user, Project $project): bool
    {
        return OrganizationRole::isManager($user)
            || $project->owner_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return OrganizationRole::of($user) === Membership::ROLE_OWNER
            || OrganizationRole::of($user) === Membership::ROLE_ADMIN
            || $project->owner_id === $user->id;
    }
}
