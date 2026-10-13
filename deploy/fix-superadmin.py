#!/usr/bin/env python3
"""
Corrige le compte super admin et le chargement du .env sur le serveur.

1. Met a jour SUPER_ADMIN_PASSWORD_HASH (et l'email) dans le .env.
2. Reecrit start-gestionnaire.sh en version "ligne par ligne" (les valeurs
   contenant des `$` ou des espaces survivent), car la version `source`
   deplace le `$` du hash et l'email.
3. Redemarre le processus PM2 gestionnaire.
"""
import os
import shutil
import subprocess
import stat

APP = "/www/wwwroot/gestionnaire.afrikacash.store"
ENV_PATH = os.path.join(APP, ".env")
START_PATH = os.path.join(APP, "start-gestionnaire.sh")

EMAIL = "admin@afrikacash.store"
# Hash genere le 2026-10-09 pour le mot de passe saisi (Jehovah@1914)
NEW_HASH = ("pbkdf2$210000$fff29674f042df0ffa871167ce2a55e4$"
            "f7213477b2f71de943c5f52951f1a178ff3768fa8a63f2ffa26bea4f1fef602d")

START_CONTENT = """#!/usr/bin/env bash
# Demarrage du serveur standalone du gestionnaire.
# Charge .env ligne par ligne (preserve $ et espaces), puis lance server.js.

cd "$(dirname "$0")"

if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\\#*) continue ;;
      *) export "$line" ;;
    esac
  done < .env
fi

export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

exec node .next/standalone/server.js
"""

# --- 1. .env : maj de l'email et du hash ---
with open(ENV_PATH, encoding="utf-8") as f:
    lines = f.readlines()

out = []
changed = False
for line in lines:
    key = line.split("=", 1)[0]
    if key == "SUPER_ADMIN_EMAIL":
        out.append(f"SUPER_ADMIN_EMAIL={EMAIL}\n")
        changed = True
    elif key == "SUPER_ADMIN_PASSWORD_HASH":
        out.append(f"SUPER_ADMIN_PASSWORD_HASH={NEW_HASH}\n")
        changed = True
    else:
        out.append(line)

with open(ENV_PATH, "w", encoding="utf-8") as f:
    f.writelines(out)
print("[env] maj:", "email + hash" if changed else "aucune ligne (verifiez clefs)")

# --- 2. start script ---
with open(START_PATH, "w", encoding="utf-8") as f:
    f.write(START_CONTENT)
os.chmod(START_PATH, os.stat(START_PATH).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
print("[start] start-gestionnaire.sh reecrit (version ligne-par-ligne)")

# --- 3. pm2 restart ---
r = subprocess.run(["pm2", "restart", "gestionnaire", "--update-env"],
                   capture_output=True, text=True)
print("[pm2] restart code:", r.returncode)
print("FINI")