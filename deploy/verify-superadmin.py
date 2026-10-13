#!/usr/bin/env python3
"""Verification decisive : le serveur node voit-il les variables super admin ?
1) trouve le PID du process node (child du bash pm2) ;
2) lit /proc/<pid>/environ pour confirmer la presence de SUPER_ADMIN_* ;
3) teste POST /api/auth/super-admin (via curl) et affiche le code + corps.
"""
import json
import os
import re
import subprocess
import time

APP = "/www/wwwroot/gestionnaire.afrikacash.store"


def find_node_pid():
    out = subprocess.run(["pgrep", "-f", "start-gestionnaire.js"],
                         capture_output=True, text=True).stdout.strip()
    if out:
        return out.splitlines()
    # Fallback : le process node standalone
    out2 = subprocess.run(["pgrep", "-f", "server.js"],
                          capture_output=True, text=True).stdout.strip()
    return out2.splitlines() if out2 else []


def main():
    pids = find_node_pid()
    print("Process node trouves:", pids)
    for pid in pids[:3]:
        try:
            with open(f"/proc/{pid}/environ", "rb") as f:
                env = f.read().decode("utf-8", "replace").split("\0")
            d = {}
            for line in env:
                if "=" in line:
                    k, v = line.split("=", 1)
                    d[k] = v
            email = d.get("SUPER_ADMIN_EMAIL")
            hv = d.get("SUPER_ADMIN_PASSWORD_HASH", "")
            print(f"PID {pid}: SUPER_ADMIN_EMAIL = {email}")
            print(f"PID {pid}: PASSWORD_HASH len = {len(hv)}, debut = {hv[:14]}")
            if email:
                print(">>> LES VARIABLES SONT DANS LE PROCESS NODE")
        except Exception as e:
            print(f"PID {pid}: lecture impossible ({e})")

    print()
    print("--- Test du login API ---")
    # Corps JSON ecrit dans un fichier temporaire pour eviter les quotes.
    payload = json.dumps({"email": "admin@afrikacash.store",
                          "password": "Jehovah@1914"})
    tmp = "/tmp/login-test.json"
    with open(tmp, "w") as f:
        f.write(payload)
    cmd = ["curl", "-s", "-o", "/tmp/login-body.json", "-w", "%{http_code}",
           "-X", "POST", "-H", "Content-Type: application/json",
           "--data", f"@{tmp}", "http://127.0.0.1:3000/api/auth/super-admin"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    code = r.stdout.strip()
    try:
        with open("/tmp/login-body.json") as f:
            body = f.read()
    except Exception:
        body = "(corps vide)"
    print("HTTP:", code)
    print("Corps:", body[:400])
    if code == "200":
        print(">>> CONNEXION REUSSIE : super admin fonctionne !")
    elif code == "503" and "non configure" in body:
        print(">>> Encore 'non configure' : le env n'arrive pas jusqu'aux routes.")
    elif code == "401":
        print(">>> Le compte est configure mais identifiants invalides (mauvais mdp/email).")
    print("FINI")


if __name__ == "__main__":
    main()