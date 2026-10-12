<?php

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Artisan;

function demoUser(string $key): User
{
    return User::where('email', DemoSeeder::email($key))->firstOrFail();
}

it('seeds one demo organization with one account per role, and can be re-run', function () {
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class);

    $org = Organization::where('slug', DemoSeeder::ORG_SLUG)->sole();
    expect(User::where('email', 'like', '%@'.DemoSeeder::EMAIL_DOMAIN)->count())->toBe(count(DemoSeeder::PEOPLE))
        ->and(Membership::where('organization_id', $org->id)->pluck('role')->unique()->sort()->values()->all())
        ->toBe(['admin', 'guest', 'manager', 'member', 'owner']);
});

it('gives each demo persona the view described in the role journeys', function () {
    $this->seed(DemoSeeder::class);
    $org = Organization::where('slug', DemoSeeder::ORG_SLUG)->sole();
    $as = fn (string $key) => $this->actingAs(demoUser($key), 'sanctum')->withHeader('X-Organization-Id', $org->id);

    // Invité : uniquement le projet partagé, ni Social, ni CRM.
    $names = collect($as('paul')->getJson('/api/v1/projects')->assertOk()->json('data'))->pluck('name')->all();
    expect($names)->toBe(['Refonte du site Wari Market']);
    $as('paul')->getJson('/api/v1/posts')->assertForbidden();
    $as('paul')->getJson('/api/v1/clients')->assertForbidden();

    // Membre : ses tâches en retard, du jour et de la semaine sont présentes.
    $today = now()->toDateString();
    $open = collect($as('mariam')->getJson('/api/v1/me/tasks')->assertOk()->json())
        ->where('status', '!=', 'done')->whereNotNull('due_date')
        ->map(fn ($t) => substr($t['due_date'], 0, 10));
    expect($open->contains(fn ($d) => $d < $today))->toBeTrue()
        ->and($open->contains($today))->toBeTrue()
        ->and($open->contains(fn ($d) => $d > $today))->toBeTrue();

    // Chef de projet : ses contacts seulement ; une opportunité reste à faire gagner à l'écran.
    $clients = collect($as('fatou')->getJson('/api/v1/clients')->assertOk()->json('data'))->pluck('company');
    expect($clients->sort()->values()->all())->toBe(['Hôtel Les Palmiers', 'Sika Bio', 'Wari Market']);
    $stages = collect($as('fatou')->getJson('/api/v1/opportunities')->json('data'))->pluck('stage');
    expect($stages)->toContain('proposal');

    // Propriétaire : fil social avec une annonce épinglée.
    $posts = collect($as('adjoa')->getJson('/api/v1/posts')->assertOk()->json('data'));
    expect($posts->first()['pinned'])->toBeTrue();
});

it('purges the demo organization and its accounts', function () {
    $this->seed(DemoSeeder::class);

    $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

    expect(Organization::where('slug', DemoSeeder::ORG_SLUG)->exists())->toBeFalse()
        ->and(User::where('email', 'like', '%@'.DemoSeeder::EMAIL_DOMAIN)->exists())->toBeFalse();
});

it('exports a demo chat without the guest in the general channel', function () {
    $this->seed(DemoSeeder::class);

    Artisan::call('demo:chat');
    $spec = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);

    $general = collect($spec['channels'])->firstWhere('name', 'general');
    $wari = collect($spec['channels'])->firstWhere('name', 'Refonte du site Wari Market');
    expect($general['member_ids'])->not->toContain(demoUser('paul')->id)
        ->and($wari['member_ids'])->toContain(demoUser('paul')->id)
        ->and(collect($spec['channels'])->where('type', 'direct')->every(fn ($c) => count($c['member_ids']) === 2))->toBeTrue();
});
