#!/bin/sh
set -e

cd /app

# Cache config / routes / views pour la prod
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Migrations (idempotent)
php artisan migrate --force

exec "$@"
