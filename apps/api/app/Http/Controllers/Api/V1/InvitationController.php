<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Membership;
use App\Models\User;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvitationController extends Controller
{
    // Rôles attribuables par invitation : jamais owner (un seul propriétaire par organisation).
    public const INVITABLE_ROLES = [
        Membership::ROLE_ADMIN,
        Membership::ROLE_MANAGER,
        Membership::ROLE_MEMBER,
        Membership::ROLE_GUEST,
    ];

    public function index(Request $request): JsonResponse
    {
        $this->guardAdmin($request);

        $invitations = Invitation::where('organization_id', CurrentOrganization::id())
            ->latest()
            ->get();

        return response()->json($invitations);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = CurrentOrganization::get();
        $user = $request->user();

        $role = $user->roleIn($organization);
        abort_unless(in_array($role, [Membership::ROLE_OWNER, Membership::ROLE_ADMIN]), 403);

        $data = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'in:'.implode(',', self::INVITABLE_ROLES)],
        ]);

        // Doc « Parcours par rôle » : nommer un Admin est réservé au Propriétaire.
        abort_if(
            $data['role'] === Membership::ROLE_ADMIN && $role !== Membership::ROLE_OWNER,
            403,
            'Seul le propriétaire peut inviter un administrateur.'
        );

        $alreadyMember = Membership::where('organization_id', $organization->id)
            ->whereHas('user', fn ($q) => $q->where('email', $data['email']))
            ->exists();

        if ($alreadyMember) {
            throw ValidationException::withMessages([
                'email' => ['Cette personne fait déjà partie de l\'organisation.'],
            ]);
        }

        $invitation = Invitation::create([
            'organization_id' => $organization->id,
            'email' => $data['email'],
            'role' => $data['role'],
            'invited_by' => $user->id,
        ]);

        return response()->json($invitation, 201);
    }

    public function destroy(Request $request, int $invitationId): JsonResponse
    {
        $this->guardAdmin($request);

        $this->findInCurrentOrganization($invitationId)->delete();

        return response()->json(['message' => 'Invitation annulée.']);
    }

    public function resend(Request $request, int $invitationId): JsonResponse
    {
        $this->guardAdmin($request);

        $invitation = $this->findInCurrentOrganization($invitationId);
        $invitation->update(['expires_at' => now()->addDays(7)]);

        // TODO: renvoyer l'e-mail d'invitation quand l'envoi sera branché (aucun mail en V1).

        return response()->json($invitation);
    }

    // Public (sans auth) : aperçu affiché sur la page d'invitation.
    public function show(string $token): JsonResponse
    {
        $invitation = $this->findValidByToken($token);
        $invitation->load('organization:id,name', 'invitedBy:id,name');

        return response()->json([
            'email' => $invitation->email,
            'role' => $invitation->role,
            'expires_at' => $invitation->expires_at,
            'organization' => $invitation->organization,
            'invited_by' => $invitation->invitedBy,
        ]);
    }

    // Public (sans auth) : crée le compte de l'invité et le rattache à l'organisation
    // qui l'invite — contrairement à auth/register, AUCUNE organisation n'est créée.
    public function register(Request $request, string $token): JsonResponse
    {
        $invitation = $this->findValidByToken($token);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if (User::where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['Un compte existe déjà pour cette adresse : connectez-vous pour accepter l\'invitation.'],
            ]);
        }

        $user = DB::transaction(function () use ($invitation, $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $invitation->email,
                'password' => $data['password'],
                'current_organization_id' => $invitation->organization_id,
            ]);

            Membership::create([
                'user_id' => $user->id,
                'organization_id' => $invitation->organization_id,
                'role' => $invitation->role,
            ]);

            $invitation->delete();

            return $user;
        });

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'organization' => $invitation->organization,
        ], 201);
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

    protected function guardAdmin(Request $request): void
    {
        abort_unless(
            in_array(OrganizationRole::of($request->user()), [Membership::ROLE_OWNER, Membership::ROLE_ADMIN], true),
            403
        );
    }

    // Invitation n'a pas le scope d'organisation global : filtre explicite.
    protected function findInCurrentOrganization(int $invitationId): Invitation
    {
        return Invitation::where('organization_id', CurrentOrganization::id())
            ->whereKey($invitationId)
            ->firstOrFail();
    }

    protected function findValidByToken(string $token): Invitation
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        abort_if($invitation->isExpired(), 410, 'Invitation expirée.');

        return $invitation;
    }
}
