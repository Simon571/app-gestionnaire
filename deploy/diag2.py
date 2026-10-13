#!/usr/bin/env python3
"""Diagnostic precis du 503 super admin.

1) doublons / valeurs de .env
2) variables du process qui ecoute le port 3000
3) etat de SESSION_SECRET (renvoye avant le message super admin)
4) test des deux endpoints (super-admin et login assemblee)
"""
import json
import os
import re
import subprocess
import time

APP = "/www/wwwroot/gestionnaire.afrikacash.store"
ENV_PATH = os.path.join(APP, ".env")
KEYS = ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH", "SESSION_SECRET",
        "ASSEMBLY_PIN", "API_AUTH_MODE", "PORT", "HOSTNAME")


def read_env(path):
    """Retourne {cle: [ (ligne, valeur), ... ]} sans expansion."""
    out = {}
    with open(path, encoding="utf-8", errors="replace") as f:
        for i, raw in enumerate(f, 1):
            line = raw.rstrip("\n")
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            out.setdefault(k.strip(), []).append((i, v))
    return out


def main():
    print("=== 1) .env ===")
    print("taille:", os.path.getsize(ENV_PATH), "octets")
    env = read_env(ENV_PATH)
    for k in KEYS:
        occ = env.get(k, [])
        print(f"{k}: {len(occ)} occurrence(s)")
        for ln, v in occ:
            if k == "SUPER_ADMIN_PASSWORD_HASH":
                segs = v.split("$")
                print(f"   ligne {ln} len={len(v)} segments={len(segs)} "
                      f"{[s[:12] for s in segs]}")
            else:
                print(f"   ligne {ln} len={len(v)} val={v[:30]!r}")
    hv = env.get("SUPER_ADMIN_PASSWORD_HASH", [("", "")])[-1][1]
    print("ASCII pur (hash):", hv.isascii(),
          "| espaces:", " " in hv, "| CR:", "\r" in hv)

    print()
    print("=== 2) process qui ecoute :3000 ===")
    out = subprocess.run(["ss", "-lntp"], capture_output=True, text=True).stdout
    pids = []
    for line in out.splitlines():
        if ":3000 " in line or ":3000\t" in line:
            m = re.findall(r"pid=(\d+)", line)
            pids.extend(m)
    print("pid(s):", sorted(set(pids)))
    for pid in sorted(set(pids))[:5]:
        try:
            with open(f"/proc/{pid}/environ", "rb") as f:
                raw = f.read().decode("utf-8", "replace")
            d = dict(l.split("=", 1) for l in raw.split("\0") if "=" in l)
            for k in ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH",
                      "SESSION_SECRET", "API_AUTH_MODE"):
                v = d.get(k, "")
                if k == "SUPER_ADMIN_PASSWORD_HASH":
                    print(f"   [{pid}] {k} len={len(v)} segments="
                          f"{len(v.split('$'))} debut={v[:14]}")
                else:
                    print(f"   [{pid}] {k} = {v[:30]!r}")
            # Comparaison directe avec .env
            dv = d.get("SUPER_ADMIN_PASSWORD_HASH", "")
            print(f"   [{pid}] hash identique a .env :", dv == hv)
            print(f"   [{pid}] cmdline :",
                  open(f"/proc/{pid}/cmdline", "rb").read()
                  .decode("utf-8", "replace").replace("\0", " ")[:160])
        except Exception as e:
            print(f"   [{pid}] erreur: {e}")

    print()
    print("=== 3) cwd du process (racine des donnees / .env reel) ===")
    for pid in sorted(set(pids))[:3]:
        try:
            print(f"   [{pid}] cwd =", os.readlink(f"/proc/{pid}/cwd"))
        except Exception as e:
            print(f"   [{pid}] cwd illisible: {e}")

    print()
    print("=== 4) trace de chargement du module de route ===")
    mod = os.path.join(APP, ".next", "standalone", ".next", "server", "app",
                       "api", "auth", "super-admin", "route.js")
    if os.path.exists(mod):
        txt = open(mod, encoding="utf-8", errors="replace").read()
        i = txt.find("SUPER_ADMIN_EMAIL")
        print("   route.js trouve, extrait :")
        print("   ", txt[max(0, i - 90):i + 90].replace("\n", " "))
    else:
        print("   introuvable:", mod)

    print()
    print("=== 5) tests HTTP ===")
    json.dump({"email": "admin@afrikacash.store", "password": "Jehovah@1914"},
              open("/tmp/login-test.json", "w"))

    tests = [
        ("POST super-admin", ["-X", "POST", "-H", "Content-Type: application/json",
                              "--data", "@/tmp/login-test.json",
                              "http://127.0.0.1:3000/api/auth/super-admin"]),
        ("POST login assemblee", ["-X", "POST", "-H", "Content-Type: application/json",
                                  "--data", "{\"assemblyId\":\"KINYOL-WGHK\",\"pin\":\"939168\"}",
                                  "http://127.0.0.1:3000/api/auth/login"]),
    ]
    for label, args in tests:
        c = subprocess.run(["curl", "-s", "-o", "/tmp/body.json", "-w", "%{http_code}"]
                           + args, capture_output=True, text=True, timeout=30)
        print(f"   [{label}] HTTP:", c.stdout.strip(), "| corps:",
              open("/tmp/body.json", encoding="utf-8", errors="replace").read()[:200])

    print()
    print("=== 6) journal PM2 (40 dernieres lignes) ===")
    lg = subprocess.run(["pm2", "logs", "gestionnaire", "--lines", "40", "--nostream"],
                        capture_output=True, text=True)
    print((lg.stdout or lg.stderr)[-2500:])
    print("FINI")


if __name__ == "__main__":
    main()