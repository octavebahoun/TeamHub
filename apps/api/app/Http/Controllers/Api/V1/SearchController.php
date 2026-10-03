<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Membership;
use App\Models\Project;
use App\Models\Task;
use App\Support\OrganizationRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/search?q= — projets, tâches, clients, scopé à l'organisation
 * courante et au rôle. Reprend exactement les règles déjà appliquées par
 * ProjectController/TaskController/ClientController::index : le membre et
 * l'invité ne voient que les projets dont ils sont membres (et aucun CRM),
 * le chef de projet (manager) ne voit que ses propres projets et clients.
 */
class SearchController extends Controller
{
    protected const LIMIT = 10;

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:120'],
        ]);

        $user = $request->user();
        $role = OrganizationRole::of($user);
        $term = '%'.$data['q'].'%';

        $projects = Project::query()
            ->whereNull('archived_at')
            ->where(fn (Builder $w) => $w->where('name', 'like', $term)->orWhere('description', 'like', $term))
            ->when($this->scopedToOwnProjects($role), fn (Builder $q) => $q->whereHas('members', fn ($m) => $m->whereKey($user->id)))
            ->when($role === Membership::ROLE_MANAGER, fn (Builder $q) => $q->where(
                fn (Builder $w) => $w->where('owner_id', $user->id)->orWhereHas('members', fn ($m) => $m->whereKey($user->id))
            ))
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'name', 'status']);

        $tasks = Task::query()
            ->where(fn (Builder $w) => $w->where('title', 'like', $term)->orWhere('description', 'like', $term))
            ->whereHas('project', function (Builder $q) use ($user, $role) {
                $q->when($this->scopedToOwnProjects($role), fn (Builder $qq) => $qq->whereHas('members', fn ($m) => $m->whereKey($user->id)))
                    ->when($role === Membership::ROLE_MANAGER, fn (Builder $qq) => $qq->where(
                        fn (Builder $w) => $w->where('owner_id', $user->id)->orWhereHas('members', fn ($m) => $m->whereKey($user->id))
                    ));
            })
            ->with('project:id,name')
            ->latest()
            ->limit(self::LIMIT)
            ->get(['id', 'title', 'status', 'project_id']);

        $clients = collect();
        if (OrganizationRole::isManager($user)) {
            $clients = Client::query()
                ->where(fn (Builder $w) => $w->where('name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term))
                ->when($role === Membership::ROLE_MANAGER, fn (Builder $q) => $q->where('owner_id', $user->id))
                ->latest()
                ->limit(self::LIMIT)
                ->get(['id', 'name', 'company']);
        }

        return response()->json([
            'query' => $data['q'],
            'projects' => $projects,
            'tasks' => $tasks,
            'clients' => $clients,
        ]);
    }

    // Membre et invité : seulement les projets dont ils sont membres. L'invité
    // n'a par ailleurs qu'un seul projet en pratique (règle produit), mais la
    // requête reste la même — c'est l'appartenance qui filtre, pas le rôle en soi.
    protected function scopedToOwnProjects(?string $role): bool
    {
        return in_array($role, [Membership::ROLE_MEMBER, Membership::ROLE_GUEST], true);
    }
}
