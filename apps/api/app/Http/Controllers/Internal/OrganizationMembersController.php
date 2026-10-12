<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;

class OrganizationMembersController extends Controller
{
    // Annuaire minimal d'une organisation pour le service realtime : noms des
    // canaux directs, vérification du destinataire, membres du canal « general ».
    // Identifiant brut (pas de route model binding) : le secret est vérifié avant
    // toute requête en base.
    public function __invoke(int $organizationId): JsonResponse
    {
        $organization = Organization::findOrFail($organizationId);

        $members = Membership::with('user:id,name,avatar')
            ->where('organization_id', $organization->id)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->user_id,
                'name' => $m->user->name,
                'avatar' => $m->user->avatar,
                'role' => $m->role,
            ]);

        return response()->json(['members' => $members]);
    }
}
