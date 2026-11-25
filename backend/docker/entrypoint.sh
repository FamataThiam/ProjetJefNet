#!/bin/sh
# Démarrage d'un conteneur Laravel. ROLE = app | reverb | queue | scheduler
set -e
cd /var/www/html

# le volume « storage » est vide au premier lancement : on crée les dossiers
mkdir -p storage/app/public storage/app/private storage/framework/cache/data \
         storage/framework/sessions storage/framework/views storage/logs
chown -R www-data:www-data storage

# clé de l'application : si APP_KEY est vide dans .env, elle est créée une seule fois
# et gardée dans le volume « storage » (les 4 conteneurs Laravel partagent la même)
if [ -z "$APP_KEY" ]; then
  CLE=storage/app/.cle-application
  if [ "${ROLE:-app}" = "app" ] && [ ! -s "$CLE" ]; then
    php -r 'echo "base64:".base64_encode(random_bytes(32));' > "$CLE"
    echo "Clé de l'application créée."
  fi
  until [ -s "$CLE" ]; do echo "En attente de la clé de l'application..."; sleep 2; done
  APP_KEY=$(cat "$CLE"); export APP_KEY
fi

# attendre la base de données
until php -r 'new PDO("pgsql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD"));' 2>/dev/null; do
  echo "En attente de PostgreSQL..."
  sleep 2
done

if [ "${ROLE:-app}" = "app" ]; then
  rm -f /tmp/jefnet-pret
  php artisan storage:link --force >/dev/null 2>&1 || true
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  touch /tmp/jefnet-pret   # signal pour les autres conteneurs (healthcheck)
fi

exec "$@"