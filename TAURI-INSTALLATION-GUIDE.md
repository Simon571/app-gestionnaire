# 🖥️ Installation Tauri - Application Bureau Complète

## 📌 Qu'est-ce que Tauri ?

Tauri crée une **vraie application bureau** (comme Word, Photoshop, etc.) directement installée sur votre ordinateur avec une icône sur le bureau et dans le menu Démarrer.

---

## ✅ ÉTAPE 1 : Vérifier les Prérequis

### Windows 10/11 (Recommandé)

```powershell
# Vérifier que Rust est installé (nécessaire pour Tauri)
rustc --version
cargo --version
```

**Si vous n'avez pas Rust :**
1. Allez sur : https://rustup.rs/
2. Copiez/collez et exécutez la commande dans PowerShell
3. Attendez la fin (5-10 minutes)

### Node.js

```powershell
# Vérifier Node.js
node --version   # Doit être v18+ 
npm --version    # Doit être v8+
```

**Si vous n'avez pas Node.js :**
1. Téléchargez : https://nodejs.org/ (LTS)
2. Installez-le normalement
3. Redémarrez PowerShell

---

## ✅ ÉTAPE 2 : Préparer l'Application

```powershell
# Naviguez vers le dossier du projet
cd C:\Users\[VotreNom]\Documents\app-gestionnaire

# Installez les dépendances (si pas déjà fait)
npm install

# Compilez l'application Next.js
npm run build
```

---

## ✅ ÉTAPE 3 : Compiler pour le Bureau (Tauri)

### Option A : Mode Développement (Rapide, pour tester)

```powershell
npm run tauri:dev
```

**Résultat :**
- Une fenêtre d'application s'ouvre immédiatement
- Vous pouvez voir l'application en temps réel
- Modifications du code = rechargement automatique
- Parfait pour déboguer

### Option B : Mode Production (Pour installer définitivement)

```powershell
npm run tauri:build
```

**Résultat :**
- ⏳ **Attendre 5-15 minutes** (première build = plus lent)
- Une application `.exe` complète est créée
- L'installateur est généré
- L'icône "Maison" s'affiche

---

## 🎯 ÉTAPE 4 : Installer l'Application

### Après `npm run tauri:build`, cherchez :

```
src-tauri/target/release/bundle/nsis/admin-gestionnaire_0.1.0_x64-setup.exe
```

**Installation :**
1. Double-cliquez sur le fichier `.exe`
2. L'installateur se lance automatiquement
3. Cliquez sur "Installer"
4. L'application s'installe sur votre ordinateur

### Résultat Final :
✅ Icône sur le **Bureau**  
✅ Icône dans le **Menu Démarrer**  
✅ Raccourci au **Démarrage** (optionnel)  
✅ Application **indépendante** (pas besoin de npm)

---

## 🚀 Lancer l'Application

Après installation, trois façons de la lancer :

### 1️⃣ **Icône Bureau**
- Double-cliquez sur l'icône "Admin d'Assemblée" sur le bureau

### 2️⃣ **Menu Démarrer**
- Appuyez sur `Win` et cherchez "Admin d'Assemblée"

### 3️⃣ **Barre des tâches**
- L'application épinglée à la barre pour accès rapide

---

## 🏗️ Structure de la Build Tauri

Après `npm run tauri:build`, le dossier s'organise ainsi :

```
src-tauri/target/release/bundle/
├── nsis/                          # Installateur Windows
│   ├── admin-gestionnaire_0.1.0_x64-setup.exe    ← CLIQUEZ ICI
│   └── ...
├── msi/                           # Alternative Windows (MSI)
├── deb/                           # Pour Linux (si applicable)
└── ...
```

---

## 📋 Commandes Rapides Résumées

| Commande | Utilité | Résultat |
|----------|---------|----------|
| `npm run tauri:dev` | Développement rapide | Fenêtre app (rechargement auto) |
| `npm run tauri:build` | Production finale | Installateur `.exe` |
| `npm run build` | Prépare Next.js | Requis avant Tauri |

---

## 🎨 Icône Personnalisée

L'icône "Maison" que nous avons créée s'affichera :
- ✅ Sur le bureau
- ✅ Dans le Menu Démarrer
- ✅ Dans la barre des tâches
- ✅ Dans le gestionnaire des applications

Fichiers source :
```
src-tauri/icons/
├── 32x32.png       (Barre des tâches)
├── 128x128.png     (Standard)
├── 128x128@2x.png  (Haute résolution)
├── Square*.png     (Divers formats Windows)
└── StoreLogo.png
```

---

## ⚙️ Configuration Tauri

Fichier de configuration : `src-tauri/tauri.conf.json`

```json
{
  "productName": "app-gestionnaire",
  "version": "0.1.0",
  "identifier": "com.appgestionnaire.dev",
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## 🔄 Mise à Jour de l'Application

**Pour mettre à jour l'app :**

```powershell
# 1. Modifiez le code/icône si besoin
# ...modifications...

# 2. Régénérez les icônes (si vous les avez modifiées)
npm run generate:icons

# 3. Recompilez pour production
npm run tauri:build

# 4. Un nouvel installateur est généré
# Exécutez-le pour mettre à jour
```

---

## 🆘 Dépannage

### ❌ "Rust not found"
```powershell
# Installer Rust
irm https://rustup.rs -useb | iex
```

### ❌ "Node not found"
- Téléchargez Node.js : https://nodejs.org/
- Redémarrez PowerShell

### ❌ La build prend trop longtemps
- C'est normal la première fois (5-15 min)
- Les builds suivantes sont plus rapides (1-3 min)

### ❌ Erreur lors de `npm run tauri:build`
```powershell
# Nettoyez et recommencez
rm -r src-tauri/target
npm run build
npm run tauri:build
```

### ❌ L'icône ne s'affiche pas
```powershell
# Régénérez les icônes
npm run generate:icons

# Recompile
npm run tauri:build
```

---

## 📱 Fichiers Générés Après Installation

L'installateur crée :

- **Program Files** : `C:\Program Files\Admin d'Assemblée\`
- **Menu Démarrer** : `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Admin d'Assemblée\`
- **Bureau** : Raccourci de l'application
- **Registre Windows** : Entrées pour désinstallation

---

## ✨ Avantages de Tauri vs Web

| Aspect | Web | Tauri |
|--------|-----|-------|
| Installation | Navigateur (toujours) | Une fois (.exe) |
| Icône | Non | ✅ Oui |
| Bureau | Non | ✅ Oui |
| Taille | Légère | Plus grande |
| Accès système | Non | Oui (contrôlé) |
| Offline | Partiel | ✅ Complet |

---

## 🎯 Résumé des Étapes

```
1. ✅ npm install (une seule fois)
2. ✅ npm run build
3. ✅ npm run tauri:build (attendre 5-15 min)
4. ✅ Double-cliquez sur .exe généré
5. ✅ Application installée sur votre bureau !
```

---

## 📞 Besoin d'Aide ?

**Erreurs communes résolues :**
- Rust manquant → installer depuis rustup.rs
- Node.js manquant → télécharger depuis nodejs.org
- Build échoue → nettoyer `src-tauri/target` et recommencer
- Icône manquante → `npm run generate:icons`

---

**Créé pour : Admin d'Assemblée v0.1.0**  
**Date : 10 novembre 2025**
