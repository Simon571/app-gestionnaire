#!/usr/bin/env bash
# Reconstruit l'app standalone sur le serveur puis la relance.
#
# A lancer EN ARRIERE-PLAN (nohup) : le build dure plusieurs minutes et une
# coupure SSH ne doit pas l'interrompre.
#
# Le piege principal est traite par postbuild-standalone.sh, qui retire le
# .env recopie dans .next/standalone (sinon dotenv-expand corrompt le hash du
# mot de passe super admin et la connexion repond « non configure »).
set -euo pipefail

APP="/www/wwwroot/gestionnaire.afrikacash.store"
SITE="https://gestionnaire.afrikacash.store"
LOG="/root/gestionnaire-rebuild.log"

cd "$APP"

# Le portail web est fige dans le JavaScript au moment de la compilation : il
# faut le declarer ici, un redemarrage ne suffit pas. Sans ce reglage, un
# visiteur qui ouvre l'adresse du site voit le tableau de bord au lieu de la
# page de telechargement. Le poste Windows installe, lui, se declare '0' dans
# son propre build (build-tauri.ps1) et n'est pas concerne.
export NEXT_PUBLIC_PORTAL_MODE=1

{
  echo "=== DEBUT $(date) ==="
  echo "--- build (portail web) ---"
  NEXT_OUTPUT=standalone npx next build
  echo "--- postbuild (nettoie .env recopie + copie les assets) ---"
  bash postbuild-standalone.sh
  echo "--- redemarrage ---"
  pm2 restart gestionnaire
  sleep 10
  echo "--- verification .env standalone absent ---"
  if [ -f .next/standalone/.env ]; then echo "ATTENTION: .env encore present"; else echo "ok: .env absent"; fi
  echo "--- verification API ---"
  curl -s -o /tmp/body.json -w "HTTP=%{http_code}\n" \
    -X POST -H 'Content-Type: application/json' \
    --data '{"email":"simonnzamba@yahoo.fr","password":"Jehovah@1914"}' \
    http://127.0.0.1:3000/api/auth/super-admin
  head -c 200 /tmp/body.json; echo

  # --- Verification du parcours public, en lecture seule ---
  # On interroge la racine et la page de telechargement, et on confirme que la
  # route d'inscription existe. En GET volontairement : un POST creerait une
  # vraie assemblee dans le registre de production. Un GET non exporte repond
  # 405, ce qui prouve la presence de la route sans rien ecrire.
  echo "--- verification accueil public ---"
  ROOT_CODE=$(curl -s -L -o /tmp/root.html -w "%{http_code}" "$SITE/fr")
  echo "GET $SITE/fr -> HTTP=$ROOT_CODE"
  if grep -q "download/android" /tmp/root.html; then
    echo "ok: la page de telechargement (APK) est servie a l'accueil"
  else
    echo "ATTENTION: l'accueil ne presente pas le lien APK"
  fi

  echo "--- verification route d'inscription des assemblees ---"
  curl -s -o /dev/null -w "GET /api/assemblies/register -> HTTP=%{http_code} (405 attendu: POST seul)\n" \
    "$SITE/api/assemblies/register"

  echo "--- verification du site principal (ne doit pas bouger) ---"
  curl -s -o /dev/null -w "afrikacash.store -> HTTP=%{http_code}\n" https://afrikacash.store/

  echo "=== FIN $(date) ==="
} > "$LOG" 2>&1

echo "TERMINE — log: $LOG"