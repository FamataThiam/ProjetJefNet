# Image Laravel de JefNet (PHP 8.4 + PHP-FPM)
# Étapes : base (PHP + extensions) -> deps (paquets Composer) -> test (tests) -> app (image finale)

FROM php:8.4-fpm-alpine AS base
RUN apk add --no-cache icu-libs libzip libpng libjpeg-turbo freetype libpq \
 && apk add --no-cache --virtual .build $PHPIZE_DEPS icu-dev libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev postgresql-dev linux-headers \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql gd zip intl bcmath pcntl sockets opcache exif \
 && apk del .build
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php.ini /usr/local/etc/php/conf.d/jefnet.ini
WORKDIR /var/www/html

# paquets Composer (couche mise en cache tant que composer.lock ne change pas)
# les paquets « dev » sont gardés : Faker sert aux seeders de démonstration
FROM base AS deps
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress
COPY . .
RUN composer dump-autoload --optimize --no-interaction \
 && php artisan package:discover --ansi

# tests : l'image ne se construit que si les tests passent (utilisé par Jenkins)
FROM deps AS test
RUN cp .env.example .env && php artisan key:generate --force && php artisan test

# image finale
FROM deps AS app
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
# sed : retire les fins de ligne Windows si le fichier a été modifié sous Windows
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint && chmod +x /usr/local/bin/entrypoint \
 && rm -f .env \
 && chown -R www-data:www-data storage bootstrap/cache
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
