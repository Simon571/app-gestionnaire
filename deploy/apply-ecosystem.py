#!/usr/bin/env python3
"""Redemarre 'gestionnaire' via PM2 + un fichier ecosystem qui utilise le
mecanisme natif `node --env-file=.env` de Node 20.

Pourquoi : le standalone server.js ne charge pas .env lui-meme ; le charger via
bash (`source`/`export`) corrompt les valeurs contenant des '$' (le hash PBKDF2
super admin). `node --env-file` parse le fichier de facon native (a la dotenv),
sans aucune expansion, et les variables arrivent dans l'environnement initial du
process -- c'est la methode propre et stable.

Actions :
  1. ecrit /www/wwwroot/gestionnaire.afrikacash.store/ecosystem.config.cjs
  2. garantit PORT/HOSTNAME dans le .env (node --env-file les lira)
  3. pm2 delete + pm2 start via l'ecosystem + pm2 save
  4. verifie: /proc/<pid>/environ contient SUPER_ADMIN_* , puis POST login API
"""
import json
import os
import re
import subprocess
import time

APP = "/www/wwwroot/gestionnaire.afrikacash.store"
ENV_PATH = os.path.join(APP, ".env")
ECO_PATH = os.path.join(APP, "ecosystem.config.cjs")

ECO_CONTENT = f"""// PM2 ecosystem: demarre le standalone Next.js avec `node --env-file`.
module.exports = {{
  apps: [
    {{
      name: 'gestionnaire',
      cwd: '{APP}',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      node_args: '--env-file=.env',
      env: {{
        NODE_ENV: 'production',
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
      }},
      max_memory_restart: '1G',
    }},
  ],
}};
"""


def sh(*args):
    return subprocess.run(list(args), capture_output=True, text=True)


def main():
    # 1) Garantir PORT/HOSTNAME dans le .env (lus par --env-file).
    with open(ENV_PATH, encoding="utf-8") as f:
        content = f.read()
    additions = []
    for k, v in (("PORT", "3000"), ("HOSTNAME", "0.0.0.0")):
        if not re.search(rf"^{k}=", content, re.M):
            additions.append(f"{k}={v}")
    if additions:
        with open(ENV_PATH, "a", encoding="utf-8") as f:
            f.write("\n" + "\n".join(additions) + "\n")
        print("[env] ajoute:", ", ".join(additions))
    else:
        print("[env] PORT/HOSTNAME deja presents")

    # 2) Ecosystem file.
    with open(ECO_PATH, "w", encoding="utf-8") as f:
        f.write(ECO_CONTENT)
    print(f"[eco] ecosystem ecrit: {ECO_PATH}")

    # 3) PM2 : suppression puis relance proprement.
    sh("pm2", "delete", "gestionnaire")
    time.sleep(1)
    r = sh("pm2", "start", ECO_PATH)
    print("[pm2] start code:", r.returncode)
    print((r.stdout or r.stderr).strip()[-400:])
    sh("pm2", "save")
    time.sleep(6)

    # 4) Verifier que le process node voit les variables.
    out = subprocess.run(["pgrep", "-f", "standalone/server.js"],
                         capture_output=True, text=True).stdout.strip()
    pids = out.splitlines()
    found = False
    for pid in pids[:5]:
        try:
            with open(f"/proc/{pid}/environ", "rb") as f:
                raw = f.read().decode("utf-8", "replace")
            d = dict(l.split("=", 1) for l in raw.split("\0") if "=" in l)
            em = d.get("SUPER_ADMIN_EMAIL")
            hv = d.get("SUPER_ADMIN_PASSWORD_HASH", "")
            print(f"[proc {pid}] email={em}  hashlen={len(hv)}  debut={hv[:14]}")
            if em:
                found = True
        except Exception as e:
            print(f"[proc {pid}] lecture impossible: {e}")
    if not found:
        print("[proc] AUCUN process standalone/server.js trouve. Verifiez pm2 status.")

    # 5) Test API login.
    payload = json.dumps({"email": "admin@afrikacash.store", "password": "Jehovah@1914"})
    with open("/tmp/login-test.json", "w") as f:
        f.write(payload)
    c = subprocess.run(
        ["curl", "-s", "-o", "/tmp/login-body.json", "-w", "%{http_code}",
         "-X", "POST", "-H", "Content-Type: application/json",
         "--data", "@tmp/login-test.json", "http://127.0.0.1:3000/api/auth/super-admin"],
        capture_output=True, text=True, timeout=30)
    print("[api] HTTP:", c.stdout.strip())
    try:
        body = open("/tmp/login-body.json").read()
        print("[api] corps:", body[:300])
    except Exception:
        pass
    print("FINI")


if __name__ == "__main__":
    main()