# ⚡ DÉMARRAGE RAPIDE - 5 MINUTES

Vous voulez tester rapidement ? Suivez ces 3 étapes :

## 1️⃣ Tester l'application en mode développement

```powershell
# Ouvrir PowerShell dans le dossier du projet
cd C:\Users\Public\Documents\app-gestionnaire

# Lancer l'application Tauri
npm run tauri:dev
```

✅ L'application Windows s'ouvre automatiquement

---

## 2️⃣ Build l'application Windows

```powershell
# Exécuter le script automatique
.\build-tauri.ps1
```

📦 Vos fichiers `.msi` et `.exe` seront dans :
```
src-tauri\target\release\bundle\
```

---

## 3️⃣ Publier sur Vercel

```powershell
# Installer Vercel CLI (première fois seulement)
npm install -g vercel

# Se connecter (première fois seulement)
vercel login

# Déployer
.\deploy-vercel.ps1
```

🌐 Votre site est en ligne !

---

## 📖 Guide complet

Pour des instructions détaillées, consultez :
**[GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)**

---

## ⚠️ Important avant de déployer

### 1. Mettre à jour l'URL GitHub

Fichier : [`src/app/[locale]/download/page.tsx`](src/app/[locale]/download/page.tsx) (ligne 130)

```typescript
// REMPLACEZ CECI :
const githubReleaseUrl = 'https://github.com/VOTRE-USERNAME/app-gestionnaire/releases/latest';

// PAR VOTRE URL RÉELLE :
const githubReleaseUrl = 'https://github.com/jean-dupont/app-gestionnaire/releases/latest';
```

### 2. Mettre à jour le domaine Vercel

Après le premier déploiement, mettez à jour :
- [`src/app/robots.ts`](src/app/robots.ts)
- [`src/app/sitemap.ts`](src/app/sitemap.ts)

Remplacez `https://votre-domaine.vercel.app` par votre URL Vercel réelle.

---

## 🎯 Résultat final

Après ces étapes, vous aurez :
- ✅ Application Windows installable (`.msi` et `.exe`)
- ✅ Site web professionnel sur Vercel
- ✅ Page de téléchargement SEO-optimisée
- ✅ Bouton de téléchargement intelligent (détection Windows)
- ✅ Redirection automatique vers GitHub Releases

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers :
- ✅ `next.config.tauri.ts` - Configuration Next.js pour export statique
- ✅ `build-tauri.ps1` - Script de build automatique
- ✅ `deploy-vercel.ps1` - Script de déploiement Vercel
- ✅ `src/app/[locale]/download/page.tsx` - Page de téléchargement
- ✅ `src/app/[locale]/download/metadata.ts` - SEO de la page download
- ✅ `src/app/robots.ts` - Configuration robots.txt
- ✅ `src/app/sitemap.ts` - Sitemap XML automatique
- ✅ `GUIDE-DEPLOIEMENT-COMPLET.md` - Documentation complète

### Fichiers modifiés :
- ✅ `src-tauri/tauri.conf.json` - Configuration Tauri optimisée
- ✅ `package.json` - Scripts npm ajoutés

---

## 🚨 Vérification avant build

Exécutez ces commandes pour vérifier :

```powershell
# Vérifier Node.js
node --version    # Doit être v18+

# Vérifier Rust
cargo --version   # Doit afficher une version

# Vérifier Git
git --version     # Doit afficher une version

# Tester le build Next.js
npm run build:tauri
```

Si tout fonctionne, vous êtes prêt !

---

**Questions ?** Consultez le [GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)
