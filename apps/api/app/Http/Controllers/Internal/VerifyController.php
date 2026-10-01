<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class VerifyController extends Controller
{
    // Secret interne vérifié par le middleware `internal` (EnsureInternalSecret).
    public function __invoke(Request $request): JsonResponse
    {
        $bearer = $request->input('token');
        abort_unless($bearer, 422, 'token is required');

        $accessToken = PersonalAccessToken::findToken($bearer);
        abort_unless($accessToken, 401, 'Invalid token.');

        $user = $accessToken->tokenable;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'organizations' => $user->memberships()
                ->with('organization:id,name,slug')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->organization_id,
                    'name' => $m->organization->name,
                    'role' => $m->role,
                ]),
            'current_organization_id' => $user->current_organization_id,
        ]);
    }
}
