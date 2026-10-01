# Prompt — Agent IA, re-vérification TeamHub après correctifs

Sessions précédente : `agent/deploy-verification-20261001-0031`. La pile est **déjà en ligne** sur `https://teamhub.excellenceteam.site` mais la branche `claude/affectionate-fermi-hskazy` a été mise à jour avec 11 fichiers modifiés qui corrigent :

- 3 bugs code (web/public manquant, psycopg absent du venv data, /api/up 404)
- Infra Caddy (réseau `teamhub_default` nommé, upstreams par noms de conteneurs)
- 1 durcissement prod (RealtimePublisher ne crashe plus si Redis down)
- Alignement complet des permissions sur le doc "Parcours par rôle" (owner/admin/manager/member/guest)
- 7 nouveaux tests Pest de rôles (22 au total)

**Ta mission** : pull, rebuild, redéployer, re-tester tout, documenter.

## Règles non négociables (identiques au prompt précédent)

- Ne touche à aucun autre projet du serveur sauf le Caddyfile (avec backup).
- Ne modifie aucun fichier du repo TeamHub sauf `DEPLOY_REPORT.md`.
- Ne pousse jamais sur `main` ni sur `claude/affectionate-fermi-hskazy`.
- Ne crée pas de PR.
- Documente échecs et contournements précis.

## Étape 1 — Pull et rebuild

```bash
cd ~/teamhub
git fetch origin
git checkout claude/affectionate-fermi-hskazy
git pull origin claude/affectionate-fermi-hskazy
git log -1 --oneline  # noter le nouveau commit

# Nettoyer le cache + rebuilder tout
docker compose down       # garde les volumes (DB)
docker compose build --no-cache
docker compose up -d
sleep 45
docker compose ps
```

Si un service est `unhealthy` ou en restart loop, logs → rapport.

## Étape 2 — Attacher le Caddy au réseau TeamHub (si pas déjà fait)

Le nouveau `docker-compose.yml` nomme explicitement le réseau `teamhub_default`. Si tu avais déjà connecté `epitnet-caddy-1` à l'ancien réseau, re-vérifier :

```bash
docker network inspect teamhub_default --format '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep -q epitnet-caddy-1 \
  && echo "[OK] Caddy déjà sur le réseau" \
  || docker network connect teamhub_default epitnet-caddy-1
```

Le `Caddyfile.snippet` utilise maintenant les **noms de conteneurs** (`teamhub-api-1`, etc.) au lieu de `host.docker.internal`. Si le bloc TeamHub dans `~/EPINET/infra/caddy/Caddyfile` utilise encore `host.docker.internal:XXXX`, le remplacer par le snippet à jour :

```bash
# Backup
sudo cp ~/EPINET/infra/caddy/Caddyfile ~/EPINET/infra/caddy/Caddyfile.bak-$(date +%s)

# Retirer l'ancien bloc teamhub puis réappendre (sans sed -i qui casse le bind-mount)
sudo awk '/^teamhub\.excellenceteam\.site \{/,/^\}/ {next} {print}' ~/EPINET/infra/caddy/Caddyfile > /tmp/caddyfile.new
sudo cp /tmp/caddyfile.new ~/EPINET/infra/caddy/Caddyfile
cat ~/teamhub/infra/Caddyfile.snippet | sudo tee -a ~/EPINET/infra/caddy/Caddyfile >/dev/null

docker exec epitnet-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec epitnet-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

## Étape 3 — Re-tester tous les flux + les nouveaux rôles

```bash
BASE="https://teamhub.excellenceteam.site"

echo "=== Flux existants ==="

# 3.1 Health /api/up (route Laravel désormais existante)
curl -sf $BASE/api/up | grep -q '"ok":true' && echo "[OK] /api/up" || echo "[FAIL] /api/up"

# 3.2 /api/internal/* bloqué
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/internal/verify)
[ "$STATUS" = "404" ] && echo "[OK] /api/internal bloqué" || echo "[FAIL] internal exposé ($STATUS)"

# 3.3 Register owner
OWNER_EMAIL="owner+$(date +%s)@test.local"
REG=$(curl -sf -X POST $BASE/api/v1/auth/register \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"name\":\"Owner\",\"email\":\"$OWNER_EMAIL\",\"password\":\"password123\",\"organization_name\":\"RetestOrg\"}")
OWNER_TOKEN=$(echo "$REG" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")
ORG_ID=$(echo "$REG" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).organization.id")
[ -n "$OWNER_TOKEN" ] && echo "[OK] Register owner (org=$ORG_ID)" || echo "[FAIL] Register"

# 3.4 Projet + tâche + CRM (owner)
PID=$(curl -sf -X POST $BASE/api/v1/projects -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"ProjetRetest"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
[ -n "$PID" ] && echo "[OK] Projet $PID" || echo "[FAIL] Projet"

curl -sf -X POST $BASE/api/v1/projects/$PID/tasks -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"title":"Retest tâche"}' > /dev/null && echo "[OK] Tâche"

CID=$(curl -sf -X POST $BASE/api/v1/clients -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"Client Retest"}' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
OID=$(curl -sf -X POST $BASE/api/v1/opportunities -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"client_id\":$CID,\"title\":\"Deal\",\"amount\":2000}" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).id")
curl -sf -X PATCH $BASE/api/v1/opportunities/$OID -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"stage":"won"}' | grep -q '"project_id":' && echo "[OK] won → projet auto" || echo "[FAIL]"

# 3.5 Post + analytics
curl -sf -X POST $BASE/api/v1/posts -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"body":"Hello"}' > /dev/null && echo "[OK] Post"

curl -sf $BASE/api/v1/analytics/overview -H "Authorization: Bearer $OWNER_TOKEN" -H 'Accept: application/json' | head -c 200
echo ""

echo "=== Nouveaux endpoints rôles ==="

# 3.6 GET /members
MC=$(curl -sf $BASE/api/v1/members -H "Authorization: Bearer $OWNER_TOKEN" -H 'Accept: application/json' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).length")
[ "$MC" = "1" ] && echo "[OK] /members ($MC membre)" || echo "[FAIL] /members ($MC)"

# 3.7 Créer un membre via invitation + accept
MEMBER_EMAIL="member+$(date +%s)@test.local"
INV=$(curl -sf -X POST $BASE/api/v1/invitations -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"email\":\"$MEMBER_EMAIL\",\"role\":\"member\"}")
INV_TOKEN=$(echo "$INV" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# Register le membre (le compte doit matcher l'email d'invite)
MREG=$(curl -sf -X POST $BASE/api/v1/auth/register \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"name\":\"Mbr\",\"email\":\"$MEMBER_EMAIL\",\"password\":\"password123\",\"organization_name\":\"TempOrgMbr\"}")
MEMBER_TOKEN=$(echo "$MREG" | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

# Accept invitation
curl -sf -X POST $BASE/api/v1/invitations/$INV_TOKEN/accept \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Accept: application/json' > /dev/null && echo "[OK] Invitation acceptée"

# Switch sur l'org
curl -sf -X POST $BASE/api/v1/organizations/$ORG_ID/switch \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Accept: application/json' > /dev/null

# 3.8 Membre doit être REFUSÉ sur CRM et Analytics
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/v1/clients \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H "X-Organization-Id: $ORG_ID" -H 'Accept: application/json')
[ "$STATUS" = "403" ] && echo "[OK] Membre CRM 403" || echo "[FAIL] Membre CRM = $STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/v1/analytics/overview \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H "X-Organization-Id: $ORG_ID" -H 'Accept: application/json')
[ "$STATUS" = "403" ] && echo "[OK] Membre Analytics 403" || echo "[FAIL] Membre Analytics = $STATUS"

# 3.9 Membre voit sa liste projets vide (pas encore ajouté)
PCOUNT=$(curl -sf $BASE/api/v1/projects \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H "X-Organization-Id: $ORG_ID" -H 'Accept: application/json' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.length")
[ "$PCOUNT" = "0" ] && echo "[OK] Membre: 0 projet (non ajouté)" || echo "[FAIL] Membre voit $PCOUNT projet(s)"

# 3.10 Owner ajoute le membre au projet
MEMBER_ID=$(curl -sf $BASE/api/v1/me -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Accept: application/json' | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).user.id")
curl -sf -X POST $BASE/api/v1/projects/$PID/members \
  -H "Authorization: Bearer $OWNER_TOKEN" -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"user_id\":$MEMBER_ID}" > /dev/null && echo "[OK] Membre ajouté au projet"

# 3.11 Membre voit maintenant le projet
PCOUNT=$(curl -sf $BASE/api/v1/projects \
  -H "Authorization: Bearer $MEMBER_TOKEN" -H "X-Organization-Id: $ORG_ID" -H 'Accept: application/json' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.length")
[ "$PCOUNT" = "1" ] && echo "[OK] Membre voit son projet partagé" || echo "[FAIL] Membre voit $PCOUNT projet(s)"

echo "=== WebSocket + Pest ==="

# 3.12 WSS
cd /tmp && [ -d node_modules ] || (npm init -y > /dev/null && npm install socket.io-client > /dev/null 2>&1)
cat > /tmp/sock.mjs <<EOF
import { io } from '/tmp/node_modules/socket.io-client/build/esm/index.js';
const s = io('$BASE', { auth: { token: '$OWNER_TOKEN' }, path: '/socket.io', transports: ['websocket'], reconnection: false });
s.on('connect', () => { console.log('[OK] WSS handshake'); s.disconnect(); process.exit(0); });
s.on('connect_error', e => { console.log('[FAIL] WSS:', e.message); process.exit(1); });
setTimeout(() => { console.log('[FAIL] WSS timeout'); process.exit(2); }, 8000);
EOF
node /tmp/sock.mjs

# 3.13 Pest dans le container (tests/ est maintenant inclus dans l'image)
docker compose exec -T api ./vendor/bin/pest --colors=never 2>&1 | tail -5
```

## Étape 4 — Rapport

Rédige `~/teamhub/DEPLOY_REPORT.md` **en remplaçant l'ancien**, avec :

- Commit testé (`git rev-parse HEAD`)
- Status de chaque test [OK/FAIL]
- Comparaison avec le rapport précédent (ce qui est corrigé, ce qui reste KO)
- RAM/disque avant/après
- Verdict : PROD-READY / ATTENTION / KO
- Recommandations restantes

## Étape 5 — Push

```bash
cd ~/teamhub
git checkout -b agent/retest-$(date +%Y%m%d-%H%M)
git add DEPLOY_REPORT.md
git commit -m "chore(deploy): re-test après correctifs role-policies-fix"
git push -u origin HEAD
```

En cas d'échec sur quoi que ce soit : documenter précisément, push le rapport, STOP.
