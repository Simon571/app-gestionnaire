# 🗺️ CARTE DE NAVIGATION DU PROJET

Vous êtes perdu ? Ce fichier vous guide vers le bon document.

---

## 🚀 JE VEUX JUSTE COMMENCER

**👉 Ouvrez : [LISEZ-MOI-DABORD.txt](LISEZ-MOI-DABORD.txt)**

Ou directement : **[TOUT-EST-PRET.md](TOUT-EST-PRET.md)**

---

## 📖 PAR OÙ COMMENCER ?

### Vous êtes débutant ?
1. **[LISEZ-MOI-DABORD.txt](LISEZ-MOI-DABORD.txt)** - Vue d'ensemble visuelle
2. **[DEMARRAGE-RAPIDE.md](DEMARRAGE-RAPIDE.md)** - Testez en 5 minutes
3. **[GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)** - Instructions pas à pas

### Vous êtes développeur expérimenté ?
1. **[TOUT-EST-PRET.md](TOUT-EST-PRET.md)** - Résumé technique
2. **[README-PRODUCTION.md](README-PRODUCTION.md)** - Documentation projet
3. Exécutez `.\verifier-config.ps1` et `.\build-tauri.ps1`

---

## 📚 INDEX DE LA DOCUMENTATION

### 📋 Guides principaux

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| **[LISEZ-MOI-DABORD.txt](LISEZ-MOI-DABORD.txt)** | Vue d'ensemble ASCII art | Premier fichier à ouvrir |
| **[TOUT-EST-PRET.md](TOUT-EST-PRET.md)** | Récapitulatif complet | Comprendre ce qui a été fait |
| **[DEMARRAGE-RAPIDE.md](DEMARRAGE-RAPIDE.md)** | Guide 5 minutes | Tester rapidement |
| **[GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)** | Guide détaillé | Déploiement production |
| **[CHECKLIST-DEPLOIEMENT.md](CHECKLIST-DEPLOIEMENT.md)** | Liste de vérification | Avant chaque déploiement |

### 📖 Documentation technique

| Document | Description |
|----------|-------------|
| **[README-PRODUCTION.md](README-PRODUCTION.md)** | README professionnel pour GitHub |
| **[CHANGELOG.md](CHANGELOG.md)** | Historique des versions |
| **[.env.example](.env.example)** | Template variables d'environnement |

### ⚙️ Configuration

| Fichier | Description |
|---------|-------------|
| **[next.config.ts](next.config.ts)** | Config Next.js pour Vercel |
| **[next.config.tauri.ts](next.config.tauri.ts)** | Config Next.js pour Tauri |
| **[src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)** | Configuration Tauri |
| **[vercel.json](vercel.json)** | Configuration Vercel |
| **[package.json](package.json)** | Dépendances et scripts npm |

### 🎨 Pages de l'application

| Fichier | Description |
|---------|-------------|
| **[src/app/\[locale\]/download/page.tsx](src/app/[locale]/download/page.tsx)** | Page de téléchargement |
| **[src/app/robots.ts](src/app/robots.ts)** | Configuration robots.txt |
| **[src/app/sitemap.ts](src/app/sitemap.ts)** | Génération sitemap XML |
| **[src/app/layout-metadata.ts](src/app/layout-metadata.ts)** | Meta tags SEO |

### 🔧 Scripts PowerShell

| Script | Description | Usage |
|--------|-------------|-------|
| **[build-tauri.ps1](build-tauri.ps1)** | Build automatique Windows | `.\build-tauri.ps1` |
| **[deploy-vercel.ps1](deploy-vercel.ps1)** | Déploiement Vercel | `.\deploy-vercel.ps1` |
| **[verifier-config.ps1](verifier-config.ps1)** | Vérification configuration | `.\verifier-config.ps1` |
| **[update-version.ps1](update-version.ps1)** | Mise à jour version | `.\update-version.ps1 -Version "1.1.0"` |

---

## 🎯 SCÉNARIOS D'UTILISATION

### Je veux tester l'application en développement
1. Ouvrez PowerShell dans le dossier du projet
2. Exécutez : `npm run tauri:dev`
3. L'application s'ouvre automatiquement

### Je veux builder l'application Windows
1. Exécutez : `.\build-tauri.ps1`
2. Les fichiers seront dans : `src-tauri\target\release\bundle\`

### Je veux déployer sur Vercel
1. Première fois : `npm install -g vercel` puis `vercel login`
2. Exécutez : `.\deploy-vercel.ps1`

### Je veux publier une nouvelle version
1. Exécutez : `.\update-version.ps1 -Version "1.1.0"`
2. Complétez le CHANGELOG.md
3. Exécutez : `.\build-tauri.ps1`
4. Créez une release sur GitHub

### Je veux vérifier ma configuration
1. Exécutez : `.\verifier-config.ps1`
2. Corrigez les erreurs affichées

### J'ai un problème
1. Consultez **[GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)** section "Problèmes courants"
2. Vérifiez les prérequis : `.\verifier-config.ps1`
3. Nettoyez : `Remove-Item node_modules -Recurse -Force; npm install`

---

## 🗂️ STRUCTURE DU PROJET

```
app-gestionnaire/
│
├─ 📁 Documentation (COMMENCEZ ICI)
│  ├─ LISEZ-MOI-DABORD.txt           ⭐ Vue d'ensemble
│  ├─ TOUT-EST-PRET.md               ⭐ Résumé complet
│  ├─ DEMARRAGE-RAPIDE.md            ⭐ Guide 5 min
│  ├─ GUIDE-DEPLOIEMENT-COMPLET.md   📘 Guide détaillé
│  ├─ CHECKLIST-DEPLOIEMENT.md       ✓  Liste vérification
│  ├─ CARTE-NAVIGATION.md            🗺️ Ce fichier
│  ├─ README-PRODUCTION.md           📖 README GitHub
│  └─ CHANGELOG.md                   📝 Historique
│
├─ 🔧 Scripts PowerShell
│  ├─ build-tauri.ps1                🏗️ Build Windows
│  ├─ deploy-vercel.ps1              🌐 Deploy web
│  ├─ verifier-config.ps1            ✓  Vérification
│  └─ update-version.ps1             🔄 Update version
│
├─ ⚙️ Configuration
│  ├─ next.config.ts                 (Vercel)
│  ├─ next.config.tauri.ts           (Tauri)
│  ├─ package.json                   (NPM)
│  ├─ vercel.json                    (Vercel)
│  └─ .env.example                   (Env vars)
│
├─ 📂 src/
│  ├─ app/
│  │  ├─ [locale]/download/          🎯 Page téléchargement
│  │  ├─ robots.ts                   🤖 SEO
│  │  ├─ sitemap.ts                  🗺️ SEO
│  │  └─ layout-metadata.ts          🏷️ Meta tags
│  ├─ components/                    🧩 Composants React
│  └─ lib/                           🛠️ Utilitaires
│
└─ 📂 src-tauri/
   ├─ src/                           🦀 Code Rust
   ├─ icons/                         🎨 Icônes app
   └─ tauri.conf.json                ⚙️ Config Tauri
```

---

## ⚡ COMMANDES ESSENTIELLES

### Vérification
```powershell
.\verifier-config.ps1              # Vérifier la config complète
node --version                      # Version Node.js
cargo --version                     # Version Rust
```

### Développement
```powershell
npm run dev                         # Next.js seul
npm run tauri:dev                   # Application complète
```

### Production
```powershell
.\build-tauri.ps1                   # Build Windows
.\deploy-vercel.ps1                 # Deploy web
.\update-version.ps1 -Version "X.Y.Z"  # Nouvelle version
```

### Nettoyage
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item out -Recurse -Force
Remove-Item .next -Recurse -Force
npm install
```

---

## 📞 AIDE RAPIDE

| Problème | Solution |
|----------|----------|
| "Rust not found" | `winget install Rustlang.Rust.MSVC` |
| "Build failed" | Nettoyage puis `npm install` |
| "Page 404 sur Vercel" | Vérifier `next.config.ts` |
| "App ne démarre pas" | Vérifier antivirus, installer en admin |

---

## ✅ CHECKLIST RAPIDE

Avant de déployer, vérifiez :

- [ ] `.\verifier-config.ps1` ✅ sans erreurs
- [ ] URL GitHub mise à jour dans `download/page.tsx`
- [ ] `npm run tauri:dev` fonctionne
- [ ] `.\build-tauri.ps1` réussi
- [ ] Fichiers .msi et .exe créés
- [ ] `.\deploy-vercel.ps1` réussi
- [ ] URLs Vercel mises à jour dans robots.ts et sitemap.ts

---

## 🎓 PARCOURS D'APPRENTISSAGE

### Niveau 1 : Découverte (5 min)
1. Lire **[LISEZ-MOI-DABORD.txt](LISEZ-MOI-DABORD.txt)**
2. Exécuter `.\verifier-config.ps1`
3. Tester `npm run tauri:dev`

### Niveau 2 : Build local (15 min)
1. Lire **[DEMARRAGE-RAPIDE.md](DEMARRAGE-RAPIDE.md)**
2. Modifier l'URL GitHub dans `download/page.tsx`
3. Exécuter `.\build-tauri.ps1`

### Niveau 3 : Déploiement (30 min)
1. Lire **[GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)**
2. Publier sur GitHub Releases
3. Déployer sur Vercel
4. Vérifier avec **[CHECKLIST-DEPLOIEMENT.md](CHECKLIST-DEPLOIEMENT.md)**

### Niveau 4 : Maîtrise
1. Lire **[README-PRODUCTION.md](README-PRODUCTION.md)**
2. Comprendre l'architecture
3. Contribuer au projet

---

**🎯 Prêt à commencer ? Ouvrez [TOUT-EST-PRET.md](TOUT-EST-PRET.md) !**
