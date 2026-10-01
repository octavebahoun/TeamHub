<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Post;
use App\Models\User;
use App\Support\CurrentOrganization;

function memberOf(string $orgName, string $role): array
{
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => $orgName,
        'slug' => strtolower($orgName).'-'.uniqid(),
        'owner_id' => $user->id,
    ]);
    Membership::create([
        'user_id' => $user->id,
        'organization_id' => $org->id,
        'role' => $role,
    ]);
    $user->update(['current_organization_id' => $org->id]);

    return [$user, $org];
}

afterEach(fn () => CurrentOrganization::set(null));

it('lets a member publish a post', function () {
    [$user, $org] = memberOf('SocialA', Membership::ROLE_MEMBER);

    $this->actingAs($user, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/posts', ['body' => 'Bonjour équipe !'])
        ->assertCreated()
        ->assertJsonPath('body', 'Bonjour équipe !');
});

it('forbids a guest from publishing', function () {
    [$owner, $org] = memberOf('SocialB', Membership::ROLE_OWNER);
    $guest = User::factory()->create();
    Membership::create([
        'user_id' => $guest->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_GUEST,
    ]);

    $this->actingAs($guest, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/posts', ['body' => 'Nope'])
        ->assertForbidden();
});

it('only admins can pin a post', function () {
    [$owner, $org] = memberOf('SocialC', Membership::ROLE_OWNER);
    $member = User::factory()->create();
    Membership::create([
        'user_id' => $member->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);
    CurrentOrganization::set($org);
    $post = Post::create(['organization_id' => $org->id, 'author_id' => $member->id, 'body' => 'x']);
    CurrentOrganization::set(null);

    $this->actingAs($member, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/posts/{$post->id}/pin", ['pinned' => true])
        ->assertForbidden();

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/posts/{$post->id}/pin", ['pinned' => true])
        ->assertOk()
        ->assertJsonPath('pinned', true);
});

it('reacts to a post idempotently', function () {
    [$user, $org] = memberOf('SocialD', Membership::ROLE_MEMBER);
    CurrentOrganization::set($org);
    $post = Post::create(['organization_id' => $org->id, 'author_id' => $user->id, 'body' => 'x']);
    CurrentOrganization::set(null);

    $this->actingAs($user, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/posts/{$post->id}/reactions", ['emoji' => '👍'])
        ->assertCreated();

    $this->actingAs($user, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/posts/{$post->id}/reactions", ['emoji' => '👍'])
        ->assertCreated();

    expect($post->reactions()->count())->toBe(1);
});

it('does not expose posts from another organization', function () {
    [$alice, $orgA] = memberOf('AlphaSoc', Membership::ROLE_OWNER);
    [$bob, $orgB] = memberOf('BravoSoc', Membership::ROLE_OWNER);

    CurrentOrganization::set($orgA);
    Post::create(['organization_id' => $orgA->id, 'author_id' => $alice->id, 'body' => 'secret A']);
    CurrentOrganization::set(null);

    $response = $this->actingAs($bob, 'sanctum')
        ->withHeader('X-Organization-Id', $orgB->id)
        ->getJson('/api/v1/posts')
        ->assertOk();

    $bodies = collect($response->json('data'))->pluck('body')->all();
    expect($bodies)->not->toContain('secret A');
});

it('flags posts the current user reacted to', function () {
    [$alice, $org] = memberOf('SocialE', Membership::ROLE_OWNER);
    $bob = User::factory()->create();
    Membership::create(['user_id' => $bob->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);
    CurrentOrganization::set($org);
    $liked = Post::create(['organization_id' => $org->id, 'author_id' => $bob->id, 'body' => 'liked']);
    $other = Post::create(['organization_id' => $org->id, 'author_id' => $bob->id, 'body' => 'other']);
    CurrentOrganization::set(null);

    $this->actingAs($alice, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/posts/{$liked->id}/reactions", ['emoji' => 'bravo'])
        ->assertCreated();

    $rows = collect($this->actingAs($alice, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/posts')->assertOk()->json('data'))->keyBy('id');
    expect($rows[$liked->id]['reacted'])->toBeTrue()
        ->and($rows[$other->id]['reacted'])->toBeFalse();

    // Bob n'a pas réagi : reacted reste faux pour lui.
    $rows = collect($this->actingAs($bob, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/posts')->json('data'))->keyBy('id');
    expect($rows[$liked->id]['reacted'])->toBeFalse();

    $this->actingAs($alice, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/posts/{$liked->id}")
        ->assertJsonPath('reacted', true);
});
