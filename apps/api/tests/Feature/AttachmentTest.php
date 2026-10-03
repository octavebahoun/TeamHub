<?php

use App\Models\Attachment;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Support\CurrentOrganization;

function attachmentOrgWithRoles(): array
{
    $owner = User::factory()->create();
    $org = Organization::create([
        'name' => 'AttachCo',
        'slug' => 'attach-'.uniqid(),
        'owner_id' => $owner->id,
    ]);
    Membership::create(['user_id' => $owner->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_OWNER]);
    $owner->update(['current_organization_id' => $org->id]);

    $member = User::factory()->create();
    Membership::create(['user_id' => $member->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    $guest = User::factory()->create();
    Membership::create(['user_id' => $guest->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_GUEST]);

    CurrentOrganization::set($org);
    $project = Project::create(['organization_id' => $org->id, 'owner_id' => $owner->id, 'name' => 'Site vitrine']);
    $project->members()->attach([$owner->id, $member->id, $guest->id]);
    $task = Task::create(['organization_id' => $org->id, 'project_id' => $project->id, 'created_by' => $owner->id, 'title' => 'Rédiger la page accueil']);
    CurrentOrganization::set(null);

    return compact('owner', 'org', 'member', 'guest', 'project', 'task');
}

afterEach(fn () => CurrentOrganization::set(null));

it('lets a member attach a file to a project and shows it on the project', function () {
    extract(attachmentOrgWithRoles());

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_abc',
            'name' => 'Cahier des charges.pdf',
            'mime' => 'application/pdf',
            'size' => 2_300_000,
        ])
        ->assertCreated()
        ->assertJsonPath('kind', 'PDF')
        ->assertJsonPath('name', 'Cahier des charges.pdf')
        ->assertJsonPath('scan_status', 'pending');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/projects/{$project->id}")
        ->assertOk()
        ->assertJsonCount(1, 'attachments')
        ->assertJsonPath('attachments.0.name', 'Cahier des charges.pdf')
        ->assertJsonPath('attachments.0.size', '2,3 Mo');
});

it('forbids a guest from attaching a file to a project', function () {
    extract(attachmentOrgWithRoles());

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_guest',
            'name' => 'x.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])
        ->assertForbidden();
});

it('lets a member attach a file to a task but forbids a guest', function () {
    extract(attachmentOrgWithRoles());

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/tasks/{$task->id}/attachments", [
            'contravo_file_id' => 'file_task_1',
            'name' => 'maquette.png',
            'mime' => 'image/png',
            'size' => 500,
        ])
        ->assertCreated()
        ->assertJsonPath('kind', 'Image');

    $this->actingAs($guest, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/tasks/{$task->id}/attachments", [
            'contravo_file_id' => 'file_task_2',
            'name' => 'autre.png',
            'mime' => 'image/png',
            'size' => 500,
        ])
        ->assertForbidden();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/tasks/{$task->id}")
        ->assertOk()
        ->assertJsonCount(1, 'attachments');
});

it('rejects a duplicate contravo file id', function () {
    extract(attachmentOrgWithRoles());

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_dup',
            'name' => 'un.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])
        ->assertCreated();

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_dup',
            'name' => 'deux.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('contravo_file_id');
});

it('refuses the download while the antivirus scan is pending, allows it once clean', function () {
    extract(attachmentOrgWithRoles());

    $attachmentId = $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_scan',
            'name' => 'contrat.pdf',
            'mime' => 'application/pdf',
            'size' => 1000,
        ])->json('id');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/attachments/{$attachmentId}/download")
        ->assertStatus(422);

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->patchJson("/api/v1/attachments/{$attachmentId}", ['scan_status' => 'clean'])
        ->assertOk()
        ->assertJsonPath('scan_status', 'clean');

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->getJson("/api/v1/attachments/{$attachmentId}/download")
        ->assertOk()
        ->assertJsonPath('contravo_file_id', 'file_scan');
});

it('lets the uploader delete their own attachment but forbids another member', function () {
    extract(attachmentOrgWithRoles());

    $otherMember = User::factory()->create();
    Membership::create(['user_id' => $otherMember->id, 'organization_id' => $org->id, 'role' => Membership::ROLE_MEMBER]);

    $attachmentId = $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_delete',
            'name' => 'x.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])->json('id');

    $this->actingAs($otherMember, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/attachments/{$attachmentId}")
        ->assertForbidden();

    $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/attachments/{$attachmentId}")
        ->assertOk();

    expect(Attachment::withoutGlobalScopes()->whereKey($attachmentId)->exists())->toBeFalse();
});

it('lets an owner delete any attachment of the organization', function () {
    extract(attachmentOrgWithRoles());

    $attachmentId = $this->actingAs($member, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_owner_delete',
            'name' => 'x.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])->json('id');

    $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->deleteJson("/api/v1/attachments/{$attachmentId}")
        ->assertOk();
});

it('does not expose an attachment from another organization', function () {
    extract(attachmentOrgWithRoles());

    $otherOwner = User::factory()->create();
    $otherOrg = Organization::create(['name' => 'OtherAttach', 'slug' => 'other-attach-'.uniqid(), 'owner_id' => $otherOwner->id]);
    Membership::create(['user_id' => $otherOwner->id, 'organization_id' => $otherOrg->id, 'role' => Membership::ROLE_OWNER]);

    $attachmentId = $this->actingAs($owner, 'sanctum')->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/attachments", [
            'contravo_file_id' => 'file_cross_org',
            'name' => 'x.pdf',
            'mime' => 'application/pdf',
            'size' => 100,
        ])->json('id');

    $this->actingAs($otherOwner, 'sanctum')->withHeader('X-Organization-Id', $otherOrg->id)
        ->getJson("/api/v1/attachments/{$attachmentId}/download")
        ->assertNotFound();
});
