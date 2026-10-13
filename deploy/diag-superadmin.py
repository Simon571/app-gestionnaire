#!/usr/bin/env python3
"""Diagnostic complet du compte super admin sur le serveur BaoTa.

Inspecte :
  A) le fichier .env  (ce qu'il contient, presence des clefs)
  B) le process PM2  (ce que l'environnement du process contient reellement)
  D) le script de demarrage (comment il charge .env)

Ne modifie rien : lecture seule.
"""
import json
import os
import re
import subprocess

ENV_PATH = "/www/wwwroot/gestionnaire.afrikacash.store/.env"
START_PATH = "/www/wwwroot/gestionnaire.afrikacash.store/start-gestionnaire.sh"


def main():
    print("=" * 60)
    print("A) FICHIER .env")
    print("=" * 60)
    if not os.path.exists(ENV_PATH):
        print("INTROUVABLE:", ENV_PATH)
        return 1
    with open(ENV_PATH, encoding="utf-8") as f:
        content = f.read()
    print("fichier present,", len(content), "octets,", content.count("\n"), "lignes")
    for key in ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH", "SESSION_SECRET",
                "ASSEMBLY_ID", "ASSEMBLY_PIN", "ASSEMBLY_NAME"):
        m = re.search(rf"^{re.escape(key)}=(.*)$", content, re.M)
        if not m:
            print(f"  {key}: ABSENT")
            continue
        val = m.group(1)
        shown = val if key not in ("SUPER_ADMIN_PASSWORD_HASH", "SESSION_SECRET") else f"<len={len(val)}>"
        print(f"  {key}: {shown}")
    # Structure du hash
    m = re.search(r"^SUPER_ADMIN_PASSWORD_HASH=(.*)$", content, re.M)
    if m:
        seg = m.group(1).split("$")
        print("  segments du hash:", seg[:2], "...", "len:", len(seg))

    print()
    print("=" * 60)
    print("B) PROCESS PM2 'gestionnaire'")
    print("=" * 60)
    r = subprocess.run(["pm2", "jlist"], capture_output=True, text=True)
    if r.returncode != 0:
        print("pm2 jlist a echoue:", r.stderr)
        return 1
    items = json.loads(r.stdout)
    targets = [x for x in items if x.get("name") == "gestionnaire"]
    if not targets:
        print("AUCUN process 'gestionnaire'. Noms:", [x.get("name") for x in items])
        return 1
    p = targets[0]
    env = p.get("pm2_env", {})
    print("  status:", p.get("pm2_env", {}).get("status"))
    print("  restarts:", p.get("pm2_env", {}).get("restart_time"))
    print("  cwd:", p.get("pm2_env", {}).get("pm_cwd"))
    print("  exec:", p.get("pm2_env", {}).get("exec_interpreter"))
    print()
    for key in ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD_HASH", "SESSION_SECRET", "NODE_ENV"):
        val = env.get(key)
        if val is None:
            print(f"  pm2_env[{key}]: ABSENT")
        else:
            shown = val if key != "SUPER_ADMIN_PASSWORD_HASH" else f"<len={len(val)}, debut={val[:16]}>"
            print(f"  pm2_env[{key}]: {shown}")
    # Liste de toutes les clefs qui ressemblent a des env vars utiles
    useful = sorted(k for k in env if re.match(r"^(SUPER|SESSION|ASSEMBLY|API_|GEMINI|NEXT_)", k))
    print("  " + "Autres clefs utiles dans pm2_env:", ", ".join(useful) if useful else "(aucune)")

    print()
    print("=" * 60)
    print("D) start-gestionnaire.sh (debut)")
    print("=" * 60)
    if os.path.exists(START_PATH):
        with open(START_PATH, encoding="utf-8") as f:
            start = f.read()
        print("\n".join(start.splitlines()[:25]))
    else:
        print("INTROUVABLE")

    print()
    print("DIAGNOSTIC TERMINE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())