# TeamHub — Rapport de re-vérification après correctifs (agent IA)

- **Date** : 2026-10-01 (UTC)
- **Commit testé** : `32b5c2ec9c5fc5c8bfb5f76e576b0d00ced59f3a` — branche `claude/affectionate-fermi-hskazy` (« docs(deploy): prompt agent pour re-test après correctifs »)
  - Commits inclus : `ed4d6b9` (permissions rôle), `9257223` (correctifs issus du rapport agent), `3976db8` (merge role-policies-fix), `32b5c2e` (prompt re-test)
- **Serveur** : `ip-172-26-9-140` (Ubuntu 24.04) — Docker 29.7.2, Compose v5.5.0
- **URL** : https://teamhub.excellenceteam.site (TLS Let's Encrypt, expire 2026-12-29)
- **Verdict** : **PROD-READY** (avec réserves opérationnelles documentées en §6)

---

## 1. Pull / rebuild (Étape 1)

```bash
git fetch origin && git checkout claude/affectionate-fermi-hskazy
git pull origin claude/affectionate-fermi-hskazy   # 8dfc395 → 32b5c2e, 26 fichiers
docker compose down                                 # volumes conservés
docker compose build --no-cache                     # BUILD_EXIT=0, 4 images
docker compose up -d && sleep 45
```

- `docker compose down` a bien arrêté les conteneurs mais **n'a pas pu supprimer le réseau** (`Network teamhub_default Resource is still in use` — utilisé par `epitnet-caddy-1`). Conséquence positive : l'attachement Caddy a survécu au `down`, aucun `network connect` nécessaire.
- `docker compose build --no-cache` : **succès complet** (api, data, realtime, web). **Aucun contournement nécessaire** cette fois : `apps/web/public/.gitkeep` et le fix `psycopg` (dépendance dans `pyproject.toml`/`uv.lock` + Dockerfile `uv sync`) sont bien présents.
- `docker compose ps` après 45 s : **7/7 conteneurs Up**, `teamhub-api-1` healthy, aucun restart loop.

---

## 2. Caddy (Étape 2)

- `docker network inspect teamhub_default` → **`epitnet-caddy-1` déjà présent** ; pas de reconnexion.
- **Caddyfile non modifié** : après normalisation des commentaires, le bloc `teamhub.excellenceteam.site` déjà en place est **fonctionnellement identique** au nouveau `infra/Caddyfile.snippet` (`diff` vide) — les upstreams étaient déjà les noms de conteneurs (`teamhub-api-1:80`, `teamhub-realtime-1:4000`, `teamhub-web-1:3000`). Aucun backup supplémentaire créé (aucune écriture) ; le backup de la session précédente reste disponible : `~/EPINET/infra/caddy/Caddyfile.bak-1790814411`.
- `caddy validate` → `Valid configuration` ; `caddy reload` → OK (rechargé à chaud pour re-résoudre les nouvelles IP des conteneurs recréés).
- Non-régression : contravo 200, n8n 200, mecano 200, api.waaloge 200.

---

## 3. Résultats des tests (Étape 3)

### Flux existants

| # | Test | Résultat |
|---|------|----------|
| 3.1 | `GET /api/up` → `{"ok":true,"service":"api"}` | **[OK]** (corrigé) |
| 3.2 | `POST /api/internal/verify` → 404 | **[OK]** |
| 3.3 | Register owner (org créée) | **[OK]** — réponse contient bien `organization.id` |
| 3.4 | Projet + tâche + CRM `won` → projet auto | **[OK]** (projet id=3, tâche 201, `project_id` présent) |
| 3.5 | Post + analytics | **[OK]** (201 ; `active_projects:2`) |

### Nouveaux endpoints rôles

| # | Test | Résultat |
|---|------|----------|
| 3.6 | `GET /members` (owner) = 1 membre | **[OK]** |
| 3.7 | Invitation + register + accept + switch org | **[OK]** (accept 200, switch 200) |
| 3.8 | Membre → CRM 403 / Analytics 403 | **[OK]** / **[OK]** |
| 3.9 | Membre : 0 projet avant ajout | **[OK]** |
| 3.10 | Owner ajoute le membre au projet | **[OK]** (201) |
| 3.11 | Membre voit 1 projet après ajout | **[OK]** |
| 3.12 | Handshake WSS Socket.io | **[OK]** |
| 3.13 | Pest dans le conteneur api | **[FAIL littéral]** — voir ci-dessous |

### 3.13 — Pest : écart avec le prompt, contournement

`docker compose exec -T api ./vendor/bin/pest` **échoue** : `vendor/bin/pest: no such file or directory`.
Contrairement à ce qu'indique le prompt, si `tests/` est bien désormais inclus dans l'image (`.dockerignore` corrigé), l'image reste construite avec **`composer install --no-dev`** (`apps/api/Dockerfile` non modifié) : Pest/phpunit ne sont pas installés. Aucun fichier du dépôt n'a été modifié.

**Contournement** (image jetable dans `/tmp`, ne touche pas le dépôt) : `FROM teamhub-api:latest` + copie de `tests/` + `composer install` complet, exécutée sur le réseau `teamhub_default` avec `APP_KEY`, `INTERNAL_SECRET`, `REDIS_URL` :

```
Tests:    22 warnings (60 assertions)   ← 0 échec   (15 tests existants + 7 RolePermissionsTest)
PEST_EXIT=0   (PEST_EXIT=0 également)
```

**Durcissement `RealtimePublisher` validé** : suite relancée **sans Redis** → `EXIT=0`, 22/22. Les 3 échecs `RedisException: Connection refused` de la session précédente ont disparu (publication désormais protégée par try/catch + log).

Les 22 « warnings » sont uniquement `file_get_contents(/app/.env): Failed to open stream` (le conteneur de test jetable n'a pas de `.env` ; les tests passent). Bénin, déjà présent lors du 1er rapport.

---

## 4. Comparaison avec le rapport précédent

| Point | Session 1 (commit 8dfc395) | Cette session (commit 32b5c2e) |
|---|---|---|
| Build `web` (`/app/public` manquant) | **KO**, contourné par répertoire vide local | **Corrigé** — `apps/web/public/.gitkeep` versionné, build OK |
| Service `data` (`psycopg` absent du venv) | **KO** (crash loop), contourné par couche d'image | **Corrigé** — `psycopg[binary]` dans `pyproject.toml`/`uv.lock`, Dockerfile `uv sync`, service Up |
| `GET /api/up` | **404** (pas de route) | **Corrigé** — route `Route::get('up', ...)` dans `routes/api.php`, `{"ok":true}` |
| Caddy upstreams | `host.docker.internal` → 502, corrigé manuellement en noms de conteneurs | Snippet aligné (noms de conteneurs) ; bloc serveur déjà conforme, aucun changement |
| Realtime publisher si Redis down | Non testé | **Corrigé + vérifié** — suite Pest sans Redis : 22/22 |
| Permissions par rôle (owner/admin/manager/member/guest) | Non couvertes | **Alignées + vérifiées** — 7 nouveaux tests Pest + parcours live 3.6→3.11 |
| Pest dans image prod | Absent (`--no-dev` + tests exclus) | Tests inclus mais **Pest toujours absent** (`--no-dev`) → contournement image de test |
| Verdict session | ATTENTION | **PROD-READY** |

---

## 5. Ressources

| | Avant (début de session) | Après |
|---|---|---|
| `df -h /` | 38G utilisés / **39G libres** (50 %) | 40G utilisés / **37G libres** (53 %) |
| `free -h` | 2,6Gi used — **1,2Gi available** ; swap 2,0/4,0Gi | 2,3Gi used — **1,4Gi available** ; swap 2,4/4,0Gi |
| `docker system df` | Images 15,94 Go — cache 9,46 Go (1,84 récup.) | Images 15,92 Go — **cache 11,93 Go (3,7 récup.)** |

Le `--no-cache` a fait regrimper le build cache (~+2,5 Go) ; 37 Go restent libres. Consommation TeamHub : ~440 Mo de RAM (api 118, data 79, web 75, realtime 42, DBs ~130). Aucun service unhealthy, aucun crash loop ; scan des logs sans erreur applicative (seule une ligne informative MongoDB contient le mot « error »).

---

## 6. Recommandations restantes

1. **Pest/CI** : `docker compose exec api ./vendor/bin/pest` ne fonctionnera pas tant que l'image prod est en `--no-dev`. Prévoir un stage/cible de build de test (ou `composer install` dans la CI) et corriger le prompt/runbook qui affirme le contraire.
2. **Attachement réseau Caddy** : toujours runtime (`docker network connect`), donc **perdu si `epitnet-caddy-1` est recréé** (→ 502 sur TeamHub). Le snippet le documente ; le correctif durable est côté EPINET (`networks: teamhub_default: external: true` + `services.caddy.networks`), hors périmètre de cette mission.
3. **Warnings Pest `.env`** : fournir un `.env` minimal au conteneur de test (ou ignorer) pour supprimer le bruit `file_get_contents(/app/.env)`.
4. **Build cache** : ~11,9 Go (3,7 récupérables) ; les `prune` restent à 0B tant que BuildKit marque les entrées « in use ». Surveiller le disque (37 Go libres).
5. **Swap** : 2,4/4,0 Go utilisés — correct mais à surveiller ; la stack reste légère.
6. **Sécurité** : `/api/internal/*` bloqué (404) au niveau Caddy ; secrets inchangés depuis la session 1, jamais affichés. Aucun autre projet touché.

## 7. Fichiers/système modifiés cette session

- `~/teamhub` : simple `git pull` (aucun fichier de code modifié).
- `~/teamhub/DEPLOY_REPORT.md` : **seul fichier créé/écrit** (ce rapport).
- `epitnet-caddy-1` : `caddy reload` à chaud uniquement (pas de modification du Caddyfile, pas de restart).
- Images jetables `teamhub-api-test:latest` et log local `/tmp/teamhub-retest-*.log` (hors dépôt).
- Aucun autre projet serveur touché (Contravo, waaloge, mecano, epitnet×5, n8n intacts).
