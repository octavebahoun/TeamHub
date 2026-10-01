<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Client;
use App\Models\Invitation;
use App\Models\Membership;
use App\Models\Opportunity;
use App\Models\Organization;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostReaction;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Support\CurrentOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Organisation de démonstration « Studio Lagune » pour filmer le parcours complet.
 *
 *   php artisan db:seed --class=DemoSeeder --force
 *
 * Réexécutable : supprime puis recrée l'organisation et ses comptes. Toutes les
 * dates sont relatives au jour du seed. Mot de passe commun : DEMO_PASSWORD,
 * sinon généré et affiché. Le chat (MongoDB) se remplit ensuite avec
 * `php artisan demo:chat` (voir docs/DEMO.md).
 */
class DemoSeeder extends Seeder
{
    public const ORG_SLUG = 'demo-studio-lagune';
    public const EMAIL_DOMAIN = 'studiolagune.test';

    // clé => [nom, rôle, fonction, téléphone]
    public const PEOPLE = [
        'adjoa' => ['Adjoa Mensah', Membership::ROLE_OWNER, 'Directrice générale', '+229 01 97 00 00 01'],
        'rodrigue' => ['Rodrigue Houngbo', Membership::ROLE_ADMIN, 'Responsable des opérations', '+229 01 97 00 00 02'],
        'fatou' => ['Fatou Diallo', Membership::ROLE_MANAGER, 'Cheffe de projet', '+229 01 97 00 00 03'],
        'kevin' => ['Kévin Agossou', Membership::ROLE_MANAGER, 'Chef de projet', '+229 01 97 00 00 04'],
        'mariam' => ['Mariam Traoré', Membership::ROLE_MEMBER, 'Développeuse web', '+229 01 97 00 00 05'],
        'serge' => ['Serge Dossou', Membership::ROLE_MEMBER, 'Designer UI/UX', '+229 01 97 00 00 06'],
        'ibrahim' => ['Ibrahim Sow', Membership::ROLE_MEMBER, 'Développeur mobile', '+229 01 97 00 00 07'],
        'paul' => ['Paul Ahouansou', Membership::ROLE_GUEST, 'Directeur, Wari Market (client)', '+229 01 97 00 00 08'],
    ];

    /** @var array<string, User> */
    protected array $u = [];

    protected Organization $org;

    protected Carbon $now;

    public static function email(string $key): string
    {
        return $key.'@'.self::EMAIL_DOMAIN;
    }

    public function run(): void
    {
        $this->now = now();
        // getenv : env() renvoie null hors fichiers de config quand la config est en cache (prod).
        $password = getenv('DEMO_PASSWORD') ?: Str::password(14, symbols: false);

        DB::transaction(function () use ($password) {
            $this->reset();
            $this->people($password);
            CurrentOrganization::set($this->org);

            [$wari, $kpayo, $sika, $ewe] = $this->crm();
            $projects = $this->projects($wari, $kpayo, $sika, $ewe);
            $this->tasks($projects);
            $this->social();
            $guestInvitation = $this->invitations();

            CurrentOrganization::set(null);
            $this->report($password, $guestInvitation);
        });
    }

    // ------------------------------------------------------------------ setup

    protected function reset(): void
    {
        self::purge();
    }

    /** Supprime l'organisation de démo (cascade) et ses comptes. Renvoie l'id supprimé, s'il existait. */
    public static function purge(): ?int
    {
        $orgId = Organization::where('slug', self::ORG_SLUG)->value('id');
        Organization::where('slug', self::ORG_SLUG)->get()->each->delete();
        User::where('email', 'like', '%@'.self::EMAIL_DOMAIN)->get()->each(function (User $user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return $orgId;
    }

    protected function people(string $password): void
    {
        foreach (self::PEOPLE as $key => [$name, , $title, $phone]) {
            $this->u[$key] = User::create([
                'name' => $name,
                'email' => self::email($key),
                'password' => $password,
                'title' => $title,
                'phone' => $phone,
            ]);
        }

        $this->org = Organization::create([
            'name' => 'Studio Lagune',
            'slug' => self::ORG_SLUG,
            'owner_id' => $this->u['adjoa']->id,
        ]);

        $joined = ['adjoa' => 120, 'rodrigue' => 110, 'fatou' => 95, 'kevin' => 90, 'mariam' => 70, 'serge' => 65, 'ibrahim' => 40, 'paul' => 30];
        foreach (self::PEOPLE as $key => [, $role]) {
            $membership = Membership::create([
                'user_id' => $this->u[$key]->id,
                'organization_id' => $this->org->id,
                'role' => $role,
            ]);
            $this->stamp($membership, $this->days(-$joined[$key]));
            $this->u[$key]->update(['current_organization_id' => $this->org->id]);
        }
    }

    // -------------------------------------------------------------------- CRM

    /** @return array{0: Opportunity, 1: Opportunity, 2: Opportunity, 3: Opportunity} opportunités gagnées */
    protected function crm(): array
    {
        $client = fn (string $owner, array $attrs, int $daysAgo) => $this->logged(
            $this->stamp(Client::create($attrs + ['owner_id' => $this->u[$owner]->id]), $this->days(-$daysAgo)),
            'client.created',
            $owner,
            $this->days(-$daysAgo)
        );

        $wariClient = $client('fatou', ['name' => 'Paul Ahouansou', 'company' => 'Wari Market', 'email' => 'paul@warimarket.test', 'phone' => '+229 01 61 22 33 44', 'address' => 'Ganhi, Cotonou', 'notes' => 'E-commerce alimentaire. Décisionnaire : Paul. Très attentif au paiement Mobile Money.'], 60);
        $kpayoClient = $client('kevin', ['name' => 'Aïssatou Bah', 'company' => 'Kpayo', 'email' => 'aissatou@kpayo.test', 'phone' => '+229 01 62 11 22 33', 'address' => 'Haie Vive, Cotonou', 'notes' => 'Fintech de transfert d\'argent. Cible : smartphones Android d\'entrée de gamme.'], 55);
        $sikaClient = $client('fatou', ['name' => 'Hortense Zinsou', 'company' => 'Sika Bio', 'email' => 'hortense@sikabio.test', 'phone' => '+229 01 63 44 55 66', 'address' => 'Porto-Novo', 'notes' => 'Cosmétiques bio. Lancement d\'une nouvelle gamme au prochain trimestre.'], 25);
        $eweClient = $client('kevin', ['name' => 'Komi Lawson', 'company' => 'Ewé Assurances', 'email' => 'komi@eweassurances.test', 'phone' => '+228 90 11 22 33', 'address' => 'Boulevard du 13 Janvier, Lomé', 'notes' => 'Audit du portail client terminé, satisfait. Potentiel de nouveaux projets.'], 80);
        $palmiers = $client('fatou', ['name' => 'Gisèle Adanlé', 'company' => 'Hôtel Les Palmiers', 'email' => 'direction@hotel-lespalmiers.test', 'phone' => '+229 01 64 77 88 99', 'address' => 'Route des Pêches, Cotonou', 'notes' => 'Site de réservation en ligne + application de conciergerie.'], 20);
        $laureats = $client('kevin', ['name' => 'Didier Hounkpè', 'company' => 'École Les Lauréats', 'email' => 'direction@leslaureats.test', 'phone' => '+229 01 65 10 20 30', 'address' => 'Abomey-Calavi', 'notes' => 'Plateforme de suivi des notes pour les parents.'], 12);
        $pharma = $client('rodrigue', ['name' => 'Florence Gbaguidi', 'company' => 'Pharmacie du Port', 'email' => 'contact@pharmacieduport.test', 'phone' => '+229 01 66 40 50 60', 'address' => 'Zone portuaire, Cotonou', 'notes' => 'Rencontrée au salon des PME. Besoin : gestion de stock.'], 5);
        $transport = $client('kevin', ['name' => 'Bertrand Sossa', 'company' => 'Transport Express Bénin', 'email' => 'bertrand@teb.test', 'phone' => '+229 01 67 70 80 90', 'address' => 'Parakou', 'notes' => 'A choisi un prestataire local moins cher.'], 45);

        $wari = $this->opportunity($wariClient, 'fatou', 'Refonte du site e-commerce', 6_500_000, ['prospect' => 60, 'contacted' => 55, 'proposal' => 48, 'won' => 40]);
        $kpayo = $this->opportunity($kpayoClient, 'kevin', 'Application mobile de transfert', 12_000_000, ['prospect' => 55, 'proposal' => 45, 'won' => 35]);
        $sika = $this->opportunity($sikaClient, 'fatou', 'Campagne de lancement nouvelle gamme', 3_200_000, ['prospect' => 25, 'proposal' => 15, 'won' => 6]);
        $ewe = $this->opportunity($eweClient, 'kevin', 'Audit du portail client', 2_800_000, ['prospect' => 80, 'won' => 70]);
        $this->opportunity($palmiers, 'fatou', 'Site de réservation et conciergerie', 4_500_000, ['prospect' => 20, 'contacted' => 16, 'proposal' => 8], followUp: 0);
        $this->opportunity($laureats, 'kevin', 'Plateforme parents-école', 2_100_000, ['prospect' => 12, 'contacted' => 9], followUp: -1);
        $this->opportunity($pharma, 'rodrigue', 'Logiciel de gestion de stock', 1_800_000, ['prospect' => 5], followUp: 3);
        $this->opportunity($transport, 'kevin', 'Suivi de flotte GPS', 5_400_000, ['prospect' => 45, 'contacted' => 40, 'proposal' => 30, 'lost' => 12]);

        // Échanges saisis à la main (historique CRM).
        $this->exchange($palmiers, 'fatou', 'meeting', 'Visite de l\'hôtel avec Mme Adanlé : 42 chambres, besoin de réservation directe sans commission.', -16);
        $this->exchange($palmiers, 'fatou', 'email', 'Proposition commerciale envoyée (site + conciergerie, 4,5 M FCFA, livraison en 10 semaines).', -8);
        $this->exchange($palmiers, 'fatou', 'call', 'Mme Adanlé a bien reçu la proposition, décision attendue après le conseil d\'administration.', -2);
        $this->exchange($laureats, 'kevin', 'call', 'Premier appel : 600 élèves, les parents veulent les notes sur WhatsApp et par SMS.', -9);
        $this->exchange($pharma, 'rodrigue', 'note', 'Contact pris au salon des PME. Rappeler en début de semaine prochaine.', -5);
        $this->exchange($wariClient, 'fatou', 'meeting', 'Atelier de cadrage : priorité au tunnel d\'achat et au paiement Mobile Money.', -38);
        $this->exchange($kpayoClient, 'kevin', 'email', 'Envoi des spécifications fonctionnelles validées par Aïssatou.', -28);

        return [$wari, $kpayo, $sika, $ewe];
    }

    /** @param array<string, int> $stages étape => jours écoulés depuis le passage à cette étape */
    protected function opportunity(Client $client, string $owner, string $title, int $amount, array $stages, ?int $followUp = null): Opportunity
    {
        $created = $this->days(-reset($stages));
        $final = array_key_last($stages);

        $opportunity = Opportunity::create([
            'client_id' => $client->id,
            'owner_id' => $this->u[$owner]->id,
            'title' => $title,
            'amount' => $amount,
            'stage' => $final,
            'next_follow_up' => $followUp === null ? null : $this->days($followUp)->toDateString(),
            'closed_at' => in_array($final, [Opportunity::STAGE_WON, Opportunity::STAGE_LOST], true) ? $this->days(-$stages[$final]) : null,
        ]);
        $this->stamp($opportunity, $created);
        $this->logged($opportunity, 'opportunity.created', $owner, $created);

        $previous = null;
        foreach ($stages as $stage => $daysAgo) {
            if ($previous !== null) {
                $this->logged($opportunity, 'opportunity.stage_changed', $owner, $this->days(-$daysAgo), ['from' => $previous, 'to' => $stage]);
            }
            $previous = $stage;
        }

        return $opportunity;
    }

    protected function exchange(Client $client, string $who, string $kind, string $body, int $daysAgo): void
    {
        $activity = Activity::create([
            'user_id' => $this->u[$who]->id,
            'subject_type' => $client->getMorphClass(),
            'subject_id' => $client->id,
            'action' => 'activity.'.$kind,
            'kind' => $kind,
            'body' => $body,
        ]);
        $this->stamp($activity, $this->days($daysAgo)->setTime(10, 30));
    }

    // --------------------------------------------------------------- projects

    /** @return array<string, Project> */
    protected function projects(Opportunity $wari, Opportunity $kpayo, Opportunity $sika, Opportunity $ewe): array
    {
        $make = function (string $key, string $owner, array $attrs, array $members, ?Opportunity $from, int $createdDaysAgo) {
            $project = Project::create($attrs + ['owner_id' => $this->u[$owner]->id]);
            $this->stamp($project, $this->days(-$createdDaysAgo));
            $project->members()->attach(collect($members)->map(fn ($m) => $this->u[$m]->id)->all());
            if ($from) {
                $from->update(['project_id' => $project->id]);
                $this->logged($project, 'project.created_from_opportunity', $owner, $this->days(-$createdDaysAgo), ['opportunity_id' => $from->id]);
            }

            return [$key => $project];
        };

        return array_merge(
            $make('wari', 'fatou', [
                'name' => 'Refonte du site Wari Market',
                'description' => 'Nouveau site e-commerce : catalogue, tunnel d\'achat et paiement Mobile Money (MTN, Moov).',
                'status' => Project::STATUS_IN_PROGRESS,
                'start_date' => $this->days(-38)->toDateString(),
                'end_date' => $this->days(21)->toDateString(),
            ], ['fatou', 'mariam', 'serge', 'paul'], $wari, 40),
            $make('kpayo', 'kevin', [
                'name' => 'Application mobile Kpayo',
                'description' => 'Application Android de transfert d\'argent, optimisée pour les téléphones d\'entrée de gamme.',
                'status' => Project::STATUS_IN_PROGRESS,
                'start_date' => $this->days(-33)->toDateString(),
                'end_date' => $this->days(30)->toDateString(),
            ], ['kevin', 'ibrahim', 'serge', 'mariam'], $kpayo, 35),
            $make('sika', 'fatou', [
                'name' => 'Campagne de lancement Sika Bio',
                'description' => 'Lancement de la nouvelle gamme : visuels, calendrier de publication, page produit.',
                'status' => Project::STATUS_UPCOMING,
                'start_date' => $this->days(5)->toDateString(),
                'end_date' => $this->days(40)->toDateString(),
            ], ['fatou', 'serge'], $sika, 6),
            $make('ewe', 'kevin', [
                'name' => 'Audit du portail client Ewé Assurances',
                'description' => 'Audit de sécurité et d\'ergonomie du portail client, avec plan de corrections.',
                'status' => Project::STATUS_DONE,
                'start_date' => $this->days(-68)->toDateString(),
                'end_date' => $this->days(-19)->toDateString(),
            ], ['kevin', 'mariam'], $ewe, 70),
            $make('intranet', 'adjoa', [
                'name' => 'Intranet interne 2025',
                'description' => 'Ancien intranet de l\'équipe, remplacé par WINE.',
                'status' => Project::STATUS_DONE,
                'start_date' => $this->days(-200)->toDateString(),
                'end_date' => $this->days(-90)->toDateString(),
                'archived_at' => $this->days(-60),
            ], ['adjoa', 'rodrigue'], null, 200),
        );
    }

    /** @param array<string, Project> $p */
    protected function tasks(array $p): void
    {
        // [projet, titre, assigné, statut, priorité, échéance (jours), terminée il y a (jours), créateur]
        $rows = [
            ['wari', 'Ateliers de cadrage avec Wari Market', 'fatou', 'done', 'normal', -30, 24, 'fatou'],
            ['wari', 'Arborescence et parcours d\'achat', 'serge', 'done', 'normal', -22, 18, 'fatou'],
            ['wari', 'Maquettes de la page d\'accueil', 'serge', 'done', 'high', -12, 10, 'fatou'],
            ['wari', 'Maquettes du tunnel de paiement', 'serge', 'review', 'high', 0, null, 'fatou'],
            ['wari', 'Intégration de la page d\'accueil', 'mariam', 'in_progress', 'high', 2, null, 'fatou'],
            ['wari', 'Paiement Mobile Money (MTN, Moov)', 'mariam', 'todo', 'urgent', 6, null, 'fatou'],
            ['wari', 'Optimisation des images produits', 'mariam', 'todo', 'normal', -2, null, 'fatou'],
            ['wari', 'Recette avec le client', 'fatou', 'todo', 'normal', 15, null, 'fatou'],
            ['wari', 'Rédaction des fiches produits', null, 'todo', 'low', 9, null, 'fatou'],

            ['kpayo', 'Spécifications fonctionnelles', 'kevin', 'done', 'high', -30, 28, 'kevin'],
            ['kpayo', 'Design system mobile', 'serge', 'done', 'normal', -23, 21, 'kevin'],
            ['kpayo', 'Écran d\'inscription et code OTP', 'ibrahim', 'done', 'high', -15, 14, 'kevin'],
            ['kpayo', 'Écran portefeuille', 'ibrahim', 'done', 'normal', -7, 6, 'kevin'],
            ['kpayo', 'Transferts entre utilisateurs', 'ibrahim', 'in_progress', 'high', 0, null, 'kevin'],
            ['kpayo', 'API de solde en temps réel', 'mariam', 'review', 'normal', 0, null, 'kevin'],
            ['kpayo', 'Tests sur Android d\'entrée de gamme', 'ibrahim', 'todo', 'high', -3, null, 'kevin'],
            ['kpayo', 'Notifications push', 'ibrahim', 'todo', 'normal', 4, null, 'kevin'],
            ['kpayo', 'Publication sur le Play Store', 'kevin', 'todo', 'normal', 25, null, 'kevin'],

            ['sika', 'Brief créatif avec Sika Bio', 'fatou', 'todo', 'high', 5, null, 'fatou'],
            ['sika', 'Calendrier de publication', 'fatou', 'todo', 'normal', 10, null, 'fatou'],
            ['sika', 'Visuels réseaux sociaux', 'serge', 'todo', 'normal', 12, null, 'fatou'],

            ['ewe', 'Revue des accès et des mots de passe', 'mariam', 'done', 'high', -34, 33, 'kevin'],
            ['ewe', 'Tests d\'intrusion du portail', 'mariam', 'done', 'urgent', -31, 30, 'kevin'],
            ['ewe', 'Audit d\'ergonomie', 'kevin', 'done', 'normal', -27, 26, 'kevin'],
            ['ewe', 'Rapport final et plan de corrections', 'kevin', 'done', 'high', -20, 20, 'kevin'],

            ['intranet', 'Migration des documents', 'rodrigue', 'done', 'normal', -95, 92, 'adjoa'],
            ['intranet', 'Formation de l\'équipe', 'adjoa', 'done', 'normal', -91, 90, 'adjoa'],
        ];

        $positions = [];
        $tasks = [];
        foreach ($rows as [$project, $title, $assignee, $status, $priority, $due, $doneAgo, $creator]) {
            $positions[$project] = ($positions[$project] ?? -1) + 1;
            $tasks[$title] = $this->task($p[$project], $title, $assignee, $status, $priority, $due, $doneAgo, $creator, $positions[$project]);
        }

        // Sous-tâches (la progression du projet ne compte que les tâches racines).
        $subtasks = [
            'Intégration de la page d\'accueil' => [
                ['Header et navigation', 'mariam', 'done', 1],
                ['Section produits vedettes', 'mariam', 'in_progress', null],
                ['Pied de page et mentions légales', 'mariam', 'todo', null],
            ],
            'Transferts entre utilisateurs' => [
                ['Saisie du destinataire par numéro', 'ibrahim', 'done', 2],
                ['Confirmation par code PIN', 'ibrahim', 'in_progress', null],
                ['Reçu de transfert', 'ibrahim', 'todo', null],
            ],
        ];
        foreach ($subtasks as $parentTitle => $children) {
            $parent = $tasks[$parentTitle];
            foreach ($children as $i => [$title, $assignee, $status, $doneAgo]) {
                $this->task($parent->project, $title, $assignee, $status, 'normal', null, $doneAgo, $parent->created_by === $this->u['fatou']->id ? 'fatou' : 'kevin', $i, $parent);
            }
        }

        // Commentaires.
        $comments = [
            ['Maquettes du tunnel de paiement', 'serge', 'Version 2 en ligne, j\'ai simplifié l\'étape de choix du réseau mobile.', 1],
            ['Maquettes du tunnel de paiement', 'paul', 'Très clair. Peut-on afficher les frais avant la confirmation ?', 0],
            ['Maquettes du tunnel de paiement', 'fatou', 'Bonne idée Paul, Serge ajoute un récapitulatif des frais.', 0],
            ['Intégration de la page d\'accueil', 'fatou', 'Pense à tester sur mobile en 3G, la majorité du trafic vient de là.', 2],
            ['Intégration de la page d\'accueil', 'mariam', 'C\'est noté, je mesure avec Lighthouse en mode mobile.', 1],
            ['Optimisation des images produits', 'fatou', 'Cette tâche est en retard, on en parle au point de demain ?', 0],
            ['Tests sur Android d\'entrée de gamme', 'kevin', 'Priorité haute : c\'est notre cible principale.', 1],
            ['Tests sur Android d\'entrée de gamme', 'ibrahim', 'J\'ai récupéré deux téléphones de test, je commence demain matin.', 0],
            ['API de solde en temps réel', 'mariam', 'Endpoint prêt, la doc est dans le ticket. Kévin, tu peux relire ?', 0],
        ];
        foreach ($comments as $i => [$taskTitle, $who, $body, $daysAgo]) {
            $comment = TaskComment::create([
                'task_id' => $tasks[$taskTitle]->id,
                'user_id' => $this->u[$who]->id,
                'body' => $body,
            ]);
            $this->stamp($comment, $this->days(-$daysAgo)->setTime(9 + $i, 15));
        }
    }

    protected function task(Project $project, string $title, ?string $assignee, string $status, string $priority, ?int $dueIn, ?int $doneAgo, string $creator, int $position, ?Task $parent = null): Task
    {
        $task = Task::create([
            'project_id' => $project->id,
            'parent_id' => $parent?->id,
            'assignee_id' => $assignee ? $this->u[$assignee]->id : null,
            'created_by' => $this->u[$creator]->id,
            'title' => $title,
            'status' => $status,
            'priority' => $priority,
            'due_date' => $dueIn === null ? null : $this->days($dueIn)->toDateString(),
            'position' => $position,
            'completed_at' => $status === Task::STATUS_DONE && $doneAgo !== null ? $this->days(-$doneAgo)->setTime(16, 0) : null,
        ]);
        $this->stamp($task, $project->created_at->copy()->addDays(1));

        return $task;
    }

    // ----------------------------------------------------------------- social

    protected function social(): void
    {
        $post = function (string $author, string $body, int $daysAgo, bool $pinned = false, array $bravo = [], array $comments = []) {
            $post = Post::create([
                'author_id' => $this->u[$author]->id,
                'body' => $body,
                'pinned' => $pinned,
                'pinned_at' => $pinned ? $this->days(-$daysAgo) : null,
            ]);
            $this->stamp($post, $this->days(-$daysAgo)->setTime(8, 45));
            foreach ($bravo as $who) {
                PostReaction::create(['post_id' => $post->id, 'user_id' => $this->u[$who]->id, 'emoji' => 'bravo']);
            }
            foreach ($comments as [$who, $body]) {
                PostComment::create(['post_id' => $post->id, 'author_id' => $this->u[$who]->id, 'body' => $body]);
            }
        };

        $post('adjoa', "Bienvenue sur WINE 👋\nÀ partir d'aujourd'hui, nos projets, nos tâches et nos échanges clients passent ici. Fini les groupes WhatsApp éparpillés : chaque projet a son canal dans le chat.", 21, pinned: true,
            bravo: ['rodrigue', 'fatou', 'kevin', 'mariam', 'serge', 'ibrahim'],
            comments: [['fatou', 'Enfin ! Je migre les projets en cours dès cet après-midi.'], ['ibrahim', 'Top, l\'appli fonctionne bien sur mon téléphone.']]);
        $post('kevin', "Projet livré ✅ L'audit du portail client Ewé Assurances est terminé et le rapport est validé par Komi. Merci Mariam pour les tests d'intrusion !", 19,
            bravo: ['adjoa', 'rodrigue', 'fatou', 'mariam', 'serge'],
            comments: [['adjoa', 'Bravo à toute l\'équipe, le client parle déjà d\'un deuxième projet.']]);
        $post('rodrigue', "Rappel : point d'équipe vendredi à 11h (et non 10h). Ordre du jour : avancement Wari Market et Kpayo, relances CRM.", 3,
            bravo: ['fatou', 'kevin']);
        $post('fatou', "Bonne nouvelle : Sika Bio a signé pour la campagne de lancement de sa nouvelle gamme 🌿 Démarrage dans 5 jours avec Serge.", 6,
            bravo: ['adjoa', 'rodrigue', 'serge', 'kevin', 'mariam'],
            comments: [['serge', 'J\'ai déjà quelques idées de visuels !']]);
        $post('mariam', "La nouvelle page d'accueil Wari Market est en ligne sur l'environnement de test. Vos retours sont les bienvenus, surtout sur mobile 📱", 1,
            bravo: ['fatou', 'serge']);
    }

    protected function invitations(): Invitation
    {
        $member = Invitation::create([
            'organization_id' => $this->org->id,
            'email' => 'awa.kone@'.self::EMAIL_DOMAIN,
            'role' => Membership::ROLE_MEMBER,
            'invited_by' => $this->u['rodrigue']->id,
            'expires_at' => $this->days(5),
        ]);
        $this->stamp($member, $this->days(-2));

        return Invitation::create([
            'organization_id' => $this->org->id,
            'email' => 'gisele@hotel-lespalmiers.test',
            'role' => Membership::ROLE_GUEST,
            'invited_by' => $this->u['adjoa']->id,
            'expires_at' => $this->days(7),
        ]);
    }

    // ---------------------------------------------------------------- helpers

    protected function days(int $offset): Carbon
    {
        return $this->now->copy()->addDays($offset);
    }

    /** Fixe created_at/updated_at (non « fillable ») sans déclencher d'événements. */
    protected function stamp(Model $model, Carbon $at): Model
    {
        $model->timestamps = false;
        $model->forceFill(['created_at' => $at, 'updated_at' => $at])->saveQuietly();
        $model->timestamps = true;

        return $model;
    }

    protected function logged(Model $subject, string $action, string $who, Carbon $at, array $meta = []): Model
    {
        $this->stamp(Activity::log($subject, $action, $this->u[$who]->id, $meta), $at);

        return $subject;
    }

    protected function report(string $password, Invitation $guestInvitation): void
    {
        if (! $this->command) {
            return;
        }

        $this->command->info("Organisation « {$this->org->name} » créée (id {$this->org->id}).");
        $this->command->table(
            ['Rôle', 'Nom', 'E-mail', 'Mot de passe'],
            collect(self::PEOPLE)->map(fn ($p, $key) => [$p[1], $p[0], self::email($key), $password])->values()->all()
        );
        $this->command->line('Invitation invité à accepter à l\'écran : '.rtrim((string) config('app.url'), '/').'/invitation/'.$guestInvitation->token);
        $this->command->line('Chat de démo (MongoDB) : php artisan demo:chat | node scripts/seed-demo-chat.mjs (voir docs/DEMO.md)');
    }
}
