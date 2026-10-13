#!/usr/bin/env python3
"""Applique le chargeur Node (start-gestionnaire.js) au serveur :
- copie le chargeur dans le dossier de l'app ;
- recree start-gestionnaire.sh en mince coquille bash qui lance le chargeur ;
- redemarre le process PM2 'gestionnaire'.
"""
import os
import shutil
import subprocess
import sys

APP = "/www/wwwroot/gestionnaire.afrikacash.store"
LOADER_LOCAL = "/tmp/start-gestionnaire.js"
LOADER_REMOTE = os.path.join(APP, "start-gestionnaire.js")
SH = os.path.join(APP, "start-gestionnaire.sh")

if not os.path.exists(LOADER_LOCAL):
    print("ERREUR: /tmp/start-gestionnaire.js introuvable")
    sys.exit(1)

shutil.copy2(LOADER_LOCAL, LOADER_REMOTE)
print(f"[ok] chargeur Node copie vers {LOADER_REMOTE}")

# start-gestionnaire.sh : une coquille bash qui lance le chargeur Node.
# (PM2 reste configure avec exec_interpreter=bash : on garde le .sh comme entree
#  mais il ne fait que `exec node start-gestionnaire.js`.)
SH_CONTENT = """#!/usr/bin/env bash
# Point d'entree PM2 : laisse le chargeur Node lire .env sans corruption des $.
cd "$(dirname "$0")"
exec node start-gestionnaire.js
"""
with open(SH, "w", encoding="utf-8") as f:
    f.write(SH_CONTENT)
os.chmod(SH, 0o755)
print(f"[ok] start-gestionnaire.sh reecrit (coquille -> node start-gestionnaire.js)")

# PM2 : delete puis start a nouveau, pour remplacer le process et recharger env.
subprocess.run(["pm2", "delete", "gestionnaire"], capture_output=True, text=True)
r = subprocess.run(
    ["pm2", "start", SH, "--name", "gestionnaire", "--interpreter", "bash"],
    capture_output=True, text=True,
)
print("[pm2] start code:", r.returncode)
print((r.stdout or "").strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip())

# Attendre un peu et verifier que le port 3000 repond.
import time
time.sleep(5)
c = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:3000/robots.txt"],
                   capture_output=True, text=True, timeout=30)
print("[check] port 3000 /robots.txt ->", c.stdout.strip())

# Verifier que les variables arrivent maintenant dans pm2_env.
time.sleep(2)
j = subprocess.run(["pm2", "jlist"], capture_output=True, text=True)
import json
items = json.loads(j.stdout)
for p in items:
    if p.get("name") == "gestionnaire":
        env = p.get("pm2_env", {})
        print("[pm2_env] SUPER_ADMIN_EMAIL =", env.get("SUPER_ADMIN_EMAIL"))
        hv = env.get("SUPER_ADMIN_PASSWORD_HASH") or ""
        print("[pm2_env] PASSWORD_HASH len =", len(hv))
        break
print("FINI")