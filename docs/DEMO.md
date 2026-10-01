# Démo filmée — organisation « Studio Lagune »

Organisation fictive, prête à filmer le parcours complet des 5 rôles (doc « Parcours par rôle »).
Toutes les dates sont relatives au jour du seed : **relancer le seed juste avant chaque prise**
pour que les retards, les tâches du jour et les relances tombent bien.

## Lancer (sur le serveur)

```bash
cd ~/teamhub
# 1. Base de données (réexécutable : efface puis recrée la démo)
docker compose exec -e DEMO_PASSWORD='choisir-un-mot-de-passe' api php artisan db:seed --class=DemoSeeder --force
# 2. Chat (MongoDB) : canaux et messages de démo
docker compose exec -T api php artisan demo:chat | docker compose exec -T realtime node scripts/seed-demo-chat.mjs
```

Le seed affiche les comptes, le mot de passe et un **lien d'invitation** à accepter à l'écran.
Sans `DEMO_PASSWORD`, un mot de passe aléatoire est généré et affiché.

Après le tournage : `docker compose exec api php artisan demo:purge --force`.

## Comptes (même mot de passe pour tous)

| Rôle | Personne | E-mail | Ce qu'on montre |
| --- | --- | --- | --- |
| Propriétaire | Adjoa Mensah | `adjoa@studiolagune.test` | Analytics, Social épinglé, Membres, nommer un admin |
| Admin | Rodrigue Houngbo | `rodrigue@studiolagune.test` | Membres, invitations en attente, tous les projets |
| Chef de projet | Fatou Diallo | `fatou@studiolagune.test` | CRM → opportunité gagnée → projet, Kanban |
| Chef de projet | Kévin Agossou | `kevin@studiolagune.test` | Projet Kpayo, tâche en retard bloquante |
| Membre | Mariam Traoré | `mariam@studiolagune.test` | Accueil (retard / aujourd'hui / semaine), Kanban, chat |
| Membre | Serge Dossou | `serge@studiolagune.test` | Tâche « en revue », commentaires client |
| Membre | Ibrahim Sow | `ibrahim@studiolagune.test` | Sous-tâches, tâche du jour |
| Invité | Paul Ahouansou | `paul@studiolagune.test` | Ne voit que le projet Wari Market et son canal |

## Scènes prêtes

**1. Propriétaire (Adjoa)** — Accueil → *Analytics* : 3 projets actifs, 2 tâches en retard,
courbe des tâches terminées sur 5 semaines, pipeline. *Social* : annonce épinglée « Bienvenue sur WINE ».
*Membres* : 8 personnes, 2 invitations en attente ; seul le propriétaire peut nommer un admin.

**2. Admin (Rodrigue)** — *Membres* : changer le rôle de Serge, renvoyer l'invitation d'Awa ;
l'option « Admin » n'apparaît pas pour lui. *Projets* : voit tous les projets.

**3. Chef de projet (Fatou)** — *CRM › Pipeline* : faire passer « Site de réservation et conciergerie »
(Hôtel Les Palmiers, en *Proposition*, relance prévue aujourd'hui) à **Gagné** → le projet est créé
automatiquement. *Fiche client Hôtel Les Palmiers* : historique (visite, e-mail, appel).
*Projet Wari Market › Kanban* : 9 tâches, filtrer par étape, assigner « Rédaction des fiches produits ».

**4. Membre (Mariam)** — *Accueil* : 1 tâche en retard (« Optimisation des images produits »),
1 tâche du jour (« API de solde en temps réel »), d'autres dans la semaine. *Tâche* « Intégration de la
page d'accueil » : sous-tâches, commentaires, passer en « En revue ». *Chat* : message non lu de Fatou.
Pas d'accès au CRM ni à Analytics.

**5. Invité (Paul)** — *Projets* : uniquement « Refonte du site Wari Market » (lecture).
*Chat* : canal du projet uniquement (pas de canal général, pas de messages privés).
Pas de Social, CRM, Analytics ni Membres.

**6. Accepter une invitation** — ouvrir le lien affiché par le seed (`/invitation/…`), créer le compte
de Gisèle (Hôtel Les Palmiers, invitée) : elle arrive directement dans Studio Lagune.

## Contenu créé

- 8 comptes, 2 invitations en attente
- 8 contacts CRM, 8 opportunités (toutes les étapes), historique d'échanges
- 5 projets (2 en cours, 1 à venir, 1 terminé, 1 archivé), 27 tâches + 6 sous-tâches, commentaires
- 5 publications (1 épinglée), réactions « Bravo » et commentaires
- Chat : canal général, 3 canaux projet, 2 conversations privées, quelques messages non lus

Les e-mails utilisent le domaine réservé `.test` : aucun message ne peut partir vers une vraie adresse.
