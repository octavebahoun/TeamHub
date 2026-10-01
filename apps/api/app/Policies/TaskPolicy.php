<?php

namespace App\Policies;

use App\Models\Membership;
use App\Models\Task;
use App\Models\User;
use App\Support\OrganizationRole;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return OrganizationRole::of($user) !== null;
    }

    public function view(User $user, Task $task): bool
    {
        $role = OrganizationRole::of($user);

        return match ($role) {
            Membership::ROLE_OWNER, Membership::ROLE_ADMIN => true,
            Membership::ROLE_MANAGER => $task->project->owner_id === $user->id
                || $task->project->members()->whereKey($user->id)->exists(),
            Membership::ROLE_MEMBER, Membership::ROLE_GUEST => $task->project->members()->whereKey($user->id)->exists(),
            default => false,
        };
    }

    public function create(User $user): bool
    {
        // Doc: Membre peut gérer SES tâches, Chef projet gère dans ses projets.
        // Création = chef projet et au-dessus. Pas d'invité, pas de simple membre
        // (le membre ne crée pas de tâches, il fait les siennes assignées).
        return OrganizationRole::isManager($user);
    }

    public function update(User $user, Task $task): bool
    {
        $role = OrganizationRole::of($user);

        if (in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)) {
            return true;
        }

        if ($role === Membership::ROLE_MANAGER) {
            return $task->project->owner_id === $user->id
                || $task->project->members()->whereKey($user->id)->exists();
        }

        // Membre: ses tâches seulement (assignée OU créée par lui).
        if ($role === Membership::ROLE_MEMBER) {
            return $task->assignee_id === $user->id || $task->created_by === $user->id;
        }

        return false; // Invité: pas de modification
    }

    public function delete(User $user, Task $task): bool
    {
        return in_array(OrganizationRole::of($user), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true)
            || (OrganizationRole::of($user) === Membership::ROLE_MANAGER
                && ($task->project->owner_id === $user->id
                    || $task->project->members()->whereKey($user->id)->exists()));
    }

    public function comment(User $user, Task $task): bool
    {
        // Doc: Membre peut commenter toutes les tâches de ses projets.
        // Invité: pas de commentaire (lecture seule sur les tâches).
        $role = OrganizationRole::of($user);
        if ($role === Membership::ROLE_GUEST) {
            return false;
        }
        return $this->view($user, $task);
    }
}
