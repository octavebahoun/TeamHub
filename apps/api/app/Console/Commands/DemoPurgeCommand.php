<?php

namespace App\Console\Commands;

use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DemoPurgeCommand extends Command
{
    protected $signature = 'demo:purge {--force : Ne pas demander de confirmation}';

    protected $description = 'Supprime l\'organisation de démonstration « Studio Lagune » et ses comptes';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('Supprimer l\'organisation de démo et ses '.count(DemoSeeder::PEOPLE).' comptes ?')) {
            return self::SUCCESS;
        }

        $orgId = DB::transaction(fn () => DemoSeeder::purge());

        $this->info($orgId ? "Organisation de démo supprimée (id {$orgId})." : 'Aucune organisation de démo à supprimer.');

        return self::SUCCESS;
    }
}
