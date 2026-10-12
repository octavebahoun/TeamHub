# Prompt — Agent IA de déploiement TeamHub (serveur AWS Octave)

À coller tel quel dans une session d'agent IA (Claude Code, Cursor, etc.) qui tourne **sur le serveur AWS** (`ip-172-26-9-140`, Ubuntu 24.04). L'agent dispose d'un shell, de Docker, Git, et de l'accès sudo.

---

## Contexte serveur (déjà en place)

- 10 conteneurs tournent déjà (Contravo, waaloge, mecano, epitnet×5, n8n). **Ne pas y toucher**.
- Un **Caddy existant** gère déjà 80/443 : conteneur `epitnet-caddy-1`, Caddyfile dans `~/EPINET/infra/caddy/Caddyfile`. Pattern utilisé : chaque site = un bloc avec `reverse_proxy host.docker.internal:PORT` ou `reverse_proxy nom_conteneur:PORT`.
- Serveur : **3.7 Go RAM**, 4 Go swap, disque à 78% d'usage. **Nettoyer d'abord** le build cache Docker.
- DNS `teamhub.excellenceteam.site` → IP du serveur. Certificat TLS auto par le Caddy existant.

Repo : https://github.com/octavebahoun/TeamHub
Branche source : `claude/affectionate-fermi-hskazy`

## Règles non négociables

- **Ne touche à aucun autre projet** (`~/EPINET/`, Contravo, etc.) sauf le Caddyfile — avec backup préalable.
- **Ne modifie aucun fichier du repo TeamHub** sauf `DEPLOY_REPORT.md`.
- **Ne pousse jamais sur `main` ni sur `claude/affectionate-fermi-hskazy`**.
- **Ne crée pas de Pull Request** — Octave la créera après relecture.
- Si un problème bloque, documente-le dans le rapport et push quand même.

## Étape 0 — Hygiène disque (OBLIGATOIRE)

Le build cache Docker fait ~37 Go dont ~28 Go récupérables.

```bash
docker system df
docker builder prune -af
df -h /
```

Si après ça il reste moins de 5 Go libres sur `/`, **arrête-toi** et documente le disque plein dans le rapport.

## Étape 1 — Clone et secrets

```bash
cd ~
git clone -b claude/affectionate-fermi-hskazy https://github.com/octavebahoun/teamhub.git
cd teamhub

cp .env.example .env
INTERNAL_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/=+' | cut -c1-24)
sed -i "s|^INTERNAL_SECRET=.*|INTERNAL_SECRET=${INTERNAL_SECRET}|" .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
sed -i "s|^DOMAIN=.*|DOMAIN=teamhub.excellenceteam.site|" .env

# APP_KEY Laravel (1 fois) — attention: APP_KEY est required, il faut
# en passer un placeholder le temps de générer, puis l'écraser.
APP_KEY=base64:placeholder docker compose build api
APP_KEY=base64:placeholder docker compose run --rm --no-deps --entrypoint php api artisan key:generate --show > /tmp/appkey.txt
APP_KEY=$(cat /tmp/appkey.txt | tr -d '\n')
sed -i "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" .env
```

## Étape 2 — Build et démarrage

Les services bindent sur `127.0.0.1:PORT` (jamais `0.0.0.0`) : rien n'est exposé publiquement avant que le Caddy existant ne proxy. Ports utilisés : `3100` (web), `8100` (api), `4100` (realtime).

```bash
docker compose build 2>&1 | tee /tmp/teamhub-build.log
docker compose up -d
sleep 45  # laisser healthchecks + migrations tourner
docker compose ps
```

Si un service reste `unhealthy` ou en boucle de restart :

```bash
docker compose logs --tail 100 <service>
```

Documente dans le rapport et continue si possible.

## Étape 3 — Ajouter le bloc dans le Caddy existant

Le fichier `infra/Caddyfile.snippet` du repo contient exactement le bloc à insérer. Les conteneurs TeamHub utilisent le réseau nommé `teamhub_default` (déclaré dans `docker-compose.yml`), le Caddy externe doit s'y connecter pour résoudre `teamhub-api-1`, `teamhub-realtime-1`, `teamhub-web-1`.

```bash
# 1) Connecter le Caddy externe au réseau TeamHub (une seule fois).
#    Attention: lost on container recreation — ajouter aussi dans le
#    docker-compose EPINET (networks: teamhub_default: external: true).
docker network connect teamhub_default epitnet-caddy-1 2>/dev/null || true

# 2) Backup OBLIGATOIRE avant toute modification
sudo cp ~/EPINET/infra/caddy/Caddyfile ~/EPINET/infra/caddy/Caddyfile.bak-$(date +%s)

# 3) Vérifier que teamhub n'est pas déjà présent
grep -q "teamhub.excellenceteam.site" ~/EPINET/infra/caddy/Caddyfile && echo "DEJA_PRESENT" || echo "ABSENT"

# 4) Append le bloc — JAMAIS `sed -i` (remplace l'inode, bind-mount périmé).
#    Utiliser `tee -a` qui écrit sur place.
cat ~/teamhub/infra/Caddyfile.snippet | sudo tee -a ~/EPINET/infra/caddy/Caddyfile >/dev/null

# 5) Valider la syntaxe AVANT reload (sinon Caddy refuse et garde l'ancienne config)
docker exec epitnet-caddy-1 caddy validate --config /etc/caddy/Caddyfile

# 6) Reload à chaud (ne coupe pas les sites existants)
docker exec epitnet-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

Si `caddy validate` échoue : **restaurer le backup**, documenter l'erreur, ne pas reload.

```bash
sudo cp ~/EPINET/infra/caddy/Caddyfile.bak-* ~/EPINET/infra/caddy/Caddyfile  # dernier backup
```

## Étape 4 — Tests fonctionnels bout en bout

```bash
BASE="https://teamhub.excellenceteam.site"

# 4.1 Health checks — /api/up est désormais une route Laravel dédiée
curl -sf $BASE/api/up | grep -q '"ok":true' && echo "[OK] API up" || echo "[FAIL] API up"
curl -sfI $BASE/ > /dev/null && echo "[OK] Web up" || echo "[FAIL] Web up"

# 4.2 Vérifier que /api/internal/* est bien bloqué (doit renvoyer 404)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/internal/verify)
[ "$STATUS" = "404" ] && echo "[OK] /api/internal bloqué" || echo "[FAIL] /api/internal expose (status=$STATUS)"

# 4.3 Register
REG=$(curl -sf -X POST $BASE/api/v1/auth/register \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"AgentTest","email":"agent+'"$(date +%s)"'@test.local","password":"password123","organization_name":"AgentOrg"}')
TOKEN=$(echo "$REG" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
[ -n "$TOKEN" ] && echo "[OK] Register + token" || echo "[FAIL] Register"

# 4.4 /me
curl -sf $BASE/api/v1/me -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 200

# 4.5 Projet + tâche
PID=$(curl -sf -X POST $BASE/api/v1/projects -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"AgentProject"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
[ -n "$PID" ] && echo "[OK] Projet id=$PID" || echo "[FAIL] Projet"

curl -sf -X POST $BASE/api/v1/projects/$PID/tasks -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"title":"Tache agent","priority":"high"}' > /dev/null && echo "[OK] Tâche"

# 4.6 CRM — won doit auto-créer un projet
CID=$(curl -sf -X POST $BASE/api/v1/clients -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"Client Agent","email":"c@agent.test"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
OID=$(curl -sf -X POST $BASE/api/v1/opportunities -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"client_id\":$CID,\"title\":\"Deal\",\"amount\":1000}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
curl -sf -X PATCH $BASE/api/v1/opportunities/$OID -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"stage":"won"}' | grep -q '"project_id":' && echo "[OK] won → projet auto" || echo "[FAIL] auto-projet"

# 4.7 Social
curl -sf -X POST $BASE/api/v1/posts -H "Authorization: Bearer $TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"body":"Hello"}' > /dev/null && echo "[OK] Post"

# 4.8 Analytics
curl -sf $BASE/api/v1/analytics/overview -H "Authorization: Bearer $TOKEN" -H 'Accept: application/json' | head -c 200

# 4.9 Socket.io handshake WSS
cd /tmp && npm init -y > /dev/null && npm install socket.io-client > /dev/null 2>&1
cat > /tmp/sock.mjs <<EOF
import { io } from '/tmp/node_modules/socket.io-client/build/esm/index.js';
const s = io('$BASE', { auth: { token: '$TOKEN' }, path: '/socket.io', transports: ['websocket'], reconnection: false });
s.on('connect', () => { console.log('[OK] WSS handshake'); s.disconnect(); process.exit(0); });
s.on('connect_error', e => { console.log('[FAIL] WSS:', e.message); process.exit(1); });
setTimeout(() => { console.log('[FAIL] WSS timeout'); process.exit(2); }, 8000);
EOF
node /tmp/sock.mjs

# 4.10 Pest tests dans le container api
docker compose -f ~/teamhub/docker-compose.yml exec -T api ./vendor/bin/pest --colors=never 2>&1 | tail -5
```

## Étape 5 — Rapport

Rédige `~/teamhub/DEPLOY_REPORT.md` avec :

- Date, commit testé (`git -C ~/teamhub rev-parse HEAD`), uname -a, docker version
- Avant/après : `df -h /` et `free -h`
- Résultat de chaque test [OK/FAIL] avec contexte
- Logs des services en échec (10 dernières lignes)
- Blocs ajoutés au Caddyfile (chemin du backup créé)
- Verdict : PROD-READY / ATTENTION / KO
- Recommandations

## Étape 6 — Push sur une nouvelle branche

```bash
cd ~/teamhub
git checkout -b agent/deploy-verification-$(date +%Y%m%d-%H%M)
git add DEPLOY_REPORT.md
git commit -m "chore(deploy): rapport de vérification agent IA"
git push -u origin HEAD
```

## En cas de blocage

Documente précisément :
- Port 80/443 : si quelque chose d'autre que `epitnet-caddy-1` tient ces ports, STOP et rapporte
- Build OOM : réduis `docker compose build` à `--parallel 1` et relance
- Caddy validate failed : restaure le backup, ne reload pas, documente l'erreur
- Service en crash loop : logs dans le rapport, puis `docker compose stop <service>` pour libérer la RAM

Un rapport d'échec vaut mieux que pas de rapport.
