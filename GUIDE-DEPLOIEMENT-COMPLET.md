# 🚀 GUIDE COMPLET DE DÉPLOIEMENT
## Gestionnaire d'Assemblée - Windows + Vercel

Ce guide vous permet de déployer votre application **sans aucune connaissance technique**. Suivez simplement les étapes dans l'ordre.

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#-prérequis)
2. [Configuration initiale](#-configuration-initiale)
3. [Build de l'application Windows](#-build-de-lapplication-windows)
4. [Publication sur GitHub Releases](#-publication-sur-github-releases)
5. [Déploiement du site web sur Vercel](#-déploiement-du-site-web-sur-vercel)
6. [Vérifications finales](#-vérifications-finales)

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ **Windows 10 ou 11** (64-bit)
- ✅ **Node.js 18+** installé ([Télécharger](https://nodejs.org/))
- ✅ **Git** installé ([Télécharger](https://git-scm.com/))
- ✅ Un compte **GitHub** ([S'inscrire](https://github.com/))
- ✅ Un compte **Vercel** ([S'inscrire](https://vercel.com/)) - gratuit
- ✅ **Rust** installé ([Télécharger](https://www.rust-lang.org/tools/install))

### Vérification rapide

Ouvrez PowerShell et exécutez :

```powershell
node --version    # Doit afficher v18 ou supérieur
git --version     # Doit afficher une version
cargo --version   # Doit afficher une version de Rust
```

---

## 🔧 Configuration initiale

### 1. Cloner votre repository

Si ce n'est pas déjà fait :

```powershell
cd C:\Users\Public\Documents
git clone https://github.com/VOTRE-USERNAME/app-gestionnaire.git
cd app-gestionnaire
```

### 2. Installer les dépendances

```powershell
npm install
```

### 3. Configurer l'URL de votre site

**Fichier à modifier :** [`src/app/[locale]/download/page.tsx`](src/app/[locale]/download/page.tsx)

Ligne 130, remplacez :
```typescript
const githubReleaseUrl = 'https://github.com/VOTRE-USERNAME/app-gestionnaire/releases/latest';
```

Par votre véritable URL GitHub (exemple) :
```typescript
const githubReleaseUrl = 'https://github.com/jean-dupont/app-gestionnaire/releases/latest';
```

**Fichiers à modifier pour le SEO :** 
- [`src/app/robots.ts`](src/app/robots.ts) - ligne 10
- [`src/app/sitemap.ts`](src/app/sitemap.ts) - ligne 4

Remplacez `https://votre-domaine.vercel.app` par votre domaine Vercel (vous l'obtiendrez à l'étape 5).

---

## 🏗️ Build de l'application Windows

### Option 1 : Script automatique (RECOMMANDÉ)

```powershell
.\build-tauri.ps1
```

Ce script fait tout automatiquement :
1. Nettoie les builds précédents
2. Installe les dépendances
3. Build Next.js en mode export statique
4. Compile l'application Tauri

### Option 2 : Commandes manuelles

```powershell
# 1. Nettoyer
Remove-Item -Path "out" -Recurse -ErrorAction SilentlyContinue

# 2. Build Next.js
$env:NEXT_CONFIG = "next.config.tauri.ts"
npm run build:tauri

# 3. Build Tauri
npm run tauri build -- --bundles msi nsis
```

### 📦 Résultat

Vos fichiers d'installation se trouvent dans :
```
src-tauri\target\release\bundle\
├── msi\
│   └── app-gestionnaire_1.0.0_x64_fr-FR.msi
└── nsis\
    └── app-gestionnaire_1.0.0_x64-setup.exe
```

---

## 📤 Publication sur GitHub Releases

### 1. Créer un tag Git

```powershell
git tag v1.0.0
git push origin v1.0.0
```

### 2. Créer une Release sur GitHub

1. Allez sur votre repository GitHub
2. Cliquez sur **"Releases"** (à droite)
3. Cliquez sur **"Draft a new release"**
4. Remplissez :
   - **Tag version:** `v1.0.0`
   - **Release title:** `Version 1.0.0 - Première version stable`
   - **Description:**
     ```markdown
     ## 🎉 Première version officielle
     
     ### ✨ Fonctionnalités
     - Gestion complète de l'assemblée
     - Rapports de prédication
     - Planification VCM
     - Gestion des territoires
     
     ### 📥 Installation
     Téléchargez le fichier `.msi` ou `.exe` ci-dessous et exécutez-le.
     
     **Configuration requise:** Windows 10/11 (64-bit)
     ```

5. Glissez-déposez vos fichiers :
   - `app-gestionnaire_1.0.0_x64_fr-FR.msi`
   - `app-gestionnaire_1.0.0_x64-setup.exe`

6. Cochez **"Set as the latest release"**
7. Cliquez sur **"Publish release"**

✅ **Votre application est maintenant téléchargeable !**

---

## 🌐 Déploiement du site web sur Vercel

### 1. Installer Vercel CLI

```powershell
npm install -g vercel
```

### 2. Connexion à Vercel

```powershell
vercel login
```

Suivez les instructions dans votre navigateur.

### 3. Déploiement automatique (RECOMMANDÉ)

```powershell
.\deploy-vercel.ps1
```

### 4. Déploiement manuel

```powershell
# Build pour production
npm run build:vercel

# Déployer
vercel --prod
```

### 5. Configuration après déploiement

Après le déploiement, Vercel vous donnera une URL comme :
```
https://app-gestionnaire-abc123.vercel.app
```

**🔄 Retournez à l'étape "Configuration initiale"** et mettez à jour :
- [`src/app/robots.ts`](src/app/robots.ts)
- [`src/app/sitemap.ts`](src/app/sitemap.ts)

Remplacez `https://votre-domaine.vercel.app` par votre URL Vercel.

**Puis redéployez :**
```powershell
.\deploy-vercel.ps1
```

---

## ✅ Vérifications finales

### 1. Tester l'application Windows

1. Allez dans `src-tauri\target\release\bundle\msi\`
2. Double-cliquez sur le `.msi`
3. Installez l'application
4. Lancez-la depuis le menu Démarrer
5. **Vérifiez que l'interface est identique au mode dev**

### 2. Tester le site Vercel

1. Ouvrez votre URL Vercel dans un navigateur
2. Allez sur `/fr/download`
3. Cliquez sur **"Télécharger pour Windows"**
4. Vérifiez que vous êtes redirigé vers GitHub Releases

### 3. Tester le SEO

Vérifiez votre site avec ces outils :
- **Google Search Console:** https://search.google.com/search-console
- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Meta Tags Validator:** https://metatags.io/

---

## 🔄 Mises à jour futures

Pour publier une nouvelle version :

### 1. Mettre à jour la version

Fichier [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json) :
```json
{
  "version": "1.1.0"
}
```

Fichier [`package.json`](package.json) :
```json
{
  "version": "1.1.0"
}
```

### 2. Build et publier

```powershell
# Build
.\build-tauri.ps1

# Tag Git
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main
git push origin v1.1.0

# Créer GitHub Release (même processus qu'avant)
```

---

## 📚 Commandes de référence rapide

### Développement

```powershell
# Lancer en mode dev
npm run dev

# Lancer Tauri en mode dev
npm run tauri:dev
```

### Production

```powershell
# Build Windows
.\build-tauri.ps1

# Deploy Vercel
.\deploy-vercel.ps1
```

### Nettoyage

```powershell
# Nettoyer les caches
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "out" -Recurse -Force
Remove-Item -Path ".next" -Recurse -Force
npm install
```

---

## ❓ Problèmes courants

### "Rust not found"
```powershell
# Installer Rust
winget install Rustlang.Rust.MSVC
```

### "Build failed"
```powershell
# Nettoyer et réinstaller
Remove-Item -Path "node_modules" -Recurse -Force
npm install
npm run build:tauri
```

### "L'application ne se lance pas"
- Vérifiez que vous avez Windows 10/11 64-bit
- Réinstallez en tant qu'administrateur
- Vérifiez l'antivirus (il peut bloquer l'installation)

---

## 🎉 Félicitations !

Votre application est maintenant :
- ✅ Installable sur Windows
- ✅ Téléchargeable depuis GitHub
- ✅ Accessible via un site web professionnel
- ✅ Optimisée pour Google

**URL de téléchargement :** `https://votre-domaine.vercel.app/fr/download`

---

## 📞 Support

Pour toute question :
1. Consultez les **Issues** sur GitHub
2. Créez une **nouvelle Issue** si nécessaire
3. Rejoignez la **communauté** (si disponible)

---

**Dernière mise à jour :** Janvier 2026
