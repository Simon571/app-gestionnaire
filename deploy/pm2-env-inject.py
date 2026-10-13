#!/usr/bin/env python3
"""Injecte les variables du .env directement dans le bloc `env` de PM2.

Pourquoi : ni le chargement bash (`source`/`export`) ni `node --env-file` n'ont
transmis les variables au process enfant servi par PM2. Le mecanisme fiable est
celui de PM2 lui-meme : le bloc `env` de l'ecosystem, dont les valeurs sont
passees au process par `spawn` (aucun shell) -- les '$' du hash PBKDF2 y
survivent tels quels.

  1. lit .env en Python (sans expansion) ;
  2. ecrit ecosystem.config.cjs avec toutes ces variables dans `env` ;
  3. pm2 delete + pm2 start + pm2 save ;
  4. verifie que le process qui ecoute voit SUPER_ADMIN_* ;
  5. teste POST /api/auth/super-admin.
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

    print(f"[env] {len(env)} variables lues depuis .env")
    for k in ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH", "SESSION_SECRET",
              "ASSEMBLY_PIN", "API_AUTH_MODE"):
        v = env.get(k, "")
        extra = f" debut={v[:14]}" if k == "SUPER_ADMIN_PASSWORD_HASH" else ""
        print(f"  {k}: len={len(v)}{extra}")

    eco = (
        "// PM2 ecosystem -- variables injectees dans `env` (fiable, sans shell).\n"
        "// Genere depuis .env : les '$' du hash PBKDF2 restent litteraux.\n"
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
    print(f"[eco] ecosystem ecrit ({len(eco)} octets)")

    subprocess.run(["pm2", "delete", "gestionnaire"], capture_output=True, text=True)
    time.sleep(1)
    r = subprocess.run(["pm2", "start", ECO_PATH], capture_output=True, text=True)
    print("[pm2] start code:", r.returncode)
    if r.returncode != 0:
        print((r.stdout or "")[-500:], (r.stderr or "")[-500:])
    subprocess.run(["pm2", "save"], capture_output=True, text=True)
    time.sleep(7)

    out = subprocess.run(["ss", "-lntp"], capture_output=True, text=True).stdout
    pid = None
    for line in out.splitlines():
        if ":3000 " in line and "pid=" in line:
            m = re.search(r"pid=(\d+)", line)
            if m:
                pid = m.group(1)
    print("[check] listener 3000 pid:", pid)
    if pid:
        try:
            with open(f"/proc/{pid}/environ", "rb") as f:
                raw = f.read().decode("utf-8", "replace")
            d = dict(l.split("=", 1) for l in raw.split("\0") if "=" in l)
            print("  SUPER_ADMIN_EMAIL     =", d.get("SUPER_ADMIN_EMAIL"))
            hv = d.get("SUPER_ADMIN_PASSWORD_HASH", "")
            print("  PASSWORD_HASH len     =", len(hv), "debut:", hv[:14])
            print("  API_AUTH_MODE         =", d.get("API_AUTH_MODE"))
        except Exception as e:
            print("  lecture /proc impossible:", e)

    payload = json.dumps({"email": "admin@afrikacash.store", "password": "Jehovah@1914"})
    with open("/tmp/login-test.json", "w") as f:
        f.write(payload)
    c = subprocess.run(
        ["curl", "-s", "-o", "/tmp/login-body.json", "-w", "%{http_code}",
         "-X", "POST", "-H", "Content-Type: application/json",
         "--data", "@/tmp/login-test.json",
         "http://127.0.0.1:3000/api/auth/super-admin"],
        capture_output=True, text=True, timeout=30)
    print("[api] HTTP:", c.stdout.strip())
    try:
        print("[api] corps:", open("/tmp/login-body.json").read()[:250])
    except Exception:
        pass
    print("FINI")


if __name__ == "__main__":
    main()