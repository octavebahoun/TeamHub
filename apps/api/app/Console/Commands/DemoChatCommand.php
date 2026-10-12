<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;

/**
 * Écrit sur la sortie standard (JSON) le chat de démonstration de « Studio Lagune »,
 * à transmettre au service realtime qui l'insère dans MongoDB :
 *
 *   php artisan demo:chat | node scripts/seed-demo-chat.mjs
 */
class DemoChatCommand extends Command
{
    protected $signature = 'demo:chat';

    protected $description = 'Chat de démonstration (JSON) pour l\'organisation créée par DemoSeeder';

    /** @var array<string, int> */
    protected array $ids = [];

    public function handle(): int
    {
        $org = Organization::where('slug', DemoSeeder::ORG_SLUG)->first();
        if (! $org) {
            fwrite(STDERR, "Organisation de démo absente : lancer d'abord php artisan db:seed --class=DemoSeeder\n");

            return self::FAILURE;
        }

        foreach (array_keys(DemoSeeder::PEOPLE) as $key) {
            $this->ids[$key] = (int) User::where('email', DemoSeeder::email($key))->value('id');
        }
        $nonGuests = collect(DemoSeeder::PEOPLE)->reject(fn ($p) => $p[1] === 'guest')->keys()->all();

        $channels = [
            $this->channel('project', 'general', null, $nonGuests, [
                ['adjoa', 'Bonjour à tous 👋 Le point d\'équipe de vendredi est décalé à 11h.', 3 * 1440],
                ['rodrigue', 'Noté, je mets à jour l\'invitation dans les agendas.', 3 * 1440 - 6],
                ['mariam', 'La nouvelle page d\'accueil Wari Market est sur l\'environnement de test 🚀', 1440],
                ['kevin', 'Bravo Mariam ! Ibrahim, on fait le point sur les transferts Kpayo à 15h ?', 120],
                ['ibrahim', 'Ça marche pour 15h.', 95, ['kevin']],
            ]),
            $this->projectChannel($org, 'Refonte du site Wari Market', [
                ['paul', 'Bonjour l\'équipe, pouvez-vous ajouter le paiement par Moov Money en plus de MTN ?', 2 * 1440],
                ['fatou', 'Bonjour Paul, oui c\'est prévu dans la tâche « Paiement Mobile Money ». Livraison visée la semaine prochaine.', 2 * 1440 - 20],
                ['serge', 'Les maquettes du tunnel de paiement sont en revue, Paul tu peux y jeter un œil ?', 1440],
                ['paul', 'Je regarde ce soir, merci Serge.', 300],
                ['mariam', 'Le header et la navigation de la page d\'accueil sont terminés ✅', 40, ['fatou', 'paul']],
            ]),
            $this->projectChannel($org, 'Application mobile Kpayo', [
                ['kevin', 'Point bloquant : les tests sur Android d\'entrée de gamme sont en retard, on peut les prioriser ?', 1440],
                ['ibrahim', 'Je m\'y mets demain matin, j\'ai récupéré deux téléphones de test.', 1430],
                ['mariam', 'L\'API de solde en temps réel est en revue, l\'endpoint est prêt.', 180],
                ['kevin', 'Top ! Ibrahim, tu peux brancher l\'écran portefeuille dessus ?', 25, ['ibrahim']],
            ]),
            $this->projectChannel($org, 'Campagne de lancement Sika Bio', [
                ['fatou', 'Serge, le brief créatif avec Sika Bio est calé dans 5 jours. Prépare quelques pistes de visuels 🌿', 2 * 1440],
                ['serge', 'Avec plaisir, je pars sur des tons verts et des photos produit en extérieur.', 2 * 1440 - 30],
            ]),
            $this->direct(['fatou', 'mariam'], [
                ['fatou', 'Mariam, tu as besoin d\'aide sur l\'intégration de la page d\'accueil ?', 240],
                ['mariam', 'Ça va, il me reste la section produits vedettes. Je termine demain.', 230],
                ['fatou', 'Parfait. Pense à l\'optimisation des images, elle est en retard 😉', 10, ['mariam']],
            ]),
            $this->direct(['adjoa', 'fatou'], [
                ['adjoa', 'Fatou, où en est la proposition pour l\'Hôtel Les Palmiers ?', 1440],
                ['fatou', 'Envoyée la semaine dernière, relance prévue aujourd\'hui. Je te tiens au courant.', 1380],
            ]),
        ];

        $this->line(json_encode(['organization_id' => $org->id, 'channels' => $channels], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        return self::SUCCESS;
    }

    /** @param list<array{0: string, 1: string, 2: int, 3?: list<string>}> $messages [auteur, texte, minutes écoulées, non lu par] */
    protected function channel(string $type, ?string $name, ?int $projectId, array $memberKeys, array $messages): array
    {
        $memberIds = collect($memberKeys)->map(fn ($k) => $this->ids[$k])->sort()->values()->all();

        return [
            'type' => $type,
            'name' => $name,
            'project_id' => $projectId,
            'member_ids' => $memberIds,
            'direct_key' => $type === 'direct' ? implode(':', $memberIds) : null,
            'messages' => array_map(fn ($m) => [
                'sender_id' => $this->ids[$m[0]],
                'body' => $m[1],
                'minutes_ago' => $m[2],
                'unread_for' => array_map(fn ($k) => $this->ids[$k], $m[3] ?? []),
            ], $messages),
        ];
    }

    protected function projectChannel(Organization $org, string $projectName, array $messages): array
    {
        $project = Project::withoutGlobalScopes()
            ->where('organization_id', $org->id)
            ->where('name', $projectName)
            ->with('members:id,email')
            ->firstOrFail();
        $keys = $project->members->map(fn ($m) => strstr($m->email, '@', true))->all();

        return $this->channel('project', $project->name, $project->id, $keys, $messages);
    }

    protected function direct(array $memberKeys, array $messages): array
    {
        return $this->channel('direct', null, null, $memberKeys, $messages);
    }
}
