# Documentation d'architecture — WINE

**Porteur :** Excellence Team · **Responsable :** Octave BAHOUN
**Version :** 1.0 · **Date :** 01/10/2026

> Complète le cahier des charges. Les éléments marqués **[À valider]** sont des propositions.

---

## 1. Vue d'ensemble

WINE repose sur quatre services qui partagent deux bases de données.

| Service | Techno | Port **[À valider]** | Responsabilité |
| --- | --- | --- | --- |
| `web` | Next.js 14 (App Router) | 3000 | Interface utilisateur |
| `api` | Laravel 12 | 8000 | Logique métier, authentification, permissions |
| `realtime` | Node.js + Socket.io | 4000 | Chat, présence, notifications |
| `data` | FastAPI (Python) | 8001 | Statistiques, futures fonctions IA |
| `postgres` | PostgreSQL 16 | 5432 | Données structurées |
| `mongo` | MongoDB 7 | 27017 | Messages et fil social |
| `redis` | Redis 7 | 6379 | Pont Laravel → Socket.io (pub/sub), files d'attente, cache |

**Règle centrale :** Laravel est la seule source de vérité pour les droits. Les autres services lui demandent (appel interne) au lieu de vérifier eux-mêmes.

## 2. Flux principaux

| Flux | Chemin |
| --- | --- |
| Action classique (créer une tâche) | `web` → REST → `api` → PostgreSQL |
| Message de chat | `web` → WebSocket → `realtime` → MongoDB → diffusion aux membres du canal |
| Notification métier (tâche assignée) | `api` → Redis (pub/sub) → `realtime` → `web` |
| Révocation d'un membre | `api` → Redis (`user:revoked`) → `realtime` coupe le socket |
| Tableau de bord | `web` → `api` → `data` → lecture PostgreSQL + MongoDB |
| Authentification | `web` → `api` (Sanctum) → jeton réutilisé par `realtime` et `data` |

## 3. Structure du dépôt (monorepo)

```
wine/
├── apps/
│   ├── web/          # Next.js 14
│   ├── api/          # Laravel 12
│   ├── realtime/     # Node.js + Socket.io
│   └── data/         # FastAPI
├── infra/
│   ├── docker-compose.yml        # local : tous les services
│   ├── docker-compose.prod.yml   # AWS : api, realtime, data, bases, redis
│   └── Caddyfile
├── docs/
│   ├── cahier-des-charges.md
│   ├── architecture.md
│   └── openapi.yaml
└── .github/workflows/
```

## 4. Multi-tenant

- Une seule base, une colonne `organization_id` sur chaque table métier.
- Un middleware Laravel injecte l'organisation courante et filtre toutes les requêtes (global scope Eloquent).
- Côté MongoDB, chaque document porte `organization_id` ; index composé sur `(organization_id, channel_id, created_at)`.
- Côté Socket.io, chaque socket rejoint la room `org:{id}` puis ses rooms de canaux.

**Pourquoi pas une base par client :** coût et maintenance trop élevés pour la V1.

## 5. Modèle de données — PostgreSQL

| Table | Champs clés |
| --- | --- |
| `organizations` | id, name, slug, owner_id, plan, created_at |
| `users` | id, name, email (unique), password, avatar |
| `memberships` | id, user_id, organization_id, role (owner, admin, manager, member, guest) |
| `projects` | id, organization_id, name, description, status, start_date, end_date, owner_id |
| `project_members` | project_id, user_id |
| `tasks` | id, project_id, parent_id, title, description, assignee_id, status, priority, due_date, position |
| `task_comments` | id, task_id, user_id, body, created_at |
| `attachments` | id, attachable_type, attachable_id, path, size, mime |
| `clients` | id, organization_id, name, company, email, phone, notes |
| `opportunities` | id, organization_id, client_id, title, amount, stage, owner_id, next_follow_up |
| `activities` | id, organization_id, subject_type, subject_id, user_id, action, created_at |
| `invitations` | id, organization_id, email, role, token, expires_at |

Relations importantes :
- `opportunities.stage = gagné` peut créer un `project` lié au `client_id`.
- `tasks.parent_id` gère les sous-tâches.
- `activities` alimente Analytics et l'historique.

## 6. Modèle de données — MongoDB

| Collection | Champs clés |
| --- | --- |
| `channels` | _id, organization_id, type (project, direct), project_id, member_ids |
| `messages` | _id, organization_id, channel_id, sender_id, body, attachments, read_by, created_at |
| `posts` | _id, organization_id, author_id, body, pinned, reactions, created_at |
| `post_comments` | _id, post_id, author_id, body, created_at |

## 7. API REST (Laravel) — principaux endpoints

Préfixe : `/api/v1`. Toutes les routes, sauf auth, exigent un jeton et une organisation active.

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/auth/register` | Créer un compte + organisation |
| POST | `/auth/login` | Connexion |
| POST | `/auth/logout` | Déconnexion |
| GET | `/me` | Utilisateur et organisations |
| POST | `/invitations` | Inviter un membre |
| POST | `/invitations/{token}/accept` | Accepter une invitation |
| GET / POST | `/projects` | Lister / créer des projets |
| GET / PATCH / DELETE | `/projects/{id}` | Détail / modifier / archiver |
| GET / POST | `/projects/{id}/tasks` | Tâches d'un projet |
| PATCH | `/tasks/{id}` | Modifier (statut, assigné, position) |
| POST | `/tasks/{id}/comments` | Commenter |
| GET | `/me/tasks` | Mes tâches |
| GET / POST | `/clients` | CRM clients |
| GET / POST | `/opportunities` | Pipeline |
| PATCH | `/opportunities/{id}` | Changer d'étape |
| GET | `/analytics/overview` | Tableau de bord (proxy vers `data`) |

Contrat détaillé : `docs/openapi.yaml` **[À écrire]**.

## 8. Événements temps réel (Socket.io)

| Événement | Sens | Contenu |
| --- | --- | --- |
| `channel:join` | client → serveur | channel_id |
| `message:send` | client → serveur | channel_id, body, attachments |
| `message:new` | serveur → clients | message complet |
| `message:read` | client → serveur | message_id |
| `typing` | client → serveur → clients | channel_id, user_id |
| `presence:update` | serveur → clients | user_id, online |
| `notification:new` | serveur → client | type, titre, lien |

À la connexion, le serveur vérifie le jeton, puis place l'utilisateur dans ses rooms.

## 9. Service data (FastAPI)

| Route | Rôle |
| --- | --- |
| `GET /stats/overview?org=` | Projets actifs, tâches en retard, charge par membre |
| `GET /stats/pipeline?org=` | Montants par étape du CRM |
| `GET /stats/activity?org=&from=&to=` | Activité sur une période |

Accessible uniquement depuis le réseau interne Docker, jamais exposé directement.

## 10. Authentification et sécurité

- Laravel Sanctum, jeton stocké dans un cookie `httpOnly` via le serveur Next.js **[À valider]**.
- **Décision :** vérification par appel interne, pas de JWT. Sanctum reste le seul système de jetons.
- `realtime` appelle `api` (`POST /internal/verify`) une seule fois, à la connexion du socket. Les messages suivants passent sans revérification.
- `data` ne vérifie aucun jeton : il n'est joignable que par `api` (proxy), sur le réseau interne Docker.
- Retrait d'un membre : `api` publie `user:revoked` sur Redis, `realtime` coupe son socket immédiatement.
- Les routes `/internal/*` ne sont pas exposées par Caddy.
- Contrôle des rôles par Policies Laravel.
- Limitation de débit : 60 requêtes/minute par utilisateur, 5 tentatives de connexion.
- CORS limité au domaine du frontend (`wine.excellenceteam.site`) et aux previews Vercel autorisées.
- Secrets dans des fichiers `.env` hors dépôt.

## 11. Déploiement

| Élément | Choix |
| --- | --- |
| Frontend `web` | Vercel |
| `api`, `realtime`, `data`, bases, Redis | Serveur AWS d'Excellence Team, Docker Compose |
| Reverse proxy (AWS) | Caddy, HTTPS automatique |
| Fichiers | Cloudflare R2 (compatible S3) |
| Domaines | `wine.excellenceteam.site` (Vercel), `api.wine.excellenceteam.site` et `ws.wine.excellenceteam.site` (AWS) **[À valider]** |
| Sauvegardes | Dump PostgreSQL et MongoDB chaque nuit, copiés sur R2 |

Points d'attention :
- Frontend et API sur le **même domaine parent** (`excellenceteam.site`), sinon le cookie `httpOnly` de session ne passe pas entre Vercel et AWS. Cookie posé avec `Domain=.excellenceteam.site`, `Secure`, `SameSite=Lax`.
- Vercel ne garde pas de connexion WebSocket ouverte : le navigateur se connecte directement à `ws.wine…` sur AWS.
- R2 : Laravel utilise le driver `s3` avec l'endpoint R2. Upload direct navigateur → R2 par URL pré-signée générée par `api`, pour ne pas faire transiter les fichiers par le serveur.
- Fichiers privés : bucket non public, lecture par URL pré-signée à durée courte.

## 12. Environnements

| Environnement | Usage |
| --- | --- |
| `local` | Docker Compose sur la machine du développeur |
| `staging` | Tests avant mise en production **[À valider]** |
| `production` | Utilisateurs réels |

## 13. CI/CD

- GitHub Actions sur chaque pull request : lint, tests, build de chaque service.
- Tests : Pest (Laravel), Vitest (Next.js), Jest (Node), Pytest (FastAPI).
- Fusion sur `main` : `web` déployé automatiquement par Vercel ; `api`, `realtime` et `data` construits en images Docker puis déployés sur AWS.
- Chaque pull request obtient une preview Vercel.
- Conventional Commits vérifiés en CI.

## 14. Conventions

- Branches : `feat/…`, `fix/…`, `chore/…`
- Une pull request = un module ou une fonctionnalité
- Revue obligatoire par le chef de projet avant fusion sur `main`
- Nommage : snake_case en base, camelCase côté JavaScript

## 15. Décisions ouvertes

- Noms de domaine exacts
- Limite de taille des fichiers envoyés
