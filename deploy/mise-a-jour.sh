#!/bin/sh
# Mise a jour du site sur le serveur : recuperer le code, reconstruire, relancer.
#
#   ./deploy/mise-a-jour.sh
#
# Une sauvegarde est prise avant toute chose : si la nouvelle version se comporte
# mal, les donnees d'avant sont encore la.

set -eu

BRANCHE="${BRANCHE:-multi-assemblees}"

if [ ! -f docker-compose.yml ]; then
  echo "Erreur : lancer ce script depuis le dossier du projet." >&2
  exit 1
fi

echo "== Sauvegarde avant mise a jour =="
./deploy/sauvegarde.sh

echo
echo "== Recuperation du code ($BRANCHE) =="
git fetch origin "$BRANCHE"
git checkout "$BRANCHE"
git pull --ff-only origin "$BRANCHE"

echo
echo "== Reconstruction de l'image =="
# `--build` est indispensable : l'adresse publique du site est figee dans le
# JavaScript du navigateur au moment de la compilation, pas au demarrage.
docker compose up -d --build

echo
echo "== Etat =="
docker compose ps

echo
echo "Attente du demarrage..."
sleep 15
if docker compose exec -T app curl -fsS http://127.0.0.1:3000/robots.txt > /dev/null 2>&1; then
  echo "Le site repond."
else
  echo "Le site ne repond pas encore. Voir les journaux :  docker compose logs -f app" >&2
  exit 1
fi
