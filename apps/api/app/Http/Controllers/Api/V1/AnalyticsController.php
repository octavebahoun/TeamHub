<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\CurrentOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AnalyticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        return $this->fetch('/stats/overview', ['org' => CurrentOrganization::id()]);
    }

    public function pipeline(Request $request): JsonResponse
    {
        return $this->fetch('/stats/pipeline', ['org' => CurrentOrganization::id()]);
    }

    public function activity(Request $request): JsonResponse
    {
        return $this->fetch('/stats/activity', [
            'org' => CurrentOrganization::id(),
            'days' => (int) $request->integer('days', 30),
        ]);
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
