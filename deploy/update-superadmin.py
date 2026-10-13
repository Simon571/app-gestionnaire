#!/usr/bin/env python3
"""Met a jour SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD_HASH dans le .env du
serveur, puis relance l'application PM2.
"""
import subprocess

ENV = "/www/wwwroot/gestionnaire.afrikacash.store/.env"
NEW = {
    "SUPER_ADMIN_EMAIL": "admin@afrikacash.store",
    "SUPER_ADMIN_PASSWORD_HASH":
        r"pbkdf2$210000$fff29674f042df0ffa871167ce2a55e4$"
        r"f7213477b2f71de943c5f52951f1a178ff3768fa8a63f2ffa26bea4f1fef602d",
}

with open(ENV, encoding="utf-8") as f:
    lines = f.readlines()

out = []
for line in lines:
    stripped = line.rstrip("\n")
    key = stripped.split("=", 1)[0]
    if key in NEW:
        out.append(f"{key}={NEW[key]}\n")
        print(f"[ok] {key} maj")
    else:
        out.append(line)

with open(ENV, "w", encoding="utf-8") as f:
    f.writelines(out)

# Verification : le hash doit bien etre present et intact.
with open(ENV, encoding="utf-8") as f:
    content = f.read()
ok = "pbkdf2$210000$fff29674f042df0ffa871167ce2a55e4$f7213477b2f71de943c5f52951f1a178ff3768fa8a63f2ffa26bea4f1fef602d" in content
print("[verif] hash present et intact :", "OUI" if ok else "NON")

# Relance de l'application PM2 pour prendre en compte le nouveau .env.
r = subprocess.run(["pm2", "restart", "gestionnaire", "--update-env"],
                   capture_output=True, text=True)
print("[pm2]", r.stdout.strip().splitlines()[-1] if r.stdout.strip() else "code " + str(r.returncode))
print("[pm2]", r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "")
print("FINI")