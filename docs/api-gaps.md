# Écarts API ↔ écrans (frontend `apps/web`)

Le frontend suit le contrat actuel de `apps/api` (Laravel). Quand un écran a besoin d'une donnée
que l'API ne fournit pas encore, il appelle l'**extension** décrite ici, avec un **repli** :
l'écran reste utilisable sur une API non mise à jour (section masquée, calcul côté client, ou
message « pas encore disponible »).

Le mock de développement a été supprimé : le frontend ne s'appuie plus que sur le vrai backend,
et les tests Pest de `apps/api` sont la référence exécutable du contrat.

Légende : 🔴 bloquant pour l'écran · 🟠 dégradé sans l'extension · 🟢 confort

## État (2026-10-01)

Implémenté sur `feat/backend-extensions` (fusionné dans `feat/frontend-maquettes`) :
chat temps réel (`channel:list/history/direct` + canal `general`), invitations (liste, annulation,
renvoi, aperçu public, inscription par lien, refus de `role=owner`), compteurs projets/tâches,
`joined_at`/`last_active_at`, profil (`PATCH /me`, mot de passe, préférences), historique CRM
et `clients.address`, `reacted` sur les posts, analytics (`completed_tasks`,
`completed_per_week`, `late_projects`).

Livré côté data : `profitability` sur l’overview, `GET /analytics/summary` (bilan
hebdomadaire) et `GET /analytics/relances` — contrat dans `docs/data-ia.md`.

Reste à faire : jalons, `projects.client_id`, publications typées (`posts.kind`). Activité de
projet, suppression de compte et e-mail d'invitation (création et renvoi) sont en place.
Tant que `MAIL_MAILER=log`, le message est écrit dans les logs Laravel ; avec un SMTP
(Brevo ou Resend), le même e-mail part vers la boîte invitée.

## REST (`/api/v1`)

### Projets

| Besoin | Extension attendue | Repli actuel |
| --- | --- | --- |
| 🟠 Progression et équipe dans la liste (Accueil, Projets) | `GET /projects` : ajouter `tasks_count`, `done_tasks_count` (tâches racines), `members[] {id,name,avatar}` | Avancement à 0 %, pas d'avatars |
| 🟢 Client du projet | `client {id,name,company}` sur `GET /projects` et `GET /projects/{id}` (nécessite `projects.client_id`) | « Produit interne » affiché |
| 🟢 Jalons | `GET /projects/{id}` : `milestones[] {code,title,done,current}` (table à créer) | Section « Jalons » masquée |
| 🟢 Fichiers | `GET /projects/{id}` : `attachments[] {id,kind,name,size}` (table `attachments` existante, sans endpoint) | Section « Fichiers » masquée |
| 🟢 Activité récente | `GET /projects/{id}/activity` → `[{id, action, body, user{id,name}, created_at}]` | En place |

### Tâches

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟢 Compteurs sur les cartes Kanban | `GET /projects/{id}/tasks` : `subtasks_count`, `done_subtasks_count`, `comments_count` | Compteurs masqués |
| 🟢 Pièces jointes | `GET /tasks/{id}` : `attachments[]` | Section masquée |

### Membres & invitations

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟠 Invitations en attente | `GET /invitations` (O/A) → `Invitation[]` | Liste masquée |
| 🟠 Annuler / renvoyer | `DELETE /invitations/{id}`, `POST /invitations/{id}/resend` (prolonge `expires_at` + renvoie l'e-mail) | Boutons en erreur |
| 🔴 Page d'invitation publique | `GET /invitations/{token}` (sans auth) → `{email, role, expires_at, organization{id,name}, invited_by{id,name}}` ; 410 si expirée | Page « Connectez-vous pour accepter » |
| 🔴 Créer son compte depuis l'invitation | `POST /invitations/{token}/register` (sans auth) `{name, password}` → `{token, user, organization}` — **ne crée pas de nouvelle organisation** (contrairement à `auth/register`) | Inscription classique (crée une org en trop) |
| 🟢 « Nouveaux membres » (Social) et ancienneté | `GET /members` : `joined_at` (= `memberships.created_at`), `last_active_at` (ex. `personal_access_tokens.last_used_at`) | Bloc masqué, « — » |
| 🐞 Bug | `POST /invitations` accepte `role=owner` : restreindre à `admin,manager,member,guest` | — |

### Profil

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟠 Modifier ses infos | `PATCH /me` `{name, email, title, phone}` → `{user}` (ajouter `users.title`, `users.phone`) | Message « pas encore disponible » |
| 🟠 Changer de mot de passe | `PUT /me/password` `{current_password, password}` ; 422 sur `current_password` si faux | Idem |
| 🟢 Préférences de notification | `GET /me/notifications`, `PUT /me/notifications` `{task_assigned, due_reminder, chat_messages, weekly_digest}` | Valeurs par défaut, non persistées |
| 🟢 Suppression du compte | `DELETE /me` | En place (compte anonymisé, contenu partagé conservé) |
| 🟢 Mot de passe oublié | `POST /auth/forgot-password`, `POST /auth/reset-password` | Page d'explication |

### CRM

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟠 Historique d'un client | `GET /clients/{id}/activities` → `[{id, action, kind, body, meta, user{id,name}, created_at}]` (les `activities` existent déjà en base) | « Aucun échange » |
| 🟠 Noter un échange | `POST /clients/{id}/activities` `{kind: note\|call\|email\|meeting, body}` | Message « pas encore disponible » |
| 🟢 Adresse | `clients.address` | Champ masqué |

Le type **client / prospect** est calculé côté interface : un contact est « client » s'il a au
moins une opportunité gagnée. La **prochaine relance** d'un contact = la plus proche
`next_follow_up` de ses opportunités ouvertes. Aucun changement d'API requis.

### Social

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟠 État « j'ai dit Bravo » | `GET /posts` : `reacted: bool` pour l'utilisateur courant | Bouton jamais actif au chargement |
| 🟢 Publications typées (« Projet livré ») | `posts.kind` (`project_delivered`, `milestone`) + `posts.meta {project}` | Publication texte simple |

### Analytics

| Besoin | Extension | Repli |
| --- | --- | --- |
| 🟠 Tâches terminées par semaine | `GET /analytics/overview` : `completed_per_week[] {week:"S36", count}` (sur `tasks.completed_at`), `completed_tasks` (30 j) | Graphique masqué |
| 🟢 Projets en retard | `late_projects[] {id, name, overdue}` | Calculé côté interface (N appels `projects/{id}/tasks`) |

## Temps réel (`apps/realtime`, Socket.io)

🔴 **Bloquant pour le Chat** : aujourd'hui aucun moyen de lister les canaux ni de charger
l'historique. Le frontend utilise ces événements (avec accusé de réception) :

| Événement (client → serveur) | Charge | Accusé |
| --- | --- | --- |
| `channel:list` | — | `{ok, channels: [{id, type, name, project_id, member_ids, unread_count, last_message_at}]}` — pour un canal `direct`, `name` = nom de l'autre membre |
| `channel:history` | `{channel_id, before?}` | `{ok, messages: Message[]}` (ordre chronologique, 50 derniers), et remet `unread_count` à 0 |
| `channel:direct` | `{user_id}` | `{ok, channel}` — crée le canal privé s'il n'existe pas |

Existants, utilisés tels quels : `channel:join`, `message:send`, `message:new`, `typing`,
`presence:update`, `notification:new`.

Suggestion : un canal `general` d'organisation (`type: "project"`, `project_id: null`) créé avec
l'organisation.

## Session (rappel d'architecture)

- Le jeton Sanctum vit dans un cookie `httpOnly` posé par le serveur Next (`wine_token`) ;
  l'organisation active dans `wine_org`, envoyée en `X-Organization-Id`.
- Le navigateur n'appelle jamais l'API REST directement : tout passe par les server components
  et les server actions de Next (variable `API_URL`, réseau Docker interne en production).
- Seule exception : la socket temps réel, à qui le jeton est transmis au chargement de la page.
