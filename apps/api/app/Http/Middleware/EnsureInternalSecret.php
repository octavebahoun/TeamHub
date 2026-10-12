<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Routes /api/internal/* : appelées uniquement par les services (realtime, data),
// jamais exposées par Caddy. Le secret partagé est la seule authentification.
class EnsureInternalSecret
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = $request->header('X-Internal-Secret');
        abort_unless(
            $secret && hash_equals((string) config('services.internal.secret', ''), $secret),
            401,
            'Bad internal secret.'
        );

        return $next($request);
    }
}
