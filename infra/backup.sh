#!/usr/bin/env bash
# Sauvegarde quotidienne Postgres + Mongo, optionnellement poussée vers Cloudflare R2.
# Usage (sur le serveur) :
#   ./infra/backup.sh
# Cron recommandé : 0 2 * * * /opt/teamhub/infra/backup.sh >> /var/log/teamhub-backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

STAMP="$(date +%F)"
OUT="${BACKUP_DIR:-$ROOT/backups}/$STAMP"
mkdir -p "$OUT"

echo "==> Postgres → $OUT/postgres.sql"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-teamhub}" "${POSTGRES_DB:-teamhub}" > "$OUT/postgres.sql"

echo "==> Mongo → $OUT/mongo.gz"
docker compose exec -T mongo mongodump --archive --gzip > "$OUT/mongo.gz"

# Rétention locale (7 jours par défaut)
find "${BACKUP_DIR:-$ROOT/backups}" -mindepth 1 -maxdepth 1 -type d -mtime +"${BACKUP_KEEP_DAYS:-7}" -exec rm -rf {} +

if [[ -n "${R2_ENDPOINT:-}" && -n "${R2_BUCKET:-}" && -n "${AWS_ACCESS_KEY_ID:-}" ]]; then
  echo "==> Upload R2 s3://${R2_BUCKET}/backups/${STAMP}/"
  if ! command -v aws >/dev/null 2>&1; then
    echo "aws CLI absent — dumps locaux uniquement" >&2
    exit 0
  fi
  aws s3 cp "$OUT/postgres.sql" "s3://${R2_BUCKET}/backups/${STAMP}/postgres.sql" --endpoint-url "$R2_ENDPOINT"
  aws s3 cp "$OUT/mongo.gz" "s3://${R2_BUCKET}/backups/${STAMP}/mongo.gz" --endpoint-url "$R2_ENDPOINT"
fi

echo "==> OK $OUT"
