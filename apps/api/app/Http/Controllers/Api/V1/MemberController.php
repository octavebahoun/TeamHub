<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Lecture ouverte: owner/admin/manager/member. Invité: 403.
        abort_unless(OrganizationRole::canContribute($request->user()), 403);

        $members = Membership::with('user:id,name,email,avatar')
            ->where('organization_id', CurrentOrganization::id())
            ->get()
            ->map(fn ($m) => [
                'user_id' => $m->user_id,
                'name' => $m->user->name,
                'email' => $m->user->email,
                'avatar' => $m->user->avatar,
                'role' => $m->role,
            ]);

        return response()->json($members);
    }

    public function updateRole(Request $request, int $userId): JsonResponse
    {
        // Seuls owner/admin peuvent changer les rôles (jamais celui du propriétaire).
        abort_unless(
            in_array(OrganizationRole::of($request->user()), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true),
            403
        );

        $data = $request->validate([
            'role' => ['required', 'in:'.implode(',', [
                Membership::ROLE_ADMIN,
                Membership::ROLE_MANAGER,
                Membership::ROLE_MEMBER,
                Membership::ROLE_GUEST,
            ])],
        ]);

        $membership = Membership::where('organization_id', CurrentOrganization::id())
            ->where('user_id', $userId)
            ->firstOrFail();

        abort_if($membership->role === Membership::ROLE_OWNER, 403, 'Impossible de changer le rôle du propriétaire.');

        $membership->update(['role' => $data['role']]);

        return response()->json($membership);
    }

    public function destroy(Request $request, int $userId): JsonResponse
    {
        abort_unless(
            in_array(OrganizationRole::of($request->user()), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true),
            403
        );

        $membership = Membership::where('organization_id', CurrentOrganization::id())
            ->where('user_id', $userId)
            ->firstOrFail();

        abort_if($membership->role === Membership::ROLE_OWNER, 403, 'Impossible de retirer le propriétaire.');

        $membership->delete();

        // TODO: publier user:revoked sur Redis pour couper les sockets ouverts.

        return response()->json(['message' => 'Membre retiré.']);
    }
}
