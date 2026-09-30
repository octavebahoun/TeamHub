<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use App\Support\OrganizationRole;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function view(User $user, Task $task): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function create(User $user): bool
    {
        return OrganizationRole::canContribute($user);
    }

    public function update(User $user, Task $task): bool
    {
        return OrganizationRole::isManager($user)
            || $task->assignee_id === $user->id
            || $task->created_by === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        return OrganizationRole::isManager($user)
            || $task->created_by === $user->id;
    }
}
