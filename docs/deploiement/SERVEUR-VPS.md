# Installer l'application sur votre propre serveur

Ce guide part d'un serveur vide et s'arrete a un site en ligne, en HTTPS, avec
ses sauvegardes automatiques. Il n'y a plus ni Vercel, ni Upstash, ni quota
mensuel : les donnees vivent dans un dossier du serveur.

Chaque etape est a faire dans l'ordre. Les commandes sont a recopier telles
quelles, sauf les valeurs entre chevrons `<...>`, a remplacer par les votres.

---

## Ce qu'il faut avoir sous la main

| Element | Detail |
| --- | --- |
| Un serveur (VPS) | Ubuntu 22.04 ou 24.04, 2 Go de memoire minimum, 20 Go de disque |
| Un nom de domaine | par exemple `assemblee.exemple.org` |
| L'acces SSH au serveur | l'utilisateur `root` ou un compte avec `sudo` |
| Votre PC Windows | avec le projet, pour deux commandes seulement (etapes 4, 10 et 11) |

**Le nom de domaine n'est pas optionnel.** Une adresse IP nue ne peut pas
recevoir de certificat HTTPS, et l'application Android refuse de se connecter
sans HTTPS. Si vous n'en avez pas encore, il faut en prendre un avant de
commencer — c'est la seule chose que ce guide ne peut pas faire a votre place.

---

## Etape 1 — Faire pointer le domaine vers le serveur

Chez celui qui vous a vendu le domaine, creez un enregistrement `A` :

```
Type : A       Nom : @  (ou le sous-domaine)       Valeur : <IP-DU-SERVEUR>
```

Puis, depuis votre PC, verifiez que ca a pris effet (cela peut prendre de
quelques minutes a quelques heures) :

```bash
nslookup assemblee.exemple.org
```

L'adresse affichee doit etre celle de votre serveur. **N'allez pas plus loin
avant que ce soit le cas** : Let's Encrypt refuserait le certificat.

---

## Etape 2 — Se connecter au serveur et installer Docker

```bash
ssh root@<IP-DU-SERVEUR>
```

Une fois connecte :

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
docker --version
```

Ouvrez les deux seuls ports necessaires, et fermez le reste :

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

La base de donnees n'a pas besoin d'un port ouvert : elle n'est joignable que
depuis l'interieur du serveur.

---

## Etape 3 — Recuperer le code

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/Simon571/app-gestionnaire.git
cd app-gestionnaire
git checkout multi-assemblees
```

Le projet est desormais dans `/opt/app-gestionnaire`. Toutes les commandes des
etapes suivantes se lancent depuis ce dossier.

---

## Etape 4 — Preparer le mot de passe super admin (sur votre PC Windows)

Le serveur n'a pas Node.js installe, et il n'en a pas besoin. Cette seule
commande se lance donc sur votre PC, dans le dossier du projet :

```bash
npm run hash:password
```

Le mot de passe est demande a l'ecran : il n'apparait ni dans la commande, ni
dans l'historique du terminal. La reponse ressemble a ceci :

```
SUPER_ADMIN_EMAIL=votre@email
SUPER_ADMIN_PASSWORD_HASH=pbkdf2$210000$...$...
```

Gardez ces deux lignes de cote : elles vont dans le fichier de l'etape 5.
Ce qui est stocke sur le serveur n'est pas le mot de passe mais son empreinte ;
personne ne peut le retrouver a partir de la, pas meme vous — notez-le dans un
gestionnaire de mots de passe.

---

## Etape 5 — Remplir le fichier de configuration

De retour sur le serveur :

```bash
cp .env.server.example .env
nano .env
```

Le fichier explique chaque ligne. Voici les valeurs a produire, chacune avec la
commande qui la genere (a lancer sur le serveur, dans un autre terminal ou avant
d'ouvrir `nano`) :

| Ligne | Comment obtenir la valeur |
| --- | --- |
| `DOMAIN` | votre domaine, sans `https://` ni barre finale |
| `ADMIN_EMAIL` | votre email (avertissement d'expiration du certificat) |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD_HASH` | les deux lignes de l'etape 4 |
| `ASSEMBLY_ID` / `ASSEMBLY_PIN` / `ASSEMBLY_NAME` | la premiere assemblee, creee au premier demarrage |
| `API_ACCESS_TOKEN` | `openssl rand -hex 24` |
| `API_AUTH_MODE` | laisser `report` pour l'instant (voir etape 12) |

Enregistrez (`Ctrl+O`, `Entree`, `Ctrl+X`), puis protegez le fichier — il
contient tous les secrets du site :

```bash
chmod 600 .env
```

---

## Etape 6 — Demarrer

Le dossier `data` est celui ou l'application ecrit. A l'interieur du conteneur
elle tourne sous un compte sans privileges, numero 1000 : il faut lui donner ce
dossier, sinon rien ne peut etre enregistre.

```bash
mkdir -p data
chown -R 1000:1000 data
```

Puis, la commande qui construit tout et lance le site :

```bash
docker compose up -d --build
```

La premiere fois, comptez 5 a 10 minutes : le serveur telecharge les
dependances et compile l'application. Les fois suivantes sont bien plus rapides.

Trois services demarrent : le site (`app`), la base de donnees (`db`), et le
portier qui obtient le certificat HTTPS tout seul (`proxy`).

---

## Etape 7 — Verifier que tout va bien

```bash
docker compose ps
```

Les trois lignes doivent indiquer `running` (et `healthy` pour `db`).

```bash
curl -I https://assemblee.exemple.org
```

Attendu : `HTTP/2 200`. Si vous voyez une erreur de certificat, patientez une
minute — Caddy est peut-etre encore en train de l'obtenir — puis reessayez.

En cas de souci, les journaux disent toujours pourquoi :

```bash
docker compose logs -f app      # le site
docker compose logs -f proxy    # le certificat HTTPS
```

Ouvrez enfin le site dans un navigateur, et connectez-vous a la console qui gere
les assemblees et les abonnements :

```
https://assemblee.exemple.org/super-admin/login
```

avec l'email et le mot de passe de l'etape 4. Regenerez aussitot le PIN de la
premiere assemblee depuis cette console : l'ancien PIN avait ete publie dans le
code du navigateur, il ne doit plus servir.

---

## Etape 8 — Rapatrier les donnees restees chez Vercel

Le site tourne, mais il est vide. Les familles, les rapports de predication et
les comptes des proclamateurs sont encore dans le stockage Vercel Blob.

Sur votre PC, dans le dossier du projet, avec `BLOB_READ_WRITE_TOKEN` present
dans `.env.local` :

```bash
npm run recover:blob -- --to=files --id=<ASSEMBLY_ID>
```

Rien n'est ecrit : la commande montre seulement ce qu'elle ferait. Si la liste
vous convient, relancez avec `--apply` :

```bash
npm run recover:blob -- --to=files --apply --id=<ASSEMBLY_ID>
```

Les fichiers apparaissent dans `data/tenants/<ASSEMBLY_ID>/`. Envoyez-les au
serveur :

```bash
scp -r data/tenants root@<IP-DU-SERVEUR>:/opt/app-gestionnaire/data/
```

Puis, sur le serveur, redonnez le dossier a l'application et relancez-la :

```bash
chown -R 1000:1000 data
docker compose restart app
```

> **Si la commande echoue avec « Your store is blocked »**, le quota mensuel du
> stockage Vercel est depasse et la lecture est refusee jusqu'a sa remise a zero
> (**1er octobre 2026**). Trois possibilites : telecharger les fichiers un par un
> depuis le bouton *Download* de la console Vercel, attendre cette date, ou
> passer l'offre en Pro le temps de la recuperation. Le blocage n'efface rien —
> les donnees sont intactes et attendent.

---

## Etape 9 — Mettre en place la sauvegarde automatique

```bash
chmod +x deploy/*.sh
./deploy/sauvegarde.sh
```

Deux fichiers apparaissent dans `sauvegardes/` : les donnees et la base. Une
fois que cela marche, faites-le tourner chaque nuit — `crontab -e`, puis cette
ligne a la fin du fichier :

```
12 3 * * * cd /opt/app-gestionnaire && ./deploy/sauvegarde.sh >> /var/log/sauvegarde-gestionnaire.log 2>&1
```

Les copies de plus de 30 jours sont effacees automatiquement.

**Une sauvegarde qui reste sur le serveur ne protege de rien** si ce serveur est
perdu. Recopiez regulierement le dossier `sauvegardes/` ailleurs, par exemple
depuis votre PC :

```bash
scp -r root@<IP-DU-SERVEUR>:/opt/app-gestionnaire/sauvegardes ./sauvegardes-serveur
```

---

## Etape 10 — Republier l'application Android

L'adresse du serveur est inscrite dans l'APK au moment de sa fabrication. Les
telephones deja equipes continuent d'interroger l'ancienne adresse : il faut
donc un nouvel APK, a reinstaller sur chaque telephone.

Sur votre PC, dans `flutter_app/` :

```bash
flutter build apk --release --dart-define=API_BASE=https://assemblee.exemple.org
```

Le fichier obtenu est dans
`flutter_app/build/app/outputs/flutter-apk/app-release.apk`.

Un utilisateur qui ne peut pas reinstaller tout de suite a une solution
d'attente : dans **Parametres** de l'application, il peut saisir la nouvelle
adresse a la main. Ce qui est saisi la l'emporte sur l'adresse de fabrication.

---

## Etape 11 — Reconstruire l'installateur Windows

Le programme installe sur les PC est une fenetre qui affiche le site distant.
Son adresse est ecrite dans un fichier de configuration ; une commande s'en
charge, sur votre PC :

```bash
APP_URL=https://assemblee.exemple.org npm run msi:url
npm run tauri:build:release
```

La premiere commande affiche l'ancienne et la nouvelle adresse. Sans argument,
elle ne modifie rien et rappelle seulement l'adresse actuelle — pratique pour
verifier. L'installateur obtenu est dans
`src-tauri/target/release/bundle/`.

---

## Etape 12 — Fermer la porte

Tant que d'anciens telephones et d'anciens PC interrogent le serveur, les
requetes non authentifiees sont acceptees et seulement signalees dans les
journaux. Quand le nouvel APK et le nouveau MSI sont installes partout,
passez en mode strict :

```bash
nano .env          # API_AUTH_MODE=enforce
docker compose up -d
```

Avant de basculer, verifiez dans les journaux qu'il n'y a plus d'appels
signales :

```bash
docker compose logs app | grep -i "auth" | tail -30
```

Si des lignes apparaissent encore, c'est qu'un appareil n'a pas ete mis a jour :
basculer maintenant le couperait.

---

## Plus tard : mettre a jour le site

Une seule commande, sur le serveur. Elle sauvegarde d'abord, recupere le code,
reconstruit, relance, et verifie que le site repond :

```bash
cd /opt/app-gestionnaire
./deploy/mise-a-jour.sh
```

---

## En cas de probleme

| Symptome | Cause la plus probable | Quoi faire |
| --- | --- | --- |
| Erreur de certificat dans le navigateur | le domaine ne pointe pas encore vers le serveur, ou le port 80 est ferme | `nslookup votre-domaine`, `ufw status`, puis `docker compose logs proxy` |
| « 502 Bad Gateway » | le site n'a pas fini de demarrer, ou il a plante | `docker compose logs -f app` |
| Le site repond mais rien ne s'enregistre | le dossier `data` n'appartient pas au compte 1000 | `chown -R 1000:1000 data && docker compose restart app` |
| Impossible de se connecter du tout | `SESSION_SECRET` vide ou trop court | le remplir (32 caracteres) puis `docker compose up -d` |
| L'application Android n'atteint pas le serveur | l'APK vise encore l'ancienne adresse | etape 10, ou saisie manuelle dans **Parametres** |
| La construction s'arrete par manque de memoire | moins de 2 Go de RAM | ajouter un fichier d'echange : `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |

Pour tout regarder d'un coup :

```bash
docker compose ps
docker compose logs --tail=50
df -h                    # place disque restante
```

---

## Deux ou trois choses a savoir

**Ou sont les donnees.** Dans `/opt/app-gestionnaire/data`, en fichiers JSON
lisibles. C'est l'absence des variables Vercel et Upstash dans `.env` qui
produit ce comportement : rien a activer. La base PostgreSQL est demarree et
sauvegardee, mais encore vide — elle servira quand les donnees y seront
transferees, sans changer quoi que ce soit a l'installation decrite ici.

**Changer de domaine plus tard** oblige a reconstruire (`docker compose up -d
--build`), a refaire l'APK et le MSI : l'adresse publique est figee dans le
JavaScript envoye au navigateur, pas lue au demarrage.

**Trois fichiers portent encore l'ancienne adresse Vercel** :
`public/robots.txt`, `public/sitemap.xml` et `public/app/version.json`. Ils ne
genent ni la connexion ni la synchronisation — seulement le referencement et
l'annonce de mise a jour. A corriger a la main si cela compte pour vous.

**L'ancien site Vercel continue de fonctionner** apres cette installation. Rien
n'oblige a l'arreter tout de suite : gardez-le le temps de verifier le nouveau,
puis supprimez le projet quand vous n'en avez plus besoin.
