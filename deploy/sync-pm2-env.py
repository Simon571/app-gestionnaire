#!/usr/bin/env python3
"""Regenere ecosystem.config.cjs depuis .env puis redemarre l'app.

Utile apres toute modification de .env (email super admin, mot de passe, PIN...):
PM2 garde en memoire les variables du moment ou il a demarre le process.
Ce script relit le fichier et reinjecte les valeurs.
"""
import json
import os
import re
import subprocess
import time

APP = "/www/wwwroot/gestionnaire.afrikacash.store"
ENV_PATH = os.path.join(APP, ".env")
ECO_PATH = os.path.join(APP, "ecosystem.config.cjs")


def read_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            env[k] = v
    return env


def main():
    env = read_env(ENV_PATH)
    env.setdefault("NODE_ENV", "production")
    env.setdefault("PORT", "3000")
    env.setdefault("HOSTNAME", "0.0.0.0")
    env.setdefault("NEXT_TELEMETRY_DISABLED", "1")

    hv = env.get("SUPER_ADMIN_PASSWORD_HASH", "")
    print("[env] %d variables" % len(env))
    print("  SUPER_ADMIN_EMAIL =", env.get("SUPER_ADMIN_EMAIL"))
    print("  HASH segments =", len(hv.split("$")), "len =", len(hv))

    eco = (
        "// PM2 ecosystem -- genere depuis .env par deploy/sync-pm2-env.py.\n"
        "module.exports = {\n"
        "  apps: [\n"
        "    {\n"
        "      name: 'gestionnaire',\n"
        f"      cwd: {json.dumps(APP)},\n"
        "      script: '.next/standalone/server.js',\n"
        "      interpreter: 'node',\n"
        f"      env: {json.dumps(env, ensure_ascii=False, indent=8)},\n"
        "      max_memory_restart: '1G',\n"
        "    },\n"
        "  ],\n"
        "};\n"
    )
    with open(ECO_PATH, "w", encoding="utf-8") as f:
        f.write(eco)
    print("[eco] ecosystem regenere")

    subprocess.run(["pm2", "delete", "gestionnaire"], capture_output=True, text=True)
    time.sleep(1)
    r = subprocess.run(["pm2", "start", ECO_PATH], capture_output=True, text=True)
    print("[pm2] start code:", r.returncode)
    subprocess.run(["pm2", "save"], capture_output=True, text=True)
    time.sleep(8)

    out = subprocess.run(["ss", "-lntp"], capture_output=True, text=True).stdout
    pid = None
    for line in out.splitlines():
        if ":3000 " in line:
            m = re.search(r"pid=(\d+)", line)
            if m:
                pid = m.group(1)
    if pid:
        raw = open(f"/proc/{pid}/environ", "rb").read().decode("utf-8", "replace")
        d = dict(l.split("=", 1) for l in raw.split("\0") if "=" in l)
        print("[proc %s] SUPER_ADMIN_EMAIL =" % pid, d.get("SUPER_ADMIN_EMAIL"))
        h = d.get("SUPER_ADMIN_PASSWORD_HASH", "")
        print("[proc %s] HASH segments =" % pid, len(h.split("$")))

    email = env.get("SUPER_ADMIN_EMAIL", "")
    payload = json.dumps({"email": email, "password": "Jehovah@1914"})
    open("/tmp/login-test.json", "w").write(payload)
    c = subprocess.run(
        ["curl", "-s", "-o", "/tmp/body.json", "-w", "%{http_code}",
         "-X", "POST", "-H", "Content-Type: application/json",
         "--data", "@/tmp/login-test.json",
         "http://127.0.0.1:3000/api/auth/super-admin"],
        capture_output=True, text=True, timeout=30)
    print("[api] HTTP:", c.stdout.strip())
    print("[api] corps:", open("/tmp/body.json").read()[:180])
    print("FINI")


if __name__ == "__main__":
    main()