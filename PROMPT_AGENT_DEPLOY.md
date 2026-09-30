# Prompt — Agent IA de vérification déploiement TeamHub

À coller tel quel dans une session d'agent IA (Claude Code, Cursor, etc.) disposant d'un shell Linux + Docker + Git.

---

## Contexte

TeamHub est une plateforme SaaS (Laravel 12 + Node/Socket.io + FastAPI + Next.js 14) dockerisée en monorepo. Ton rôle : cloner le repo, démarrer la pile locale via Docker Compose, vérifier que tout démarre proprement, exécuter une batterie de tests fonctionnels de bout en bout, puis pousser un rapport sur une nouvelle branche.

Repo : https://github.com/octavebahoun/TeamHub
Branche source : `claude/affectionate-fermi-hskazy`

## Prérequis à vérifier au début

- Docker Engine ≥ 24 + `docker compose` v2
- `git`, `curl`, `openssl`, `node` (≥ 18), `jq` (recommandé)
- 4 Go de RAM libres, 10 Go de disque libres
- Port 80 libre en local (ou modifier le mapping)

Si un prérequis manque, l'installer si possible, sinon documenter l'échec et arrêter.

## Étape 1 — Clone et setup

```bash
git clone -b claude/affectionate-fermi-hskazy https://github.com/octavebahoun/teamhub.git
cd teamhub

# Générer les secrets
cp .env.example .env
INTERNAL_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/=+' | cut -c1-24)
sed -i "s|^INTERNAL_SECRET=.*|INTERNAL_SECRET=${INTERNAL_SECRET}|" .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
# Pour le test local, on utilise localhost sans TLS
sed -i "s|^DOMAIN=.*|DOMAIN=localhost|" .env

# APP_KEY (Laravel)
docker compose run --rm --no-deps api php artisan key:generate --show > /tmp/appkey.txt
APP_KEY=$(cat /tmp/appkey.txt | tr -d '\n')
sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
```

## Étape 2 — Build et démarrage

```bash
docker compose build 2>&1 | tee /tmp/build.log
docker compose up -d
sleep 40  # laisser les healthchecks passer + migrations tourner
docker compose ps
```

Si un service reste en `unhealthy` ou `restarting`, lire ses logs :

```bash
docker compose logs --tail 100 <service>
```

## Étape 3 — Tests fonctionnels bout en bout

Note : Caddy sert sur port 80. Adapter l'URL de base si le port est mappé différemment. Le domaine étant `localhost`, HTTPS n'est pas garanti — tester en `http://localhost` en local.

```bash
BASE="http://localhost"

# 3.1 Health checks
curl -sf $BASE/api/up > /dev/null && echo "[OK] API up" || echo "[FAIL] API up"
curl -sf $BASE/ > /dev/null && echo "[OK] Web up" || echo "[FAIL] Web up"

# 3.2 Register (crée user + organisation + jeton)
REG=$(curl -sf -X POST $BASE/api/v1/auth/register \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"AgentTest","email":"agent+'"$(date +%s)"'@test.local","password":"password123","organization_name":"AgentOrg"}')
echo "$REG" | head -c 300
TOKEN=$(echo "$REG" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
[ -n "$TOKEN" ] && echo "[OK] Register + token" || echo "[FAIL] Register"

# 3.3 GET /me (auth)
curl -sf $BASE/api/v1/me -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 200
echo ""

# 3.4 Créer un projet, une tâche, la lister
PID=$(curl -sf -X POST $BASE/api/v1/projects -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"AgentProject"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
[ -n "$PID" ] && echo "[OK] Projet créé id=$PID" || echo "[FAIL] Créer projet"

curl -sf -X POST $BASE/api/v1/projects/$PID/tasks -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"title":"Tache agent","priority":"high"}' > /dev/null && echo "[OK] Tâche créée"

curl -sf $BASE/api/v1/me/tasks -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 200
echo ""

# 3.5 CRM
CID=$(curl -sf -X POST $BASE/api/v1/clients -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"Client Agent","email":"c@agent.test"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")

OID=$(curl -sf -X POST $BASE/api/v1/opportunities -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"client_id\":$CID,\"title\":\"Deal agent\",\"amount\":1000}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")

WON=$(curl -sf -X PATCH $BASE/api/v1/opportunities/$OID -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"stage":"won"}')
echo "$WON" | grep -q '"project_id":' && echo "[OK] Opportunité gagnée → projet auto-créé" || echo "[FAIL] Auto-projet"

# 3.6 Social
curl -sf -X POST $BASE/api/v1/posts -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"body":"Hello team from agent"}' > /dev/null && echo "[OK] Post publié"

# 3.7 Analytics
curl -sf $BASE/api/v1/analytics/overview -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 200
echo ""

# 3.8 Socket.io — handshake auth
cd /tmp && npm init -y > /dev/null && npm install socket.io-client > /dev/null 2>&1
cat > /tmp/sock.mjs <<EOF
import { io } from '/tmp/node_modules/socket.io-client/build/esm/index.js';
const s = io('$BASE', { auth: { token: '$TOKEN' }, path: '/socket.io', transports: ['websocket'], reconnection: false });
s.on('connect', () => { console.log('[OK] Socket handshake'); s.disconnect(); process.exit(0); });
s.on('connect_error', e => { console.log('[FAIL] Socket:', e.message); process.exit(1); });
setTimeout(() => { console.log('[FAIL] Socket timeout'); process.exit(2); }, 8000);
EOF
node /tmp/sock.mjs

# 3.9 Pest tests dans le container api
docker compose exec -T api ./vendor/bin/pest --colors=never 2>&1 | tail -5
```

## Étape 4 — Rapport

Rédiger `DEPLOY_REPORT.md` à la racine du repo avec :

- Environnement (OS, versions Docker, git commit testé)
- Résultat de chaque test ci-dessus (OK / FAIL avec ligne d'erreur pertinente)
- Logs pertinents en cas d'échec (10 dernières lignes du service concerné)
- Métriques (temps de build, RAM et disque utilisés : `docker system df`)
- Recommandations si des soucis apparaissent

## Étape 5 — Push sur une nouvelle branche

```bash
git checkout -b agent/deploy-verification-$(date +%Y%m%d-%H%M)
git add DEPLOY_REPORT.md
git commit -m "chore(deploy): rapport de vérification par agent IA"
git push -u origin HEAD
```

## Règles importantes

- **Ne modifie AUCUN autre fichier** du repo : uniquement `DEPLOY_REPORT.md`. Si un fix est nécessaire, le documenter dans le rapport, ne pas le committer.
- **Ne crée pas de Pull Request** — Octave la créera après relecture.
- **Ne pousse jamais sur `main` ni sur `claude/affectionate-fermi-hskazy`**.
- **Nettoie après toi** : `docker compose down -v` à la fin si le test est destiné à être éphémère (le préciser dans le rapport).
- Si tu es bloqué (build échoue, healthcheck ne passe pas), documente-le précisément dans le rapport et push quand même — un rapport d'échec vaut mieux que pas de rapport.

## Format du rapport

```markdown
# Rapport de vérification déploiement TeamHub

**Date :** YYYY-MM-DD HH:MM UTC
**Commit testé :** <sha>
**Agent :** <nom/modèle>
**OS :** <uname -a>
**Docker :** <docker --version>

## Résumé

- Services démarrés : X / 8
- Tests fonctionnels : X / 9 réussis
- Verdict : PROD-READY / ATTENTION / KO

## Détail

### Build
- Temps : Xs
- Warnings : ...

### Healthchecks
- postgres : OK
- mongo : OK
- ...

### Tests fonctionnels
- [OK/FAIL] Register + login
- [OK/FAIL] Projet + tâche
- [OK/FAIL] CRM won → projet auto
- ...

### Pest (dans le container api)
- 13 passed, 0 failed

### Logs en cas d'échec

```
<logs>
```

## Recommandations

<Si applicable>
```
