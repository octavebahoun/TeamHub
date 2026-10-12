<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;

function internalOrg(): array
{
    $owner = User::factory()->create(['name' => 'Alice']);
    $org = Organization::create([
        'name' => 'InternalOrg',
        'slug' => 'internal-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);

    return [$owner, $org];
}

beforeEach(fn () => config(['services.internal.secret' => 'test-secret']));

it('rejects internal calls without the shared secret', function () {
    [, $org] = internalOrg();

    $this->getJson("/api/internal/organizations/{$org->id}/members")->assertUnauthorized();
    $this->getJson("/api/internal/organizations/{$org->id}/members", ['X-Internal-Secret' => 'nope'])
        ->assertUnauthorized();
    $this->postJson('/api/internal/verify', ['token' => 'x'], ['X-Internal-Secret' => 'nope'])
        ->assertUnauthorized();
});

it('lists organization members for the realtime service', function () {
    [$owner, $org] = internalOrg();
    $bob = User::factory()->create(['name' => 'Bob']);
    Membership::create(['user_id' => $bob->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);
    [, $otherOrg] = internalOrg();

    $response = $this->getJson("/api/internal/organizations/{$org->id}/members", ['X-Internal-Secret' => 'test-secret'])
        ->assertOk()
        ->assertJsonCount(2, 'members');

    expect(collect($response->json('members'))->pluck('name')->all())->toContain('Alice', 'Bob');
    expect(collect($response->json('members'))->pluck('id')->all())->not->toContain($otherOrg->owner_id);
});

it('verifies a sanctum token with the shared secret', function () {
    [$owner, $org] = internalOrg();
    $token = $owner->createToken('api')->plainTextToken;

    $this->postJson('/api/internal/verify', ['token' => $token], ['X-Internal-Secret' => 'test-secret'])
        ->assertOk()
        ->assertJsonPath('user.id', $owner->id)
        ->assertJsonPath('organizations.0.id', $org->id);
});
