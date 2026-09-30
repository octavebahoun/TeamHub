<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Support\CurrentOrganization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentOrganization
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user, 401);

        $organizationId = $request->header('X-Organization-Id')
            ?? $user->current_organization_id;

        abort_unless($organizationId, 400, 'Aucune organisation sélectionnée.');

        $organization = Organization::whereKey($organizationId)
            ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id))
            ->first();

        abort_unless($organization, 403, 'Accès refusé à cette organisation.');

        CurrentOrganization::set($organization);

        return $next($request);
    }
}
