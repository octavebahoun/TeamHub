<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AnalyticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->guard($request);
        $query = ['org' => CurrentOrganization::id()];
        if ($userScope = $this->userScope($request)) {
            $query['owner_id'] = $userScope;
        }
        return $this->fetch('/stats/overview', $query);
    }

    public function pipeline(Request $request): JsonResponse
    {
        $this->guard($request);
        $query = ['org' => CurrentOrganization::id()];
        if ($userScope = $this->userScope($request)) {
            $query['owner_id'] = $userScope;
        }
        return $this->fetch('/stats/pipeline', $query);
    }

    public function activity(Request $request): JsonResponse
    {
        $this->guard($request);
        return $this->fetch('/stats/activity', [
            'org' => CurrentOrganization::id(),
            'days' => (int) $request->integer('days', 30),
        ]);
    }

    protected function guard(Request $request): void
    {
        abort_unless(OrganizationRole::isManager($request->user()), 403,
            'Analytics réservé aux rôles Owner, Admin et Chef de projet.');
    }

    protected function userScope(Request $request): ?int
    {
        return \App\Support\OrganizationRole::of($request->user()) === \App\Models\Membership::ROLE_MANAGER
            ? $request->user()->id
            : null;
    }

    protected function fetch(string $path, array $query): JsonResponse
    {
        $response = Http::withHeaders([
            'X-Internal-Secret' => config('services.data.internal_secret', env('INTERNAL_SECRET', '')),
            'Accept' => 'application/json',
        ])
            ->timeout(5)
            ->baseUrl(config('services.data.base_url', env('DATA_SERVICE_URL', 'http://127.0.0.1:8001')))
            ->get($path, $query);

        if ($response->failed()) {
            abort(502, 'Le service data est indisponible.');
        }

        return response()->json($response->json());
    }
}
