#!/bin/sh
# Sauvegarde quotidienne : les fichiers de donnees et la base.
#
# A lancer depuis le dossier du projet, sur le serveur :
#   ./deploy/sauvegarde.sh
#
# Automatiser une fois par nuit a 3 h 12 (`crontab -e`) :
#   12 3 * * * cd /opt/app-gestionnaire && ./deploy/sauvegarde.sh >> /var/log/sauvegarde-gestionnaire.log 2>&1
#
# Une sauvegarde qui reste sur la meme machine ne protege pas d'un disque mort
# ni d'un serveur perdu. Recopier regulierement le dossier ./sauvegardes
# ailleurs — un autre serveur, un disque externe, un espace de stockage.

set -eu

DESTINATION="${DESTINATION:-./sauvegardes}"
JOURS_CONSERVES="${JOURS_CONSERVES:-30}"
HORODATAGE="$(date +%Y-%m-%d_%Hh%M)"

if [ ! -f docker-compose.yml ]; then
  echo "Erreur : lancer ce script depuis le dossier du projet (celui qui contient docker-compose.yml)." >&2
  exit 1
fi

mkdir -p "$DESTINATION"

# 1. Les fichiers JSON de l'application : familles, rapports, registre des
#    assemblees, programmes VCM. C'est aujourd'hui l'essentiel des donnees.
tar -czf "$DESTINATION/donnees_$HORODATAGE.tar.gz" data
echo "Donnees      : $DESTINATION/donnees_$HORODATAGE.tar.gz"

# 2. La base PostgreSQL. Vide tant que la migration n'a pas eu lieu, mais la
#    sauvegarder des maintenant evite d'oublier de le faire ensuite.
#    `pg_dump` a l'interieur du conteneur : aucun outil a installer sur l'hote.
if docker compose ps --status running db 2>/dev/null | grep -q db; then
  # shellcheck disable=SC2016
  docker compose exec -T db sh -c \
    'pg_dump --clean --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"' \
    | gzip > "$DESTINATION/base_$HORODATAGE.sql.gz"
  echo "Base         : $DESTINATION/base_$HORODATAGE.sql.gz"
else
  echo "Base         : conteneur db arrete, ignore."
fi

# 3. Effacer les copies trop anciennes, sinon le disque se remplit en silence.
find "$DESTINATION" -maxdepth 1 -name '*_*.tar.gz' -mtime "+$JOURS_CONSERVES" -delete
find "$DESTINATION" -maxdepth 1 -name '*_*.sql.gz' -mtime "+$JOURS_CONSERVES" -delete

echo "Conservation : $JOURS_CONSERVES jours dans $DESTINATION"
