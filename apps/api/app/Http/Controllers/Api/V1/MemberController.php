<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Project;
use App\Models\User;
use App\Services\RealtimePublisher;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    public function __construct(protected RealtimePublisher $realtime) {}

    public function index(Request $request): JsonResponse
    {
        // Lecture ouverte: owner/admin/manager/member. Invité: 403.
        abort_unless(OrganizationRole::canContribute($request->user()), 403);

        $memberships = Membership::with('user:id,name,email,avatar,title')
            ->where('organization_id', CurrentOrganization::id())
            ->get();

        // Dernière activité = dernier usage d'un jeton Sanctum (une seule requête groupée).
        $lastActive = DB::table('personal_access_tokens')
            ->where('tokenable_type', (new User)->getMorphClass())
            ->whereIn('tokenable_id', $memberships->pluck('user_id'))
            ->whereNotNull('last_used_at')
            ->groupBy('tokenable_id')
            ->selectRaw('tokenable_id, MAX(last_used_at) AS last_used_at')
            ->pluck('last_used_at', 'tokenable_id');

        $members = $memberships->map(fn ($m) => [
            'user_id' => $m->user_id,
            'name' => $m->user->name,
            'email' => $m->user->email,
            'avatar' => $m->user->avatar,
            'role' => $m->role,
            'title' => $m->user->title,
            'joined_at' => $m->created_at?->toJSON(),
            'last_active_at' => isset($lastActive[$m->user_id])
                ? Carbon::parse($lastActive[$m->user_id])->toJSON()
                : null,
        ]);

        return response()->json($members);
    }

    public function updateRole(Request $request, int $userId): JsonResponse
    {
        $actorRole = $this->guardManageMembers($request);

        $data = $request->validate([
            'role' => ['required', 'in:'.implode(',', [
                Membership::ROLE_ADMIN,
                Membership::ROLE_MANAGER,
                Membership::ROLE_MEMBER,
                Membership::ROLE_GUEST,
            ])],
        ]);

        $membership = $this->findMembership($userId);

        abort_if($membership->role === Membership::ROLE_OWNER, 403, 'Impossible de changer le rôle du propriétaire.');
        // Doc « Parcours par rôle » : nommer ou retirer un Admin est réservé au Propriétaire.
        abort_if(
            $actorRole !== Membership::ROLE_OWNER
                && ($membership->role === Membership::ROLE_ADMIN || $data['role'] === Membership::ROLE_ADMIN),
            403,
            'Seul le propriétaire peut nommer ou retirer un administrateur.'
        );

        $membership->update(['role' => $data['role']]);

        return response()->json($membership);
    }

    public function destroy(Request $request, int $userId): JsonResponse
    {
        $actorRole = $this->guardManageMembers($request);

        $membership = $this->findMembership($userId);

        abort_if($membership->role === Membership::ROLE_OWNER, 403, 'Impossible de retirer le propriétaire.');
        abort_if(
            $actorRole !== Membership::ROLE_OWNER && $membership->role === Membership::ROLE_ADMIN,
            403,
            'Seul le propriétaire peut retirer un administrateur.'
        );

        $organizationId = CurrentOrganization::id();

        // Cahier des charges §8 : accès coupé immédiatement. On retire aussi la
        // personne des projets de l'organisation (et donc de leurs canaux de chat).
        $projects = Project::whereHas('members', fn ($q) => $q->whereKey($userId))->get();

        DB::transaction(function () use ($membership, $projects, $userId) {
            foreach ($projects as $project) {
                $project->members()->detach($userId);
            }
            $membership->delete();
        });

        foreach ($projects as $project) {
            $this->realtime->projectEvent('project.members_changed', $organizationId, $project->id, [
                'name' => $project->name,
                'member_ids' => $project->members()->pluck('users.id')->all(),
            ]);
        }
        $this->realtime->revokeUser($userId, $organizationId);

        return response()->json(['message' => 'Membre retiré.']);
    }

    protected function guardManageMembers(Request $request): ?string
    {
        $role = OrganizationRole::of($request->user());
        abort_unless(in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true), 403);

        return $role;
    }

    protected function findMembership(int $userId): Membership
    {
        return Membership::where('organization_id', CurrentOrganization::id())
            ->where('user_id', $userId)
            ->firstOrFail();
    }
}
