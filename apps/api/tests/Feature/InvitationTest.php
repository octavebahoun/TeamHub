<?php

use App\Models\Invitation;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use App\Notifications\InvitationNotification;
use App\Support\CurrentOrganization;
use Illuminate\Support\Facades\Notification;

function invitationOrg(): array
{
    $owner = User::factory()->create(['name' => 'Olivia']);
    $org = Organization::create([
        'name' => 'InviteCo',
        'slug' => 'invite-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    return [$owner, $org, $member];
}

afterEach(fn () => CurrentOrganization::set(null));

it('rejects inviting someone as owner', function () {
    Notification::fake();
    [$owner, $org] = invitationOrg();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'new@test.com', 'role' => Membership::ROLE_OWNER])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['role']);

    Notification::assertNothingSent();
});

it('records who sent the invitation and rejects existing members', function () {
    Notification::fake();
    [$owner, $org, $member] = invitationOrg();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'new@test.com', 'role' => Membership::ROLE_MEMBER])
        ->assertCreated()
        ->assertJsonPath('invited_by', $owner->id);

    Notification::assertSentOnDemandTimes(InvitationNotification::class, 1);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => $member->email, 'role' => Membership::ROLE_MEMBER])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    Notification::assertSentOnDemandTimes(InvitationNotification::class, 1);
});

it('lists pending invitations of the current organization for owner/admin only', function () {
    [$owner, $org, $member] = invitationOrg();
    [$otherOwner, $otherOrg] = invitationOrg();
    Invitation::create(['organization_id' => $org->id, 'email' => 'a@test.com', 'role' => 'member']);
    Invitation::create(['organization_id' => $otherOrg->id, 'email' => 'leak@test.com', 'role' => 'member']);

    $response = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/invitations')
        ->assertOk()
        ->assertJsonCount(1);
    expect($response->json('0.email'))->toBe('a@test.com');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson('/api/v1/invitations')
        ->assertForbidden();
});

it('cancels and resends an invitation, never across organizations', function () {
    Notification::fake();
    [$owner, $org] = invitationOrg();
    [, $otherOrg] = invitationOrg();
    $invitation = Invitation::create([
        'organization_id' => $org->id,
        'email' => 'a@test.com',
        'role' => 'member',
        'expires_at' => now()->addDay(),
    ]);
    $foreign = Invitation::create(['organization_id' => $otherOrg->id, 'email' => 'b@test.com', 'role' => 'member']);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/invitations/{$invitation->id}/resend")
        ->assertOk();
    expect($invitation->fresh()->expires_at->greaterThan(now()->addDays(6)))->toBeTrue();
    Notification::assertSentOnDemandTimes(InvitationNotification::class, 1);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/invitations/{$foreign->id}")
        ->assertNotFound();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/invitations/{$invitation->id}")
        ->assertOk();
    expect(Invitation::find($invitation->id))->toBeNull();
    expect(Invitation::find($foreign->id))->not->toBeNull();
});

it('emails a frontend invitation link on create and again on resend', function () {
    Notification::fake();
    config(['app.frontend_url' => 'https://wine.test']);
    [$owner, $org] = invitationOrg();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson('/api/v1/invitations', ['email' => 'guest@test.com', 'role' => Membership::ROLE_GUEST])
        ->assertCreated();

    $invitation = Invitation::where('email', 'guest@test.com')->firstOrFail();

    $assertMail = function (Invitation $invitation, string $expiresOn) use ($owner) {
        Notification::assertSentOnDemand(
            InvitationNotification::class,
            function (InvitationNotification $notification, array $channels, object $notifiable) use ($invitation, $owner, $expiresOn) {
                if ($notification->invitation->isNot($invitation)) {
                    return false;
                }

                $mail = $notification->toMail($notifiable);

                return $notifiable->routes['mail'] === 'guest@test.com'
                    && $channels === ['mail']
                    && $notification->acceptUrl() === 'https://wine.test/invitation/'.$invitation->token
                    && $mail->subject === 'Invitation à rejoindre InviteCo sur WINE'
                    && $mail->actionText === 'Rejoindre InviteCo'
                    && collect($mail->introLines)->contains(
                        "{$owner->name} vous invite à rejoindre InviteCo sur WINE, en tant qu'invité."
                    )
                    && collect($mail->outroLines)->contains(
                        "Ce lien expire le {$expiresOn}. S'il ne vous est pas destiné, ignorez cet e-mail."
                    );
            }
        );
    };

    $assertMail($invitation, $invitation->expires_at->locale('fr')->isoFormat('D MMMM YYYY'));

    $this->travel(3)->days();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/invitations/{$invitation->id}/resend")
        ->assertOk();

    $invitation->refresh();
    $assertMail($invitation, $invitation->expires_at->locale('fr')->isoFormat('D MMMM YYYY'));
    Notification::assertSentOnDemandTimes(InvitationNotification::class, 2);
});

it('previews an invitation publicly, 404 if unknown, 410 if expired', function () {
    [$owner, $org] = invitationOrg();
    $invitation = Invitation::create([
        'organization_id' => $org->id,
        'email' => 'guest@test.com',
        'role' => 'guest',
        'invited_by' => $owner->id,
    ]);

    $this->getJson("/api/v1/invitations/{$invitation->token}")
        ->assertOk()
        ->assertJsonPath('email', 'guest@test.com')
        ->assertJsonPath('role', 'guest')
        ->assertJsonPath('organization.id', $org->id)
        ->assertJsonPath('organization.name', 'InviteCo')
        ->assertJsonPath('invited_by.id', $owner->id)
        ->assertJsonPath('invited_by.name', 'Olivia')
        ->assertJsonMissingPath('token');

    $this->getJson('/api/v1/invitations/unknown-token')->assertNotFound();

    $invitation->update(['expires_at' => now()->subDay()]);
    $this->getJson("/api/v1/invitations/{$invitation->token}")->assertStatus(410);
});

it('registers from an invitation without creating a new organization', function () {
    [, $org] = invitationOrg();
    $invitation = Invitation::create(['organization_id' => $org->id, 'email' => 'newbie@test.com', 'role' => 'manager']);
    $organizationsBefore = Organization::count();

    $this->postJson("/api/v1/invitations/{$invitation->token}/register", [
        'name' => 'Newbie',
        'password' => 'password123',
    ])
        ->assertCreated()
        ->assertJsonStructure(['token', 'user' => ['id', 'email'], 'organization' => ['id', 'name']])
        ->assertJsonPath('user.email', 'newbie@test.com')
        ->assertJsonPath('organization.id', $org->id);

    $user = User::where('email', 'newbie@test.com')->firstOrFail();
    expect(Organization::count())->toBe($organizationsBefore);
    expect($user->current_organization_id)->toBe($org->id);
    expect(Membership::where('user_id', $user->id)->where('organization_id', $org->id)->value('role'))->toBe('manager');
    expect(Invitation::find($invitation->id))->toBeNull();
});

it('refuses registration from an expired invitation or an existing email', function () {
    [, $org, $member] = invitationOrg();
    $expired = Invitation::create([
        'organization_id' => $org->id,
        'email' => 'late@test.com',
        'role' => 'member',
        'expires_at' => now()->subDay(),
    ]);
    $existing = Invitation::create(['organization_id' => $org->id, 'email' => $member->email, 'role' => 'member']);

    $this->postJson("/api/v1/invitations/{$expired->token}/register", ['name' => 'Late', 'password' => 'password123'])
        ->assertStatus(410);

    $this->postJson("/api/v1/invitations/{$existing->token}/register", ['name' => 'Dup', 'password' => 'password123'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});
