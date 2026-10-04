# TeamHub — déploiement

Pile mono-serveur : `docker compose up` monte tout (Postgres, Mongo, Redis, api Laravel, realtime Node, data FastAPI, web Next.js, reverse proxy Caddy HTTPS).

## Prérequis serveur

- Linux (Ubuntu 22.04+ recommandé)
- Docker Engine ≥ 24 et `docker compose` v2
- DNS A/AAAA de `teamhub.excellenceteam.site` (ou ton domaine) pointant vers l'IP du serveur
- Ports 80 et 443 ouverts en entrée

## Étapes

```bash
# 1) Cloner
git clone https://github.com/octavebahoun/teamhub.git
cd teamhub

# 2) Préparer les secrets
cp .env.example .env
openssl rand -hex 32           # → coller dans INTERNAL_SECRET
openssl rand -base64 32        # → coller dans POSTGRES_PASSWORD
# Générer APP_KEY (une fois seulement) :
docker compose run --rm api php artisan key:generate --show
# → copier la valeur "base64:..." dans APP_KEY

# 3) Démarrer
docker compose up -d --build

# 4) Vérifier
docker compose ps
curl -sf https://teamhub.excellenceteam.site/api/up      # health Laravel
curl -sf https://teamhub.excellenceteam.site/            # frontend Next.js
```

Les migrations Laravel tournent au démarrage du service `api` (idempotent).

## Sauvegardes

Script quotidien (dumps locaux + upload R2 si les variables sont posées) :

```bash
./infra/backup.sh
# cron : 0 2 * * * /chemin/teamhub/infra/backup.sh
```

Équivalent manuel :

```bash
docker compose exec postgres pg_dump -U teamhub teamhub > backup-$(date +%F).sql
docker compose exec mongo mongodump --archive=/tmp/mongo.gz --gzip
docker compose cp mongo:/tmp/mongo.gz backup-mongo-$(date +%F).gz
```

## Passer une DB en managé (plus tard)

Chaque service lit une URL unique :

- `DATABASE_URL` → Laravel (`DB_URL`)
- `DATABASE_URL_DATA` → FastAPI (SQLAlchemy)
- `MONGO_URL` → realtime
- `REDIS_URL` → api + realtime

Pour migrer vers RDS (Postgres managé) :
1. Créer l'instance et importer le dump
2. Dans `.env` : `DATABASE_URL=postgres://user:pass@rds-host:5432/teamhub`
3. Retirer le service `postgres` du `docker-compose.yml`
4. `docker compose up -d`

Aucun changement de code.

## Logs

```bash
docker compose logs -f api
docker compose logs -f realtime
docker compose logs -f caddy
```
