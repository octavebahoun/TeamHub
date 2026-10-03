<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function analyticsOrg(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'AnalyticsCo',
        'slug' => 'analytics-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create([
        'user_id' => $owner->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_OWNER,
    ]);
    $owner->update(['current_organization_id' => $org->id]);

    $member = User::factory()->create();
    Membership::create([
        'user_id' => $member->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    return compact('owner', 'org', 'member');
}

it('proxies the weekly summary and follow-up suggestions to the data service', function () {
    extract(analyticsOrg());

    Http::fake([
        '*/summary*' => Http::response([
            'source' => 'fallback',
            'headline' => 'Semaine calme',
            'kpis' => ['overdue_tasks' => 0],
        ], 200),
        '*/relances*' => Http::response([
            'source' => 'fallback',
            'count' => 0,
            'suggestions' => [],
        ], 200),
        '*/stats/profitability*' => Http::response([
            'won_amount' => 1000,
            'win_rate' => 0.5,
        ], 200),
    ]);

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/summary')
        ->assertOk()
        ->assertJsonPath('headline', 'Semaine calme');

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/relances')
        ->assertOk()
        ->assertJsonPath('count', 0);

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/analytics/profitability')
        ->assertOk()
        ->assertJsonPath('won_amount', 1000);
});

it('forbids members from the new analytics endpoints', function () {
    extract(analyticsOrg());

    foreach (['analytics/summary', 'analytics/relances', 'analytics/profitability'] as $path) {
        $this->actingAs($member, 'sanctum')
            ->withHeader('X-Organization-Id', $org->id)
            ->getJson('/api/v1/'.$path)
            ->assertForbidden();
    }
});
