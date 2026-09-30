<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('organizations', 'currentOrganization');

        return response()->json([
            'user' => $user,
            'organizations' => $user->organizations,
            'current_organization' => $user->currentOrganization,
        ]);
    }
}
