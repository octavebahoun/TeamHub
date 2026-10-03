#!/bin/sh
set -e

cd /app

# Cache config / routes / views pour la prod
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Migrations (idempotent) — un seul service doit les lancer pour éviter les
# collisions de verrou si api/queue/scheduler démarrent en même temps.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force
fi

exec "$@"
