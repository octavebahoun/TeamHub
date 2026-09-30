<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use App\Support\CurrentOrganization;

function orgWithUser(string $name, string $role = Membership::ROLE_OWNER): array
{
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => $name,
        'slug' => strtolower($name).'-'.uniqid(),
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

it('rejects assigning a task to a user from another organization', function () {
    [$alice, $orgA] = orgWithUser('OrgAlpha');
    [$mallory, $orgM] = orgWithUser('OrgMallory');

    CurrentOrganization::set($orgA);
    $project = Project::create([
        'organization_id' => $orgA->id,
        'owner_id' => $alice->id,
        'name' => 'ProjectAlpha',
    ]);
    CurrentOrganization::set(null);

    $this->actingAs($alice, 'sanctum')
        ->withHeader('X-Organization-Id', $orgA->id)
        ->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'Try to leak',
            'assignee_id' => $mallory->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['assignee_id']);
});

it('allows assigning a task to a member of the same organization', function () {
    [$owner, $org] = orgWithUser('OrgLegit');
    $peer = User::factory()->create();
    Membership::create([
        'user_id' => $peer->id,
        'organization_id' => $org->id,
        'role' => Membership::ROLE_MEMBER,
    ]);

    CurrentOrganization::set($org);
    $project = Project::create([
        'organization_id' => $org->id,
        'owner_id' => $owner->id,
        'name' => 'ProjectLegit',
    ]);
    CurrentOrganization::set(null);

    $this->actingAs($owner, 'sanctum')
        ->withHeader('X-Organization-Id', $org->id)
        ->postJson("/api/v1/projects/{$project->id}/tasks", [
            'title' => 'Legit task',
            'assignee_id' => $peer->id,
        ])
        ->assertCreated()
        ->assertJsonPath('assignee_id', $peer->id);
});
