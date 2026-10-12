<?php

use App\Models\Membership;
use App\Models\Organization;

it('registers a user and creates their organization', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Alice',
        'email' => 'alice@test.com',
        'password' => 'password123',
        'organization_name' => 'ACME',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['token', 'user' => ['id', 'email'], 'organization' => ['id', 'slug']]);

    expect(Organization::where('slug', 'acme')->exists())->toBeTrue();
    expect(Membership::where('role', Membership::ROLE_OWNER)->count())->toBe(1);
});

it('logs in with valid credentials', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Bob',
        'email' => 'bob@test.com',
        'password' => 'password123',
        'organization_name' => 'BobCorp',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'bob@test.com',
        'password' => 'password123',
    ]);

    $response->assertOk()->assertJsonStructure(['token', 'user']);
});

it('rejects wrong credentials', function () {
    $this->postJson('/api/v1/auth/login', [
        'email' => 'nobody@test.com',
        'password' => 'wrong',
    ])->assertStatus(422);
});
