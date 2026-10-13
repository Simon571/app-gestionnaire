#!/usr/bin/env bash
# Finalise un build standalone Next.js (serveur propre / VPS).
#
# A executer juste apres `NEXT_OUTPUT=standalone npx next build`, depuis la
# racine de l'app sur le serveur.
#
# Pourquoi ce script ? Deux pieges qui cassent la production en silence :
#
#  1. `next build` recopie `.env` dans `.next/standalone/.env`. Or le serveur
#     standalone charge ce fichier au demarrage avec `dotenv-expand`, qui
#     INTERPRETE les `$` : le hash PBKDF2 `pbkdf2$210000$<salt>$<hash>` est
#     alors expanse en variables inexistantes et devient `pbkdf2`. Resultat :
#     « Compte super admin non configure » (503) alors que les variables sont
#     bien presentes dans l'environnement du process.
#     On supprime donc ce fichier : les variables viennent de PM2.
#
#  2. `public/` et `.next/static/` ne sont PAS copies dans `standalone/` par
#     Next (c'est au Dockerfile de le faire) : sans eux, aucune image, aucun
#     CSS, aucun JS client n'est servi.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
[ -f "$ROOT/.next/standalone/server.js" ] || {
  echo "ERREUR: .next/standalone/server.js introuvable. Build lance ?" >&2
  exit 1
}

# 1) Retirer le .env recopie (dotenv-expand corrompt les valeurs contenant des $).
if [ -f "$ROOT/.next/standalone/.env" ]; then
  rm -f "$ROOT/.next/standalone/.env"
  echo "[ok] .next/standalone/.env supprime (evite l'expansion des \$ par dotenv-expand)"
else
  echo "[ok] aucun .next/standalone/.env a supprimer"
fi

# 2) Copier les assets statiques attendus par le serveur standalone.
cp -r "$ROOT/public" "$ROOT/.next/standalone/"
mkdir -p "$ROOT/.next/standalone/.next"
cp -r "$ROOT/.next/static" "$ROOT/.next/standalone/.next/"

echo "[ok] public/ et .next/static/ copies dans .next/standalone/"
echo ">>> BUILD FINALISE. Redemarrer : pm2 restart gestionnaire"