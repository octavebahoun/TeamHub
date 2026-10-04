# Laravel API — FrankenPHP (PHP 8.3 + Caddy embarqué, prod-ready)
FROM dunglas/frankenphp:1.9-php8.3-alpine AS base

# Extensions PHP nécessaires
RUN install-php-extensions \
    pdo_pgsql \
    pdo_mysql \
    redis \
    opcache \
    intl \
    zip \
    bcmath \
    pcntl

RUN printf "upload_max_filesize=25M\npost_max_size=30M\n" > /usr/local/etc/php/conf.d/uploads.ini

WORKDIR /app

# Installer Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# --- Étape build (dépendances prod) ---
FROM base AS build
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev \
 && php artisan storage:link || true

# --- Étape test (dev deps + Pest, utilisée par la CI/l'agent) ---
# Build: docker build --target test -t teamhub-api-test apps/api/
# Run:   docker run --rm --network teamhub_default -e APP_KEY=... \
#          -e INTERNAL_SECRET=... teamhub-api-test ./vendor/bin/pest
FROM base AS test
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --optimize
CMD ["./vendor/bin/pest", "--colors=never"]

# --- Étape runtime (prod, par défaut) ---
FROM base AS runtime
COPY --from=build /app /app

# Storage/uploads sur volume monté
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R ug+rwx storage bootstrap/cache

# FrankenPHP écoute sur 80 par défaut
EXPOSE 80

# Configuration Caddy interne à FrankenPHP: sert Laravel depuis public/
ENV SERVER_NAME=:80
ENV APP_ENV=production

# Script d'entrée : migrate + config cache + start
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
