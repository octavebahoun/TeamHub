<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Membership;
use App\Services\LocalAnalytics;
use App\Support\CurrentOrganization;
use App\Support\OrganizationRole;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class AnalyticsController extends Controller
{
    public function __construct(protected LocalAnalytics $local) {}

    public function overview(Request $request): JsonResponse
    {
        $this->guard($request);
        $owner = $this->userScope($request);
        $data = $this->pull('/stats/overview', $this->query($request), fn () => $this->local->overview($owner));
        $data['finance'] = $this->local->finance($owner);

        return response()->json($data);
    }

    public function pipeline(Request $request): JsonResponse
    {
        $this->guard($request);
        $owner = $this->userScope($request);

        return response()->json($this->pull('/stats/pipeline', $this->query($request), fn () => $this->local->pipeline($owner)));
    }

    public function activity(Request $request): JsonResponse
    {
        $this->guard($request);

        return response()->json($this->pull('/stats/activity', [
            'org' => CurrentOrganization::id(),
            'days' => (int) $request->integer('days', 30),
        ], fn () => []));
    }

    public function profitability(Request $request): JsonResponse
    {
        $this->guard($request);
        $owner = $this->userScope($request);

        return response()->json($this->pull(
            '/stats/profitability',
            $this->query($request),
            fn () => $this->local->profitability($owner)
        ));
    }

    public function summary(Request $request): JsonResponse
    {
        $this->guard($request);
        $owner = $this->userScope($request);

        return response()->json($this->pull('/summary', $this->query($request), fn () => $this->local->summary($owner), 8));
    }

    public function relances(Request $request): JsonResponse
    {
        $this->guard($request);

        return response()->json($this->pull('/relances', [
            'org' => CurrentOrganization::id(),
            'limit' => max(1, min((int) $request->integer('limit', 8), 20)),
        ] + ($this->userScope($request) ? ['owner_id' => $this->userScope($request)] : []), fn () => [
            'as_of' => now()->toIso8601String(),
            'source' => 'fallback',
            'count' => 0,
            'suggestions' => [],
        ], 8));
    }

    protected function guard(Request $request): void
    {
        abort_unless(OrganizationRole::isManager($request->user()), 403,
            'Analytics réservé aux rôles Owner, Admin et Chef de projet.');
    }

    protected function userScope(Request $request): ?int
    {
        return OrganizationRole::of($request->user()) === Membership::ROLE_MANAGER
            ? $request->user()->id
            : null;
    }

    /** @return array<string, mixed> */
    protected function query(Request $request): array
    {
        $query = ['org' => CurrentOrganization::id()];
        if ($owner = $this->userScope($request)) {
            $query['owner_id'] = $owner;
        }

        return $query;
    }

    /**
     * @param  callable(): array<string, mixed>  $fallback
     * @return array<string, mixed>
     */
    protected function pull(string $path, array $query, callable $fallback, int $timeout = 2): array
    {
        try {
            $response = Http::withHeaders([
                'X-Internal-Secret' => (string) config('services.data.internal_secret'),
                'Accept' => 'application/json',
            ])
                ->timeout($timeout)
                ->baseUrl((string) config('services.data.base_url'))
                ->get($path, $query);

            if ($response->successful() && is_array($response->json())) {
                return $response->json();
            }
        } catch (ConnectionException|Throwable) {
            // Le service data est optionnel : les écrans restent lisibles.
        }

        return $fallback();
    }
}
