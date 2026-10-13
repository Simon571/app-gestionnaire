#!/usr/bin/env bash
# Démarrage du serveur standalone du gestionnaire.
# Le bundle standalone (server.js) ne lit PAS .env tout seul (piège classique) :
# le .env est donc chargé ici, de façon robuste (valeurs contenant des espaces).
#
# Chargement "ligne à ligne" plutôt que `source`, pour que
# ASSEMBLY_NAME=KIN YOLO EST Français reste un seul champ.

cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
      *) export "$line" ;;
    esac
  done < .env
  set +a
fi

export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

exec node .next/standalone/server.js