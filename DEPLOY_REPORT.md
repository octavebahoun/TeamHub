# TeamHub — Validation du correctif « stage test Pest » (agent IA)

- **Date** : 2026-10-01 (UTC)
- **Commit validé** : `c4e4f681d3198562ad740a711eb228fdbebf00cf` — « fix(api): stage 'test' au Dockerfile pour Pest (recommandation agent) »
- **Serveur** : `ip-172-26-9-140` (Ubuntu 24.04) — Docker 29.7.2, Compose v5.5.0
- **URL** : https://teamhub.excellenceteam.site
- **Objet** : valider de bout en bout le correctif qui répond à la recommandation n°1 du rapport précédent (« Pest absent de l'image prod »).
- **Verdict** : **PROD-READY** — correctif fonctionnel, validé et déployé. Recommandation n°1 **résolue**.

---

## 1. Contenu du commit `c4e4f68`

- `apps/api/Dockerfile` : ajout d'un **stage `test`** (`FROM base AS test`) qui installe les *dev deps* (Pest/phpunit) et inclut `tests/`, avec `CMD ["./vendor/bin/pest", "--colors=never"]` ; le stage `runtime` (prod, `--no-dev`) reste le défaut.
- `docker-compose.yml` : le service `api` épingle explicitement `build.target: runtime` → l'image prod reste légère.
- `PROMPT_AGENT_RETEST.md` : commandes d'usage mises à jour.

---

## 2. Validation du stage `test`

```bash
docker build --target test -t teamhub-api-test:latest apps/api/   # BUILD_EXIT=0
# Pest 3.8.7 présent, 6 fichiers Feature + Unit
```

| Run | Commande | Résultat |
|-----|----------|----------|
| A — telle que documentée dans le commit | `docker run --rm --network teamhub_default -e APP_KEY=… -e INTERNAL_SECRET=… teamhub-api-test:latest` | **22 tests, 0 échec, 60 assertions — EXIT=0** |
| B — environnement « comme le service api » | idem + `-e APP_ENV=testing -e REDIS_URL=redis://redis:6379 -e REDIS_HOST=redis` | **22 tests, 0 échec, 60 assertions — EXIT=0** |

- Les 2 modes passent : la commande du commit fonctionne **sans variables supplémentaires**.
- Les 22 « warnings » restent uniquement `file_get_contents(/app/.env): Failed to open stream` (le conteneur de test n'a pas de `.env`) — bénin, déjà signalé.
- Durcissement `RealtimePublisher` toujours effectif (aucun échec Redis).

**Commande officielle désormais recommandée** (remplace le contournement `/tmp` des sessions précédentes) :
```bash
docker build --target test -t teamhub-api-test apps/api/
docker run --rm --network teamhub_default \
  -e APP_KEY=<clé> -e INTERNAL_SECRET=<secret> teamhub-api-test
```

---

## 3. Redéploiement du service api

```bash
docker compose config | grep target   # → target: runtime (1 occurrence, confirmé)
docker compose build api              # OK
docker compose up -d api              # recréé
docker exec epitnet-caddy-1 caddy reload --config /etc/caddy/Caddyfile   # nouvelle IP
```

- `teamhub-api-1` : **Up (healthy)** ; 7/7 conteneurs Up, aucun restart loop.
- `caddy reload` : 0 erreur (déjà en noms de conteneurs, aucun changement de Caddyfile).

### Smoke tests

| Test | Résultat |
|------|----------|
| `GET /api/up` → `{"ok":true,"service":"api"}` | **[OK]** |
| `GET /` (web) | **[OK]** 200 |
| `POST /api/internal/verify` | **[OK]** 404 |
| Register + création projet + `GET /members` | **[OK]** (projet id=5, 1 membre) |
| Non-régression contravo / n8n / mecano / api.waaloge | **[OK]** 200/200/200/200 |

---

## 4. Ressources

| | Valeur |
|---|---|
| `df -h /` | 41G utilisés / **37G libres** (53 %) |
| `free -h` | 2,3Gi used — **1,5Gi available** ; swap 2,4/4,0Gi |
| `docker system df` | cache build 12,13 Go (3,9 récupérables) |

Consommation TeamHub inchangée (~440 Mo RAM). Aucun service en échec.

---

## 5. Comparaison avec les rapports précédents

| Point | Statut |
|---|---|
| 3 bugs code (web/public, psycopg data, /api/up) | **Corrigés et vérifiés** (session précédente) |
| Permissions par rôle + 7 tests Pest | **Corrigés et vérifiés** (session précédente) |
| **Pest absent de l'image prod** (recommandation n°1) | **RÉSOLU par `c4e4f68` et validé ici** |
| Attachement réseau Caddy runtime | **Toujours ouvert** — perdu si `epitnet-caddy-1` est recréé (correctif côté EPINET, hors périmètre) |
| Warnings `.env` dans Pest | Toujours présents (bénins) |
| Build cache / swap | À surveiller (3,9 Go récupérables, swap 2,4/4 Go) |

---

## 6. Fichiers/système modifiés

- `~/teamhub/DEPLOY_REPORT.md` : **seul fichier créé/écrit** (ce rapport) — aucun fichier de code touché.
- Image `teamhub-api-test:latest` reconstruite depuis le **stage officiel** du Dockerfile (remplace l'image jetable `/tmp`).
- Image `teamhub-api:latest` reconstruite via `docker compose build api` (target runtime) et redéployée.
- `epitnet-caddy-1` : simple `caddy reload` à chaud (Caddyfile non modifié).
- Note de transparence : un fichier temporaire vide `apps/api/.build-marker` a été créé par erreur pendant la première commande de build, puis supprimé immédiatement ; il est absent de l'image finale et `git status` est propre.
- Aucun autre projet serveur touché (Contravo, waaloge, mecano, epitnet×5, n8n intacts).

## 7. Recommandations restantes

1. **Persistance réseau Caddy** (priorité) : `networks: teamhub_default: external: true` + attachement du service caddy côté EPINET, pour survivre à une recréation du conteneur Caddy.
2. Fournir un `.env` minimal (ou ignorer) dans le conteneur de test pour supprimer les warnings.
3. Surveiller disque/cache build (37 Go libres) et swap.
