<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;

it('exposes joined_at and last_active_at on members', function () {
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'MembersCo',
        'slug' => 'members-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $idle = User::factory()->create();
    Membership::create(['user_id' => $idle->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    // Deux jetons : on retient le plus récent.
    $owner->createToken('old')->accessToken->forceFill(['last_used_at' => now()->subDays(3)])->save();
    $owner->createToken('recent')->accessToken->forceFill(['last_used_at' => now()->subHour()])->save();

    $response = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/members')
        ->assertOk();

    $rows = collect($response->json())->keyBy('user_id');
    expect($rows[$owner->id]['joined_at'])->not->toBeNull()
        ->and($rows[$owner->id]['last_active_at'])->not->toBeNull()
        ->and(now()->diffInMinutes($rows[$owner->id]['last_active_at'], true))->toBeLessThan(120)
        ->and($rows[$idle->id]['last_active_at'])->toBeNull();
});
