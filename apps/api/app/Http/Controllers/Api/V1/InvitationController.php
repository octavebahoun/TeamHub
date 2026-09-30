<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Membership;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $organization = CurrentOrganization::get();
        $user = $request->user();

        $role = $user->roleIn($organization);
        abort_unless(in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN]), 403);

        $data = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'in:'.implode(',', Membership::ROLES)],
        ]);

        $invitation = Invitation::create([
            'organization_id' => $organization->id,
            'email' => $data['email'],
            'role' => $data['role'],
        ]);

        return response()->json($invitation, 201);
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        abort_if($invitation->isExpired(), 410, 'Invitation expirée.');

        $user = $request->user();
        abort_unless(
            strcasecmp($user->email, $invitation->email) === 0,
            403,
            'Cette invitation ne correspond pas à votre email.'
        );

        DB::transaction(function () use ($invitation, $user) {
            Membership::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'organization_id' => $invitation->organization_id,
                ],
                ['role' => $invitation->role]
            );

            if (! $user->current_organization_id) {
                $user->update(['current_organization_id' => $invitation->organization_id]);
            }

            $invitation->delete();
        });

        return response()->json([
            'organization' => $invitation->organization,
        ]);
    }
}
