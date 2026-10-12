<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function switch(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            $user->memberships()->where('organization_id', $organization->id)->exists(),
            403,
            'Vous n\'êtes pas membre de cette organisation.'
        );

        $user->update(['current_organization_id' => $organization->id]);

        return response()->json([
            'current_organization' => $organization,
        ]);
    }
}
