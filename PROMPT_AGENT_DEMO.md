# Prompt — Agent IA : redéploiement + organisation de démo TeamHub

À coller tel quel dans une session d'agent IA (Claude Code ou équivalent) qui tourne **sur le serveur AWS**
(`ip-172-26-9-140`, Ubuntu 24.04) avec shell, Docker, Git et sudo.

---

## Contexte

TeamHub tourne déjà sur `https://teamhub.excellenceteam.site` (pile Docker dans `~/teamhub`, Caddy externe
`epitnet-caddy-1` attaché au réseau `teamhub_default`). La branche `claude/affectionate-fermi-hskazy` a
beaucoup évolué depuis le dernier déploiement :

- **Frontend complet** (Next.js 16) : Accueil, Projets, Kanban, Chat, Social, Analytics, CRM, Membres, Profil, landing page.
- **API** : 4 nouvelles migrations (invitations, profil, activités CRM, adresse client), nouveaux endpoints.
- **Realtime** : le WebSocket s'authentifie par le cookie httpOnly `wine_token` ; nouveaux événements `channel:list`, `channel:history`, `channel:direct`.
- **Démo** : `DemoSeeder` (organisation fictive « Studio Lagune ») + `demo:chat` / `scripts/seed-demo-chat.mjs` (chat MongoDB) + `demo:purge`. Guide : `docs/DEMO.md`.

**Ta mission** : sauvegarder, redéployer, créer l'organisation de démo, vérifier qu'elle est filmable de bout en bout,
puis pousser un rapport. Le script de chat n'a **jamais été exécuté sur un vrai MongoDB** : sa validation est le point clé.

## Règles non négociables

- Ne touche à **aucun autre projet** du serveur (Contravo, waaloge, mecano, epitnet, n8n…). Caddyfile : seulement `caddy reload` si besoin.
- Ne modifie **aucun fichier suivi** du dépôt TeamHub, sauf `DEPLOY_REPORT.md`.
- Ne supprime **aucune donnée** existante en base (comptes et organisations déjà présents restent). Seule l'organisation de démo est (re)créée.
- **Aucun secret dans le rapport ni dans git** : ni mot de passe de démo, ni jeton, ni lien d'invitation. Indique seulement où ils sont stockés.
- Ne pousse jamais sur `main` ni sur `claude/affectionate-fermi-hskazy`. Pas de Pull Request.
- La connexion est limitée à **5 tentatives par minute** par IP : espace les logins (≥ 13 s entre deux).
- En cas de blocage : documente précisément, pousse le rapport quand même, arrête-toi.

## Étape 0 — État et hygiène

```bash
cd ~/teamhub
df -h / && free -h && docker compose ps
git -C ~/teamhub rev-parse --short HEAD   # commit actuellement déployé
```

Si moins de 6 Go libres sur `/` : `docker builder prune -f` puis revérifier. Toujours moins de 6 Go → arrête et documente.

## Étape 1 — Sauvegarde avant migration (obligatoire)

```bash
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U teamhub teamhub > ~/backups/teamhub-pg-$(date +%F-%H%M).sql
docker compose exec -T mongo mongodump --db teamhub --archive --gzip > ~/backups/teamhub-mongo-$(date +%F-%H%M).gz
ls -lh ~/backups/
```

Le dump Postgres doit faire plus de 0 octet, sinon arrête.

## Étape 2 — Mise à jour du code et build

```bash
git fetch origin
git checkout claude/affectionate-fermi-hskazy
git pull origin claude/affectionate-fermi-hskazy
git log --oneline -1
```

La RAM est limitée (≈ 1,5 Go disponible) : **build un service à la fois**, les conteneurs actuels continuent de tourner pendant ce temps.

```bash
for s in api realtime data web; do
  docker compose build "$s" 2>&1 | tail -5 || { echo "BUILD FAILED: $s"; break; }
done
```

Si un build échoue : **ne lance pas `up`** (l'ancienne version reste en ligne), documente l'erreur (30 dernières lignes) et arrête.

## Étape 3 — Redémarrage

```bash
docker compose up -d
sleep 45
docker compose ps
docker compose logs --tail 30 api | grep -iE "migrat|error" || true
docker exec epitnet-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

Attendu : 7 conteneurs `Up`, `api` healthy, les 4 migrations `2026_10_01_09xxxx` appliquées.

## Étape 4 — Tests automatisés (image de test)

```bash
docker build --target test -t teamhub-api-test apps/api/
docker run --rm --network teamhub_default \
  -e APP_KEY="$(grep ^APP_KEY .env | cut -d= -f2-)" \
  -e INTERNAL_SECRET="$(grep ^INTERNAL_SECRET .env | cut -d= -f2-)" \
  teamhub-api-test 2>&1 | tail -5
```

Attendu : **53 tests, 0 échec**.

## Étape 5 — Création de la démo

Le mot de passe de démo est généré ici et stocké **hors du dépôt** :

```bash
openssl rand -base64 18 | tr -d '/+=' | cut -c1-16 > ~/.teamhub-demo-password && chmod 600 ~/.teamhub-demo-password

# 5.1 Base de données (sortie complète conservée hors dépôt : comptes + lien d'invitation)
docker compose exec -T -e DEMO_PASSWORD="$(cat ~/.teamhub-demo-password)" api \
  php artisan db:seed --class=DemoSeeder --force > ~/.teamhub-demo-seed.txt 2>&1
chmod 600 ~/.teamhub-demo-seed.txt
grep -E "Organisation|Rôle" ~/.teamhub-demo-seed.txt   # n'affiche pas le mot de passe

# 5.2 Chat MongoDB
docker compose exec -T api php artisan demo:chat | docker compose exec -T realtime node scripts/seed-demo-chat.mjs
```

Attendu en 5.2 : `Chat de démo : 6 canaux, 21 messages (organisation N).`

Vérification directe dans MongoDB (remplace `N` par l'id affiché) :

```bash
docker compose exec -T mongo mongosh teamhub --quiet --eval '
  const org = N;
  print("channels", db.channels.countDocuments({organization_id: org}));
  print("messages", db.messages.countDocuments({organization_id: org}));
  print("general sans invité", db.channels.findOne({organization_id: org, name: "general"}).member_ids.length);'
```

Attendu : `channels 6`, `messages 21`, `general sans invité 7`.

**Réexécution** : relance 5.1 puis 5.2 une seconde fois et vérifie qu'il n'y a toujours qu'une seule organisation de démo
(`SELECT count(*) FROM organizations WHERE slug='demo-studio-lagune'` = 1) et 8 comptes `@studiolagune.test`.

## Étape 6 — Parcours de démo via l'API et le WebSocket

Écris un petit script Node dans `/tmp/demo-check/` (hors dépôt) qui, pour chaque compte ci-dessous, se connecte
(`POST https://teamhub.excellenceteam.site/api/v1/auth/login`, mot de passe lu dans `~/.teamhub-demo-password`,
**≥ 13 s entre deux logins**) puis vérifie :

| Compte | Vérifications attendues |
| --- | --- |
| `paul@studiolagune.test` (invité) | `GET /projects` → uniquement « Refonte du site Wari Market » ; `GET /posts` → 403 ; `GET /clients` → 403 |
| `mariam@studiolagune.test` (membre) | `GET /me/tasks` contient au moins une tâche ouverte **en retard**, une **du jour**, une **à venir** ; `/clients` et `/analytics/overview` → 403 |
| `fatou@studiolagune.test` (chef de projet) | `GET /clients` → exactement Hôtel Les Palmiers, Sika Bio, Wari Market ; `GET /opportunities` contient une étape `proposal` |
| `adjoa@studiolagune.test` (propriétaire) | `GET /analytics/overview` → `active_projects` = 3, `overdue_tasks` = 2 ; premier post de `GET /posts` épinglé |
| `rodrigue@studiolagune.test` (admin) | `POST /invitations` avec `role: admin` → **403** (ne crée aucune autre invitation) |

Ensuite, **chat via WebSocket authentifié par cookie** (sans `auth.token`) avec `socket.io-client` :

```js
io('https://teamhub.excellenceteam.site', {
  path: '/socket.io', transports: ['websocket'], reconnection: false,
  extraHeaders: { cookie: `wine_token=${encodeURIComponent(token)}; wine_org=${orgId}` },
});
// puis socket.emit('channel:list', (res) => …)
```

| Compte | Attendu sur `channel:list` |
| --- | --- |
| `mariam` | `ok: true`, au moins `general`, « Refonte du site Wari Market », « Application mobile Kpayo » et un canal direct avec Fatou dont `unread_count` ≥ 1 |
| `paul` | `ok: true`, **un seul canal** : « Refonte du site Wari Market » (ni general, ni direct) |

Puis `channel:history` sur le canal Wari (compte `paul`) → 5 messages en ordre chronologique.

Vérifie enfin dans un navigateur headless ou par `curl` : `GET /` (landing) = 200, `GET /connexion` = 200.

**Non-régression** : contravo, n8n, mecano, api.waaloge répondent toujours 200.

## Étape 7 — Laisser la démo prête

Relance une dernière fois 5.1 puis 5.2 pour que les dates soient fraîches. **Ne lance pas `demo:purge`.**

## Étape 8 — Rapport

Remplace `~/teamhub/DEPLOY_REPORT.md` par un rapport contenant :

- Commit déployé (avant → après), chemins des sauvegardes de l'étape 1
- Build par service, état des conteneurs, migrations appliquées
- Résultat Pest (étape 4)
- Seed : sortie de 5.1 **sans le mot de passe ni le lien d'invitation**, sortie de 5.2, comptages MongoDB, test de réexécution
- Tableau des vérifications de l'étape 6 [OK/FAIL] avec le détail de chaque écart
- Ressources avant/après (`df -h /`, `free -h`)
- Emplacement des secrets : `~/.teamhub-demo-password` et `~/.teamhub-demo-seed.txt` (chmod 600)
- Verdict : **PRÊT À FILMER** / ATTENTION / KO, et recommandations

## Étape 9 — Push

```bash
cd ~/teamhub
git status --short          # seul DEPLOY_REPORT.md doit apparaître
git checkout -b agent/demo-$(date +%Y%m%d-%H%M)
git add DEPLOY_REPORT.md
git commit -m "chore(deploy): redéploiement + organisation de démo Studio Lagune"
git push -u origin HEAD
```
