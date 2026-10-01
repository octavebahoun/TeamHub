# TeamHub — Déploiement du nouveau frontend + extensions API (agent IA)

- **Date** : 2026-10-01 (UTC)
- **Commit déployé** : `66f33fb1b3f56e2d28a56e353a44cf3d4eece4c6` — « chore: suppression de toutes les données mock » (branche `claude/affectionate-fermi-hskazy`)
- **Périmètre du pull** : 16 commits depuis `c4e4f68` (220 fichiers, +21 493 / −4 167) :
  - nouveau frontend WINE complet : Next 16 / React 19 / Tailwind v4 / shadcn / Vitest
  - extensions API : chat, invitations (liste/annulation/renvoi/inscription par lien), profil (`PATCH /me`, mot de passe, notifications), CRM (historique/saisie d'échanges, adresse), social (`reacted`), compteurs projets/tâches, analytics enrichies
  - realtime : canaux chat (`channel:list`, `channel:history`, `channel:direct`, canal general)
  - docs (schéma DB + PDF), landing page publique sur `/`
- **Serveur** : `ip-172-26-9-140` (Ubuntu 24.04) — Docker 29.7.2, Compose v5.5.0
- **URL** : https://teamhub.excellenceteam.site
- **Verdict** : **PROD-READY**

---

## 1. Build et démarrage

- RAM disponible faible avant build (790 Mi) → `docker compose down` (volumes conservés) puis **build séquentiel** : `COMPOSE_PARALLEL_LIMIT=1 docker compose build` → **4/4 images OK** (api, data, realtime, web). Aucun OOM.
- `docker compose up -d` → **7/7 services Up**, `teamhub-api-1` healthy, aucun restart loop.
- **4 nouvelles migrations appliquées automatiquement** par l'entrypoint api :
  ```
  2026_10_01_090000_add_invited_by_to_invitations_table ...... DONE
  2026_10_01_090100_add_profile_fields_to_users_table ........ DONE
  2026_10_01_090200_add_kind_and_body_to_activities_table .... DONE
  2026_10_01_090300_add_address_to_clients_table ............. DONE
  ```
  Données existantes conservées (volumes Postgres/Mongo/Redis inchangés).
- Caddy : réseau `teamhub_default` toujours attaché (`down` n'a pas pu supprimer le réseau, utilisé par Caddy) ; `caddy reload` à chaud (0 erreur), Caddyfile **non modifié**.
- `docker compose build` n'a nécessité **aucun contournement** (le `public/.gitkeep` et le stage `test` sont bien en place).

---

## 2. Tests fonctionnels

### Flux existants + rôles (script E2E `/tmp/teamhub-e2e.sh`)

| Test | Résultat |
|------|----------|
| `GET /api/up` → `{"ok":true}` / `POST /api/internal/verify` → 404 | **[OK]** / **[OK]** |
| Register owner, projet, tâche, client, `won` → projet auto, post, analytics | **[OK]** |
| `GET /members` = 1 ; invitation + accept ; switch org | **[OK]** |
| Membre : CRM 403, Analytics 403, 0 projet avant ajout, 1 après partage | **[OK]** |
| WSS Socket.io handshake | **[OK]** |

### Nouveaux endpoints

| Test | Résultat |
|------|----------|
| `PATCH /me` (name/title/phone) | **[OK]** |
| `GET`/`PUT /me/notifications` | **[OK]** (`task_assigned`, `due_reminder`, `chat_messages`, `weekly_digest`) |
| `PUT /me/password` : mauvais mdp → 422, bon mdp → 200, login nouveau mdp → 200 | **[OK]** |
| Invitation publique `GET /invitations/{token}` **sans auth** (fraîche) | **[OK]** 200 (org + invited_by + expires_at) |
| `GET /invitations`, `resend`, `DELETE` | **[OK]** |
| `POST`/`GET /clients/{id}/activities` (kind=call) | **[OK]** |
| Adresse client conservée (`address`) | **[OK]** |
| Compteurs projet (`tasks_count`, `done_tasks_count`) | **[OK]** |
| Social : champ `reacted` présent sur `GET /posts` | **[OK]** |
| Analytics enrichies (`completed_tasks`, `completed_per_week`) | **[OK]** |

> Note : 3 assertions initiales de mon script étaient trop strictes, **pas des bugs applicatifs** :
> aperçu public testé sur une invitation déjà acceptée (correctement non previewable) ; historique client = 4 entrées normales (`client.created`, `opportunity.created`, `opportunity.stage_changed`, `activity.call`) ; parsing de compteurs relu ensuite en brut (200 + `tasks_count:1`).

### Pest (stage `test` officiel)

```bash
docker build --target test -t teamhub-api-test apps/api/
docker run --rm --network teamhub_default -e APP_KEY=… -e INTERNAL_SECRET=… \
  -e APP_ENV=testing -e REDIS_URL=redis://redis:6379 teamhub-api-test
```

```
Tests:    49 warnings (224 assertions)   ← 0 échec
PEST_EXIT=0
```

49 tests (contre 22 précédemment) : AdminGovernance, ClientActivity, InternalApi, Invitation, Members, Profile, ProjectCounters, RolePermissions, Social, TenantIsolation, Auth, Policy, CrossOrg… Les warnings restent uniquement `file_get_contents(/app/.env)` (conteneur de test sans `.env`), bénins.

### Frontend

| Route | Résultat |
|-------|----------|
| `GET /` (landing publique) | **[OK]** 200, 74 Ko, titre « WINE · Toute votre équipe, au même endroit » |
| `GET /login`, `/projects`, `/dashboard` (non authentifié) | **[OK]** 307 → `/connexion?next=…` puis 200 |
| Logs web (20 min) | aucune erreur SSR |

### Non-régression

contravo 200, n8n 200, mecano 200, api.waaloge 200.

---

## 3. Ressources

| | Avant | Après |
|---|---|---|
| `df -h /` | 41G utilisés / 37G libres (53 %) | 44G utilisés / **33G libres** (58 %) |
| `free -h` | 3,0Gi used — 790Mi available | 2,5Gi used — **1,3Gi available** ; swap ~2,4/4,0Gi |
| Build cache | 12,13 Go (3,9 récupérables) | **15,44 Go (7,06 récupérables)** |

Consommation TeamHub : ~440 Mo RAM, 7/7 services stables.

---

## 4. Recommandations restantes

1. **Persistance réseau Caddy** (priorité) : `teamhub_default` doit être déclaré `external: true` côté EPINET et attaché au service caddy, sinon une recréation de `epitnet-caddy-1` coupe TeamHub (502).
2. **Disque** : le build cache atteint 15,4 Go (7,06 récupérables). Un `docker buildx prune` peut être tenté (les tentatives précédentes renvoyaient 0B tant que BuildKit marquait les entrées « in use ») ; surveiller les 33 Go libres.
3. **Warnings Pest `.env`** : fournir un `.env` minimal au conteneur de test pour les supprimer.
4. **Déploiement** : penser à `COMPOSE_PARALLEL_LIMIT=1` sur ce serveur (3,7 Go RAM) pour les gros builds frontend.

---

## 5. Fichiers/système modifiés

- `~/teamhub` : `git pull` (aucun fichier de code touché) ; `~/teamhub/DEPLOY_REPORT.md` : **seul fichier écrit**.
- Images `teamhub-api/data/realtime/web:latest` reconstruites ; `teamhub-api-test:latest` reconstruite depuis le stage `test` officiel.
- `epitnet-caddy-1` : `caddy reload` à chaud uniquement (Caddyfile non modifié, aucun backup supplémentaire).
- Aucun autre projet serveur touché (Contravo, waaloge, mecano, epitnet×5, n8n intacts). Aucun secret modifié.
