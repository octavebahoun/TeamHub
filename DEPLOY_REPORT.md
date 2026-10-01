# TeamHub — Rapport de déploiement (agent IA)

- **Date** : 2026-10-01 (UTC)
- **Serveur hôte** : `ip-172-26-9-140` — `Linux ip-172-26-9-140 7.0.0-1011-aws #11~24.04.1-Ubuntu SMP PREEMPT Mon Aug 10 15:20:57 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux`
- **Docker** : `Docker version 29.7.2, build a7dcaa6` — `Docker Compose version v5.5.0`
- **Commit testé** : `8dfc3951d9eecce21028c79787e725cfc6460925` (branche `claude/affectionate-fermi-hskazy`)
- **URL** : https://teamhub.excellenceteam.site (DNS → `15.188.149.134`)
- **TLS** : certificat Let's Encrypt émis automatiquement par le Caddy existant (expire le 2026-12-29)
- **Verdict final** : **ATTENTION** — pile déployée et fonctionnelle de bout en bout, mais plusieurs correctifs sont nécessaires au niveau du dépôt pour qu'un redéploiement propre soit possible sans intervention manuelle.

---

## 0. Hygiène disque (Étape 0)

```
$ docker system df          # AVANT
Images          10   10   12.5GB    0B (0%)
Containers      10   10   78.18MB  0B (0%)
Local Volumes    7    7   629.3MB  0B (0%)
Build Cache     79   79   5.955GB  0B (0%)

$ docker builder prune -af   → Total: 0B
$ docker buildx prune -af    → Total: 0B
$ df -h /                    → 32G utilisés, 45G libres (42 %)
```

**Écart avec le brief** : le build cache réel faisait ~5,9 Go (et non ~37 Go / 28 Go récupérables), et **aucun** prune (`docker builder prune -af` ni `docker buildx prune -af`) n'a libéré d'espace : les entrées de cache sont marquées « in use » (USAGE=1) par BuildKit et considérées comme non récupérables (`Reclaimable: 0B`). Aucun build n'était pourtant en cours.
**Go/No-Go** : 45 Go libres > seuil de 5 Go → déploiement poursuivi.

### Avant / après déploiement

| | Avant | Après |
|---|---|---|
| `df -h /` | 32G utilisés / 45G libres (42 %) | **38G utilisés / 39G libres (50 %)** |
| `free -h` | 3,7Gi total — 2,4Gi used — 226Mi free — 1,4Gi buff/cache — **1,3Gi available** ; swap 2,2Gi/4,0Gi | 3,7Gi total — 2,3Gi used — 239Mi free — 1,6Gi buff/cache — **1,5Gi available** ; swap 2,3Gi/4,0Gi |
| `docker system df` | 10 images (12,5 Go) / 10 conteneurs / 7 volumes / cache 5,9 Go | 18 images (15,94 Go) / 17 conteneurs / 12 volumes / cache 9,46 Go (1,84 Go récupérables) |

Consommation RAM de la pile TeamHub (mesure `docker stats`) : api 118 Mo, data 79 Mo, web 75 Mo, realtime 42 Mo, mongo 83 Mo, postgres 39 Mo, redis 5 Mo ≈ **440 Mo au total**. Les 10 conteneurs préexistants sont intacts.

---

## 1. Clone et secrets (Étape 1)

- Clone OK : `git clone -b claude/affectionate-fermi-hskazy https://github.com/octavebahoun/teamhub.git ~/teamhub`
- `.env` créé depuis `.env.example` ; `INTERNAL_SECRET`, `POSTGRES_PASSWORD` et `DOMAIN` générés/renseignés.
- **Blocage rencontré (contourné)** : la commande du brief
  `docker compose run --rm --no-deps api php artisan key:generate --show`
  est **impossible telle quelle** : `docker-compose.yml` déclare `APP_KEY: "${APP_KEY:?...}"`, or `APP_KEY=` est vide dans `.env` → Docker Compose refuse toute commande (`required variable APP_KEY is missing a value`). De plus, l'entrypoint exécute `php artisan migrate --force` avant la commande, ce qui échoue sans base (`--no-deps`).
  - **Contournement** : `APP_KEY=base64:placeholder docker compose build api` puis
    `APP_KEY=base64:placeholder docker compose run --rm --no-deps --entrypoint php api artisan key:generate --show`, clé injectée ensuite dans `.env` via `sed`. Aucun fichier du dépôt modifié.

---

## 2. Build et démarrage (Étape 2)

### Build

- `docker compose build` → **échec initial sur `web`** :
  ```
  target web: failed to solve: failed to compute cache key:
  failed to calculate checksum ...: "/app/public": not found
  ```
  Cause : `apps/web/Dockerfile` fait `COPY --from=build /app/public ./public`, mais le dépôt ne contient **aucun répertoire `apps/web/public`**.
  - **Contournement** : création d'un répertoire vide `~/teamhub/apps/web/public` (non suivi par git, aucun fichier du dépôt modifié). `docker compose build web` → OK.
- Tous les autres services built OK (api, data, realtime).

### Démarrage

- `docker compose up -d` : postgres, mongo, redis, api, web, realtime OK ; **`data` en boucle de restart** :
  ```
  File "/app/app/db.py", line 6, in <module>
      engine = create_engine(config.database_url, pool_pre_ping=True)
  File ".../sqlalchemy/dialects/postgresql/psycopg.py", line 497, in import_dbapi
      import psycopg
  ModuleNotFoundError: No module named 'psycopg'
  ```
  Cause : `apps/data/Dockerfile` exécute `uv pip install --system "psycopg[binary]"` (Python système), mais `CMD` lance `uv run uvicorn ...` qui utilise le venv `/app/.venv` créé par `uv sync` — venv dans lequel `psycopg` est absent (et absent de `pyproject.toml`/`uv.lock`).
  - **Contournement sans modification du dépôt** : couche ajoutée à l'image :
    ```
    FROM teamhub-data:latest
    RUN uv pip install --python /app/.venv/bin/python "psycopg[binary]"
    ```
    buildée en `teamhub-data:latest`, puis `docker compose up -d --no-build data`. Le service démarre (« Application startup complete »).

### État final

```
teamhub-api-1        Up (healthy)   127.0.0.1:8100->80/tcp
teamhub-data-1       Up             8001/tcp
teamhub-mongo-1      Up (healthy)   27017/tcp
teamhub-postgres-1   Up (healthy)   5432/tcp
teamhub-realtime-1   Up             127.0.0.1:4100->4000/tcp
teamhub-redis-1      Up (healthy)   6379/tcp
teamhub-web-1        Up             127.0.0.1:3100->3000/tcp
```

---

## 3. Caddy (Étape 3)

- **Backup créé** : `~/EPINET/infra/caddy/Caddyfile.bak-1790814411` (1534 octets).
- `teamhub.excellenceteam.site` était absent du Caddyfile → append du `infra/Caddyfile.snippet`.
- `caddy validate` → `Valid configuration` ; `caddy reload` → OK.

### Problème 1 — 502 : `host.docker.internal` ne peut pas joindre des ports sur `127.0.0.1`

Le snippet fourni proxifie vers `host.docker.internal:8100/4100/3100`. Or `host.docker.internal` résout vers **172.17.0.1** (docker0) alors que les services TeamHub écoutent sur **127.0.0.1** : `connection refused` → 502.
Contravo/waaloge fonctionnent car ils écoutent sur `0.0.0.0`.

**Correctif appliqué (sans exposer les services)** :
1. `docker network connect teamhub_default epitnet-caddy-1` (connexion à chaud du Caddy existant au réseau du projet TeamHub) ;
2. Remplacement des 3 upstreams du bloc TeamHub par les noms de conteneurs.

### Problème 2 — `sed -i` casse le bind-mount du Caddyfile

Le Caddyfile est un **bind mount d'un fichier** (`/etc/caddy/Caddyfile`, ro). `sed -i` remplace le fichier par un **nouvel inode** : le conteneur continuait de lire l'ancien inode (config périmée). Un simple `reload` recharge alors l'ancien contenu.
**Correctif** : `docker restart epitnet-caddy-1` (≈ 5 s d'interruption, certificats conservés dans le volume `epitnet_caddy_data`) pour que Docker ré-résolve le bind sur le fichier courant. Le conteneur voit désormais la bonne configuration.
**À retenir** : ne jamais utiliser `sed -i` / éditeur qui renomme sur ce fichier ; préférer une écriture sur place (`tee`, `cp` sans `--remove-destination`).

### Bloc final ajouté (upstreams adaptés — le reste est identique au snippet)

```caddyfile
teamhub.excellenceteam.site {
	import secure_headers
	encode gzip zstd

	# Bloquer les routes internes — jamais exposées depuis Internet
	@internal path /api/internal/* /api/v1/internal/*
	handle @internal {
		respond "Not Found" 404
	}

	# API Laravel
	handle /api/* {
		reverse_proxy teamhub-api-1:80
	}

	# WebSocket temps réel
	handle /ws/* {
		reverse_proxy teamhub-realtime-1:4000
	}
	handle /socket.io/* {
		reverse_proxy teamhub-realtime-1:4000
	}

	# Frontend Next.js — tout le reste
	handle {
		reverse_proxy teamhub-web-1:3000
	}
}
```

**Non-régression vérifiée après reload/restart** : contravo 200, n8n 200, mecano 200, api.waaloge 200.

---

## 4. Tests fonctionnels bout en bout (Étape 4)

| # | Test | Résultat | Détail |
|---|------|----------|--------|
| 4.1a | `GET /api/up` | **[FAIL]** | 404 : le snippet Caddy route `/api/*` vers Laravel, mais le health Laravel est sur `/up` (et `/up` est routé vers Next.js). Incohérence du brief/snippet, **pas une panne service**. |
| 4.1b | `GET /` (web) | **[OK]** | 200 |
| 4.1c | `GET http://127.0.0.1:8100/up` | **[OK]** | 200 (health Laravel réel) |
| 4.2 | `POST /api/internal/verify` bloqué | **[OK]** | 404 renvoyé par Caddy (`@internal`) |
| 4.3 | Register + token | **[OK]** | 201, token Sanctum de 50 caractères |
| 4.4 | `GET /api/v1/me` | **[OK]** | user + organisation `AgentOrg` |
| 4.5 | Projet + tâche | **[OK]** | projet id=1 créé ; tâche 201 |
| 4.6 | CRM `stage=won` → projet auto | **[OK]** | `project_id` présent dans la réponse |
| 4.7 | Post social | **[OK]** | 201 |
| 4.8 | Analytics overview | **[OK]** | `{"active_projects":2,"overdue_tasks":0,...}` |
| 4.9 | Handshake WSS Socket.io | **[OK]** | `[OK] WSS handshake` via `wss://teamhub.excellenceteam.site/socket.io` |
| 4.10 | Pest | **[OK]** | 15 tests, 0 échec, 38 assertions (via image de test dédiée, voir ci-dessous) |

### Détails Pest (4.10)

`docker compose exec -T api ./vendor/bin/pest` est **impossible dans l'image de prod** : le `.dockerignore` de `apps/api` exclut `tests/`, et le build utilise `composer install --no-dev` (donc pas de Pest, pas de phpunit).
**Contournement sans modification du dépôt** : image jetable construite depuis `/tmp/teamhub-api-test` (`FROM teamhub-api:latest` + copie de `tests/` + `composer install` complet), exécutée sur le réseau `teamhub_default` avec `REDIS_URL=redis://redis:6379` et `APP_KEY`/`INTERNAL_SECRET` :

```
Tests:    15 warnings (38 assertions)   ← 0 échec
PEST_EXIT=0
```

- Les 15 « warnings » sont tous `file_get_contents(/app/.env): Failed to open stream` : le conteneur de test n'a pas de `.env` (le test passe quand même). Bénin dans ce harnais.
- Premier passage sans réseau Redis : 3 échecs `RedisException: Connection refused` dans `RealtimePublisher` — **dus à l'environnement de test** (pas de Redis joignable), résolus en attachant le conteneur de test au réseau du projet. Pas un défaut applicatif.
- `tests/Unit` n'existe pas dans le dépôt alors que `phpunit.xml` le référence (ajouté vide dans le contexte de test).

---

## 5. Logs des services en échec

### `data` (crash loop initial — corrigé)
```
data-1  |   File "/app/main.py", line 5, in <module>
data-1  |     from app.db import get_session
data-1  |   File "/app/app/db.py", line 6, in <module>
data-1  |     engine = create_engine(config.database_url, pool_pre_ping=True)
data-1  |              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
data-1  |   File "/app/.venv/.../sqlalchemy/engine/create.py", line 602, in create_engine
data-1  |     dbapi = dbapi_meth(**dbapi_args)
data-1  |   File "/app/.venv/.../sqlalchemy/dialects/postgresql/psycopg.py", line 497, in import_dbapi
data-1  |     import psycopg
data-1  | ModuleNotFoundError: No module named 'psycopg'
```

### `web` (échec de build — contourné)
```
 > [web runtime 4/7] COPY --from=build /app/public ./public:
Dockerfile:23
target web: failed to solve: failed to compute cache key:
failed to calculate checksum ...: "/app/public": not found
```

Aucun autre service en échec. Aucun `docker compose stop` nécessaire (la RAM est restée sous contrôle).

---

## 6. Fichiers/système modifiés (hors dépôt)

- `~/EPINET/infra/caddy/Caddyfile` : ajout du bloc TeamHub (3 upstreams adaptés) — backup `Caddyfile.bak-1790814411`.
- `epitnet-caddy-1` : `docker network connect teamhub_default` (persiste aux redémarrages du conteneur, **perdu si le conteneur est recréé**) ; `docker restart` pour re-résoudre le bind.
- `~/teamhub/.env` (gitignoré) : secrets générés.
- `~/teamhub/apps/web/public` : répertoire **vide** créé (invisible pour git) pour le build.
- Image `teamhub-data:latest` : couche locale ajoutant `psycopg[binary]` au venv (perdue si `docker compose build data` est relancé).
- Image jetable `teamhub-api-test:latest` (tests Pest).
- Aucun autre projet touché (Contravo, waaloge, mecano, epitnet×5, n8n intacts).

---

## 7. Verdict et recommandations

**Verdict : ATTENTION** — TeamHub est **en ligne et fonctionnel** (auth, projets, tâches, CRM avec auto-projet, social, analytics, WebSocket, tests Pest verts). Mais le dépôt contient 3 défauts qui cassent un déploiement propre « tel quel », et 2 adaptations d'infrastructure sont nécessaires.

### Correctifs code recommandés (à traiter dans la branche avant merge)
1. **`apps/web/Dockerfile`** : `COPY --from=build /app/public ./public` échoue car `apps/web/public` n'existe pas → supprimer la ligne ou versionner un `public/.gitkeep`.
2. **`apps/data`** : ajouter `psycopg[binary]` aux dépendances (`pyproject.toml` + `uv.lock`) OU corriger le Dockerfile en `uv pip install --python /app/.venv/bin/python "psycopg[binary]"`. `uv sync --frozen` + `uv run` ignorent l'install `--system`.
3. **Health check** : soit ajouter une route Laravel `/api/up`, soit router `/up` explicitement dans Caddy, soit corriger les tests/runbooks. Aujourd'hui `/api/up` = 404 et `/up` n'est pas exposé (routé vers Next.js).

### Points d'exploitation
4. **Caddy** : `host.docker.internal` est incompatible avec des services bindés sur `127.0.0.1` (il pointe vers `172.17.0.1`). La connexion runtime de Caddy au réseau `teamhub_default` **sera perdue si le conteneur Caddy est recréé** (ex. `docker compose up -d` côté EPINET) → site en 502. Solution durable recommandée : intégrer le réseau dans l'infra EPINET ou rebinder TeamHub sur l'IP docker0 (fichier compose/override versionné).
5. **Ne jamais éditer le Caddyfile bind-monté avec `sed -i`** (nouvel inode non vu par le conteneur) : utiliser une écriture sur place ; sinon `docker restart epitnet-caddy-1`.
6. **`.dockerignore` API** exclut `tests/` et l'image est `--no-dev` : prévoir une cible/image de test dédiée si l'exécution de Pest en prod est attendue. Ajouter aussi `tests/Unit` (référencé par `phpunit.xml`) ou retirer la suite.
7. **Disque** : cache Docker passé à ~9,5 Go (1,84 Go récupérables). Les prunes `-af` renvoient 0B à cause d'entrées BuildKit « in use » ; surveiller la croissance. 39 Go libres actuellement.
8. **RAM** : ~440 Mo pour TeamHub, 1,5 Go disponibles, swap 2,3/4 Go. Correct mais à surveiller si montée en charge (mongo à 56 % CPU ponctuel pendant la mesure).
9. **Sécurité** : secrets générés aléatoirement, jamais committés ni affichés dans ce rapport. `/api/internal/*` correctement bloqué au niveau Caddy (404) en plus du `INTERNAL_SECRET`.
