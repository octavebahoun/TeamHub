# TeamHub — Redéploiement + organisation de démo « Studio Lagune » (agent IA)

- **Date** : 2026-10-01 (UTC) — début 13:35, fin ~14:00
- **Serveur** : `ip-172-26-9-140` (Ubuntu 24.04) — Docker / Compose, Caddy externe `epitnet-caddy-1`
- **URL** : https://teamhub.excellenceteam.site
- **Périmètre** : redéploiement de `claude/affectionate-fermi-hskazy`, création de l'organisation de démo, vérification complète du parcours filmable (API + WebSocket).
- **Verdict** : **PRÊT À FILMER** — 21/21 vérifications du parcours OK, 53 tests Pest / 0 échec, démo fraîche en place (organisation id 11).

---

## 1. Commit déployé et sauvegardes

| | Valeur |
|---|---|
| HEAD au démarrage (conteneurs alors en ligne) | `c0ff99e` — « feat(landing): retire bloc preuves, aperçu Kanban… » (commit non ancêtre de la cible) |
| Pointeur de branche local avant pull | `66f33fb` |
| **Commit déployé après pull** | **`8948390`** — « docs(deploy): prompt agent — redéploiement + organisation de démo » (`claude/affectionate-fermi-hskazy`, fast-forward `66f33fb → 8948390`, 2 commits, 13 fichiers) |

Sauvegardes étape 1 (avant toute migration) :

| Fichier | Taille | MD5 |
|---|---|---|
| `~/backups/teamhub-pg-2026-10-01-1335.sql` | 59 Ko (> 0) | `6b0d6b2bac6e3610cda9901046f9d7e3` |
| `~/backups/teamhub-mongo-2026-10-01-1335.gz` | 750 o | `1e6ea9f719e54888f1a6a3368081e926` |

---

## 2. Build et redéploiement

Build un service à la fois (les conteneurs en ligne ont continué de tourner) :

| Service | Build | Image |
|---|---|---|
| api | OK | `teamhub-api:latest` |
| realtime | OK | `teamhub-realtime:latest` |
| data | OK | `teamhub-data:latest` |
| web | OK (~112 s) | `teamhub-web:latest` |

- `docker compose up -d` : api, realtime, web recréés. **`data` tournait encore sur une image plus ancienne** (non alignée par `up -d`) : recréé explicitement (`up -d --force-recreate data`), démarrage propre. Aucun code `apps/data` modifié par les 2 commits.
- **7/7 conteneurs `Up`**, `teamhub-api-1` **healthy**, aucun redémarrage en boucle.
- **Migrations** : les 4 migrations `2026_10_01_090000 → 090300` (invitations, profil utilisateur, activités CRM, adresse client) sont **appliquées** (batch 2, déjà présentes en base au moment du redéploiement) ; le conteneur neuf logue `INFO Nothing to migrate.` → aucune migration en attente.
- `docker exec epitnet-caddy-1 caddy reload --config /etc/caddy/Caddyfile` : **OK**, aucun Caddyfile modifié. Aucun autre projet touché (Contravo, waaloge, mecano, n8n intacts).

---

## 3. Tests automatisés (étape 4)

```
docker build --target test -t teamhub-api-test apps/api/
docker run --rm --network teamhub_default -e APP_KEY=… -e INTERNAL_SECRET=… teamhub-api-test
```

**Résultat : 53 tests, 245 assertions, 0 échec** (durée ~5,17 s).

- 53 warnings bénins, tous identiques : `file_get_contents(/app/.env): Failed to open stream` (phpdotenv dans l'image de test sans `.env`, suppression `@` neutralisée par PHPUnit). Aucune conséquence ; déjà signalé dans les rapports précédents.

---

## 4. Création de l'organisation de démo

### 4.1 Postgres — `DemoSeeder` (sortie assainie, mot de passe retiré)

```
INFO  Seeding database.
Organisation « Studio Lagune » créée (id 11).

| Rôle    | Nom              | E-mail                     | Mot de passe                          |
| owner   | Adjoa Mensah     | adjoa@studiolagune.test    | commun — cf. §7 (hors dépôt)          |
| admin   | Rodrigue Houngbo | rodrigue@studiolagune.test | commun — cf. §7                       |
| manager | Fatou Diallo     | fatou@studiolagune.test    | commun — cf. §7                       |
| manager | Kévin Agossou    | kevin@studiolagune.test    | commun — cf. §7                       |
| member  | Mariam Traoré    | mariam@studiolagune.test   | commun — cf. §7                       |
| member  | Serge Dossou     | serge@studiolagune.test    | commun — cf. §7                       |
| member  | Ibrahim Sow      | ibrahim@studiolagune.test  | commun — cf. §7                       |
| guest   | Paul Ahouansou   | paul@studiolagune.test     | commun — cf. §7                       |
```

Le détail complet (mot de passe + lien d'invitation invité à accepter à l'écran + 2 invitations : `awa.kone@…` membre, `gisele@hotel-lespalmiers.test` invité) est conservé **hors dépôt** dans `~/.teamhub-demo-seed-final.txt` (chmod 600). Le lien d'invitation n'apparaît nulle part dans ce rapport.

### 4.2 Chat MongoDB (`demo:chat` → `seed-demo-chat.mjs`) — première exécution réelle

```
Chat de démo : 6 canaux, 21 messages (organisation 11).
```

Vérification directe MongoDB (org 11) :

| Métrique | Attendu | Obtenu |
|---|---|---|
| `channels` | 6 | **6** |
| `messages` | 21 | **21** |
| `general` sans invité | 7 | **7** (Paul exclu) |

Aucune erreur Node/Mongoose : copie / lecture stdin / insertion brute des dates passées fonctionnent sur un vrai MongoDB.

### 4.3 Réexécution (idempotence)

Relance complète 5.1 + 5.2 une deuxième fois (celle-ci a créé l'org 10, avant la relance finale) :

- `SELECT count(*) FROM organizations WHERE slug='demo-studio-lagune'` → **1**
- comptes `@studiolagune.test` → **8**
- Chat recréé proprement pour le nouvel id : **6 canaux, 21 messages**, `general` = 7.
- Aucune invitation parasite après le test `POST /invitations role=admin` de Rodrigue → **403** (compté en base : 0 ligne `agent-check-invite@studiolagune.test`).

> Note : les canaux Mongo des organisations de démo précédentes (ids 9, 10) ne sont pas supprimés (la consigne interdit toute suppression de données). Ils sont invisibles des clients car toutes les requêtes realtime filtrent par `organization_id`. Total brut actuel : 19 canaux / 64 messages.

---

## 5. Parcours de démo vérifié (étape 6)

Script Node hors dépôt : `/tmp/demo-check/check.mjs` (+ `results.json`, `check-output-final.txt`). Logins espacés de **16 s** (limite 5/min/IP respectée). Exécuté deux fois : sur l'org 10 puis sur l'état final (org 11) — **21/21 OK les deux fois**. Tableau ci-dessous = run final.

### API

| Compte | Vérification | Statut | Détail |
|---|---|---|---|
| paul (invité) | `GET /projects` → uniquement Wari Market | **[OK]** | 1 projet : « Refonte du site Wari Market » |
| paul (invité) | `GET /posts` → 403 | **[OK]** | HTTP 403 |
| paul (invité) | `GET /clients` → 403 | **[OK]** | HTTP 403 |
| mariam (membre) | `/me/tasks` : ≥ 1 tâche ouverte en retard, 1 du jour, 1 à venir | **[OK]** | 4 tâches ouvertes : retard = vrai, aujourd'hui = vrai, à venir = vrai |
| mariam (membre) | `/clients` et `/analytics/overview` → 403 | **[OK]** | 403 / 403 |
| fatou (chef de projet) | `/clients` = Hôtel Les Palmiers, Sika Bio, Wari Market | **[OK]** | exactement ces 3 sociétés |
| fatou (chef de projet) | `/opportunities` contient `proposal` | **[OK]** | étapes = `["proposal","won","won"]` |
| adjoa (propriétaire) | `/analytics/overview` : `active_projects=3`, `overdue_tasks=2` | **[OK]** | 3 / 2 |
| adjoa (propriétaire) | premier post de `/posts` épinglé | **[OK]** | `pinned=true` |
| rodrigue (admin) | `POST /invitations {role: admin}` → 403, aucune invitation créée | **[OK]** | HTTP 403, 0 nouvelle invitation en base |

### WebSocket (cookie `wine_token` + `wine_org`, sans `auth.token`)

| Compte | Attendu | Statut | Détail |
|---|---|---|---|
| mariam | `ok:true`, general + Wari + Kpayo + direct Fatou `unread_count ≥ 1` | **[OK]** | canaux = `["Fatou Diallo","Application mobile Kpayo","Refonte du site Wari Market","general"]`, direct Fatou non lus = **1** |
| paul | `ok:true`, un seul canal Wari (ni general, ni direct) | **[OK]** | canaux = `["Refonte du site Wari Market"]` |
| paul | `channel:history` canal Wari → 5 messages chronologiques | **[OK]** | 5 messages, ordre chronologique = vrai |

**Écarts : aucun.** Les seuls « warnings » sont les 53 avertissements `.env` de Pest (§3).

### Pages publiques et non-régression

| Test | Résultat |
|---|---|
| `GET /` (landing) | **[OK]** 200 |
| `GET /connexion` | **[OK]** 200 |
| `GET /api/up` | **[OK]** 200 `{"ok":true,"service":"api"}` |
| https://contravo.excellenceteam.site | **[OK]** 200 |
| https://n8n-itenet.duckdns.org | **[OK]** 200 |
| https://mecano-api.duckdns.org | **[OK]** 200 |
| https://api.waaloge.excellenceteam.site | **[OK]** 200 |

Note de transparence : le conteneur web a logué quelques `Error: The Server Reference ID did not match the expected format. Received "x"` à 13:46 (juste après sa recréation), requêtes externes type scan sur des endpoints Server Action Next.js avec identifiants aléatoires. Aucune page n'est affectée (`/` et `/connexion` répondent 200), le service est sain.

---

## 6. Ressources avant / après

| | Avant (13:35) | Après (~14:00) |
|---|---|---|
| `df -h /` | 46 Go utilisés / **31 Go libres** (60 %) | 47 Go utilisés / **30 Go libres** (62 %) |
| `free -h` | 2,6 Gi used — **1,1 Gi available** ; swap 2,0/4,0 | 2,6 Gi used — **1,1 Gi available** ; swap 2,1/4,0 |

Espace largement au-dessus du seuil de 6 Go ; aucun prune nécessaire. Builds séquentiels sans incident mémoire.

---

## 7. Emplacement des secrets (aucun dans ce rapport ni dans git)

| Fichier | Contenu | Permissions |
|---|---|---|
| `~/.teamhub-demo-password` | Mot de passe commun des 8 comptes de démo | `600` |
| `~/.teamhub-demo-seed.txt` | Sortie complète du 1er seed (mot de passe + lien d'invitation) | `600` |
| `~/.teamhub-demo-seed-rerun.txt` | Sortie complète du seed de réexécution | `600` |
| `~/.teamhub-demo-seed-final.txt` | Sortie complète du seed final (org 11, lien invité à accepter à l'écran) | `600` |
| `/tmp/demo-check/` | Script de parcours + résultats JSON/txt (hors dépôt) | — |

---

## 8. Fichiers modifiés

- `DEPLOY_REPORT.md` : **seul fichier du dépôt modifié** (ce rapport) ; `git status` propre par ailleurs.
- Aucun fichier de code touché ; aucun autre projet serveur touché ; Caddy : simple `reload` à chaud (Caddyfile non modifié).
- Volume `uploads` et bases existantes préservés ; aucune donnée préexistante supprimée.

---

## 9. Verdict et recommandations

**Verdict : PRÊT À FILMER.** La démo finale est en place : organisation « Studio Lagune » (id 11), 8 comptes (mot de passe commun hors dépôt), 2 invitations dont une invitation invité à accepter à l'écran, 6 canaux / 21 messages Mongo, dates relatives au jour de la relance. Le script de chat MongoDB, jamais exécuté sur un vrai MongoDB avant cette session, est **validé** (insertion, comptages, idempotence).

Recommandations :
1. **Persistance réseau Caddy** (déjà ouverte, hors périmètre) : `teamhub_default` en `external: true` côté EPINET pour survivre à une recréation de `epitnet-caddy-1`.
2. **Purge Mongo des seeds successifs** : chaque réexécution de `DemoSeeder` laisse les canaux de l'ancienne organisation. Ajouter au `demo:purge` (ou au seeder) une suppression `Message/Channel.deleteMany({organization_id})` pour l'ancien id, afin d'éviter l'accumulation (19 canaux / 64 messages aujourd'hui, invisibles des clients).
3. **Throttle login 5/min/IP** : toute nouvelle passe de vérification doit espacer les logins ≥ 13 s (16 s utilisés ici).
4. Les warnings Pest `.env` restent bénins ; un `.env` de test vide les supprimerait.
