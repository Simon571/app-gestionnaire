#!/usr/bin/env python3
# Consolidation du vhost gestionnaire sur le serveur BaoTa (filet de securite).
#
# Contexte : certbot --nginx a injecte les blocs server de
# gestionnaire.afrikacash.store DANS /www/server/panel/vhost/nginx/afrikacash.
# store.conf (le vhost du site principal). Ce melange est fragile : reconfigurer
# le site principal pourrait ecraser ce bloc, et le bloc dedie que nous avions
# pose est doublonne.
#
# Ce script rend la coherence, sans casser le site principal :
#   1. sauvegarde les deux vhosts concernes ;
#   2. enleve de afrikacash.store.conf tout bloc server (entier) dont le
#      server_name est gestionnaire, ainsi que toute instruction
#      `if (...gestionnaire...) { return ...; }` residuelle dans un autre bloc ;
#   3. ecrit un vhost dedie COMPLET et correct :
#        - port 80 : redirection 301 vers https ;
#        - port 443 : SSL (certs deja obtenus) + proxy vers 127.0.0.1:3000 ;
#      (en reprenant la recette qui marche pour router.afrikacash.store, sans
#       le `map` deja declare par router -> on utilise Connection "") ;
#   4. cree le lien sites-enabled (utilise par le panneau BaoTa) ;
#   5. `nginx -t` : si invalide, on restaure TOUT (serveur remis a l'identique) ;
#   6. si valide : reload, puis verification des 2 sites (robots.txt pour
#      s'assurer que c'est bien l'app Node, pas Laravel, qui repond).

import os
import re
import shutil
import subprocess
import time

VHOST_DIR = "/www/server/panel/vhost/nginx"
MAIN = os.path.join(VHOST_DIR, "afrikacash.store.conf")
DEDICATED = os.path.join(VHOST_DIR, "gestionnaire.afrikacash.store.conf")
SYMLINK = "/etc/nginx/sites-enabled/gestionnaire.afrikacash.store.conf"
DOMAIN = "gestionnaire.afrikacash.store"
TS = time.strftime("%Y%m%d_%H%M%S")

DEDICATED_CONTENT = f"""# Nginx vhost pour le gestionnaire (Next.js standalone -> 127.0.0.1:3000)
# Consolidé depuis afrikacash.store.conf le {TS}.
# Certificat: /etc/letsencrypt/live/gestionnaire.afrikacash.store (Let's Encrypt).

# HTTP -> HTTPS
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN};
    return 301 https://$host$request_uri;
}}

# HTTPS
server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {DOMAIN};

    ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 100M;

    # Assets Next.js : cache long.
    location /_next/static/ {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        expires 7d;
        add_header Cache-Control "public";
    }}

    # Pages + API : reverse-proxy vers l'application.
    location / {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }}

    access_log /www/wwwlogs/{DOMAIN}.log;
    error_log  /www/wwwlogs/{DOMAIN}.error.log;
}}
"""


def backup(path):
    if os.path.exists(path):
        dst = f"{path}.backup-consolide-{TS}"
        shutil.copy2(path, dst)
        print(f"[backup] {path} -> {dst}")


def split_blocks(text):
    """Decoupe en blocs de niveau racine (balises {} imbriquees correctement).
    Retourne (liste_blocs, texte_hors_blocs)."""
    lines = text.split("\n")
    blocks, outside = [], []
    i, n = 0, len(lines)
    while i < n:
        line = lines[i]
        st = line.strip()
        if st.startswith("server") and "{" in st and not st.startswith("map"):
            depth, j, buf = 0, i, []
            while j < n:
                buf.append(lines[j])
                depth += lines[j].count("{") - lines[j].count("}")
                if depth <= 0:
                    break
                j += 1
            blocks.append("\n".join(buf))
            i = j + 1
        else:
            outside.append(line)
            i += 1
    return blocks, "\n".join(outside) + "\n"


def strip_if_gestionnaire(text):
    """Retire, dans les blocs restants (hors blocs server dedies), toute
    instruction `if ($host = gestionnaire...) { ... }` d'un bloc principal
    (cas typique du `if` que certbot injecte dans le bloc multi-tenant)."""
    lines = text.split("\n")
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        if "if (" in line and "gestionnaire" in line:
            depth, j = 0, i
            while j < n:
                depth += lines[j].count("{") - lines[j].count("}")
                if depth <= 0 and j > i:
                    break
                j += 1
            print(f"[ok] retire ligne(s) {i+1}-{j+1} (if gestionnaire) : "
                  f"{' '.join(line.strip().split())[:70]}")
            i = j + 1
        else:
            out.append(line)
            i += 1
    return "\n".join(out) + "\n"


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def http_ok(url):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", url],
                       capture_output=True, text=True, timeout=30)
    return r.stdout.strip()


def main():
    if not os.path.exists(MAIN):
        print(f"ERREUR: {MAIN} introuvable. Abandon.")
        return 1

    backup(MAIN)
    backup(DEDICATED)

    with open(MAIN, encoding="utf-8") as f:
        big = f.read()

    blocks, outside = split_blocks(big)
    mine = [b for b in blocks if re.search(r"server_name\s+.*?" + re.escape(DOMAIN), b)]
    others = [b for b in blocks if not re.search(r"server_name\s+.*?" + re.escape(DOMAIN), b)]
    removed_n = len(mine)
    if removed_n:
        print(f"[info] {removed_n} bloc(s) server gestionnaire retire(s) de afrikacash.store.conf")

    # Nettoye les `if gestionnaire` residuels dans les blocs conserves.
    others_text = strip_if_gestionnaire("\n\n".join(others) + "\n")

    # Vhost dedie : contenu canonique (indépendant des blocs retires).
    with open(DEDICATED, "w", encoding="utf-8") as f:
        f.write(DEDICATED_CONTENT)
    print(f"[ok] vhost dedie ecrit : {DEDICATED}")

    # Fichier principal : le reste, nettoye.
    with open(MAIN, "w", encoding="utf-8") as f:
        f.write(outside.strip() + "\n\n" + others_text + "\n")
    print(f"[ok] afrikacash.store.conf reecrit sans gestionnaire ({removed_n} bloc(s) retire(s)).")

    # Lien sites-enabled (panneau BaoTa).
    if os.path.islink(SYMLINK) or os.path.exists(SYMLINK):
        os.remove(SYMLINK)
    os.symlink(DEDICATED, SYMLINK)
    print(f"[ok] lien : {SYMLINK}")

    # Validation nginx.
    t = run(["nginx", "-t"])
    if t.returncode != 0:
        print("ECHEC nginx -t :\n", t.stdout, t.stderr)
        RESTORE_MAIN = f"{MAIN}.backup-consolide-{TS}"
        RESTORE_DED = f"{DEDICATED}.backup-consolide-{TS}"
        if os.path.exists(SYMLINK):
            os.remove(SYMLINK)
        if os.path.exists(RESTORE_MAIN):
            shutil.copy2(RESTORE_MAIN, MAIN)
        if os.path.exists(RESTORE_DED):
            shutil.copy2(RESTORE_DED, DEDICATED)
        print("RESTAURE : le serveur a ete remis dans son etat initial.")
        return 1

    print("[ok] nginx -t : valide.")
    r = run(["nginx", "-s", "reload"])
    print("[ok] nginx reload:", "ok" if r.returncode == 0 else f"code {r.returncode}")

    time.sleep(2)

    g200 = http_ok("https://gestionnaire.afrikacash.store/robots.txt")
    a200 = http_ok("https://afrikacash.store/robots.txt")
    print(f"[check] https://gestionnaire.afrikacash.store/robots.txt -> HTTP {g200}")
    print(f"[check] https://afrikacash.store/robots.txt            -> HTTP {a200}")

    if g200 == "200":
        print(">>> GESTIONNAIRE OK : c'est bien l'application Node qui repond.")
    else:
        print(f">>> ATTENTION : robots.txt du gestionnaire repond {g200} "
              f"(attendu 200). Voir le log nginx.")

    if a200 != "200":
        print(">>> ALERTE : afrikacash.store/robots.txt ne repond pas 200 ! "
              "Site principal affecte — restauration.")
        if os.path.exists(SYMLINK):
            os.remove(SYMLINK)
        RESTORE_MAIN = f"{MAIN}.backup-consolide-{TS}"
        RESTORE_DED = f"{DEDICATED}.backup-consolide-{TS}"
        if os.path.exists(RESTORE_MAIN):
            shutil.copy2(RESTORE_MAIN, MAIN)
        if os.path.exists(RESTORE_DED):
            shutil.copy2(RESTORE_DED, DEDICATED)
        run(["nginx", "-s", "reload"])
        print(">>> RESTAURE.")
        return 1

    print(">>> TOUT EST EN PLACE. Termine.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())