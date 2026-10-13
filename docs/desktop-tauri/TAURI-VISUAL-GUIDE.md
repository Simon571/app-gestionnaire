# 📦 Installation Tauri - Mode Visuel Complet

## 🎬 Aperçu Visuel de l'Installation

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   1️⃣  PRÉREQUIS (Installer une fois)           │
│       • Node.js                                 │
│       • Rust                                    │
│                                                 │
│   2️⃣  PRÉPARER LE PROJET                        │
│       npm install                              │
│       npm run build                             │
│                                                 │
│   3️⃣  COMPILER POUR BUREAU                      │
│       npm run tauri:build                       │
│       ⏱️  Attendre 5-15 minutes                 │
│                                                 │
│   4️⃣  INSTALLER                                 │
│       Double-cliquez sur : admin-gestionnaire_0.1.0_x64-setup.exe
│                                                 │
│   5️⃣  ✅ TERMINÉ !                              │
│       • Icône sur le bureau                     │
│       • Icône au menu Démarrer                  │
│       • Application prête à utiliser            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Checklist d'Installation

### ☑️ Prérequis à Vérifier

- [ ] Windows 10/11 (ou macOS/Linux)
- [ ] Node.js v18+ installé
  - Vérifier : `node --version`
- [ ] Rust installé
  - Vérifier : `rustc --version`
  - Si absent : `irm https://rustup.rs -useb | iex`
- [ ] 200 MB d'espace disque libre

### ☑️ Installation de l'App

- [ ] Ouvrir PowerShell dans le dossier du projet
- [ ] Exécuter : `npm install`
- [ ] Exécuter : `npm run build`
- [ ] Exécuter : `npm run tauri:build`
- [ ] ☕ Attendre 5-15 minutes
- [ ] Chercher le fichier `.exe` généré
- [ ] Double-cliquer pour installer

### ☑️ Après Installation

- [ ] Vérifier l'icône sur le bureau
- [ ] Vérifier l'icône au menu Démarrer
- [ ] Lancer l'application
- [ ] Tester les fonctionnalités

---

## 🔍 Où Trouver les Fichiers ?

### Après `npm run tauri:build`

```
📁 app-gestionnaire/
  └─ 📁 src-tauri/
      └─ 📁 target/
          └─ 📁 release/
              └─ 📁 bundle/
                  ├─ 📁 nsis/
                  │   └─ 🔴 admin-gestionnaire_0.1.0_x64-setup.exe  ← CLIQUER ICI
                  ├─ 📁 msi/     (Alternative Windows)
                  └─ 📁 deb/     (Si Linux)
```

**Chemin Complet :**
```
C:\Users\Public\Documents\app-gestionnaire\src-tauri\target\release\bundle\nsis\admin-gestionnaire_0.1.0_x64-setup.exe
```

---

## 🎨 Ce que vous Verrez

### Pendant l'Installation

```
┌─ Admin d'Assemblée Setup ─────────────────┐
│                                            │
│  Installation d'Admin d'Assemblée          │
│                                            │
│  [  ████████████░░░░░░░░░░░░ ] 65%        │
│                                            │
│  □ Installer pour tous les utilisateurs   │
│                                            │
│                  [Installer]  [Annuler]    │
│                                            │
└────────────────────────────────────────────┘
```

### Après l'Installation

```
┌─ Bureau Windows ──────────────────────────┐
│                                            │
│  🏠 Admin d'Assemblée        Poubelle     │
│                                            │
│  (Icône visible sur le bureau)             │
│                                            │
└────────────────────────────────────────────┘
```

### Au Menu Démarrer

```
Win + Type "Admin"
↓
📌 Admin d'Assemblée - Desktop Application
   (Cliquez pour lancer)
```

### À la Barre des Tâches

```
[Windows] [VS Code] 🏠 Admin d'Assemblée [Firefox] [...] 
                    ↑ L'app s'affiche ici aussi
```

---

## ⚡ Temps Estimé

| Étape | Temps |
|-------|-------|
| Installation des dépendances (`npm install`) | 2-3 min |
| Compilation Next.js (`npm run build`) | 1-2 min |
| Compilation Tauri **PREMIÈRE FOIS** (`npm run tauri:build`) | 10-15 min |
| Compilation Tauri (fois suivantes) | 3-5 min |
| Installation de l'app (double-clic .exe) | 30 sec |
| **TOTAL PREMIÈRE FOIS** | **~20 minutes** |

---

## 🛠️ Commandes Principales Simplifiées

```powershell
# ✅ Démarrage rapide en développement
npm run tauri:dev

# 🏗️  Créer l'installateur (PRINCIPAL)
npm run tauri:build

# 🔄 Mettre à jour le code
# ... modifiez les fichiers ...
npm run tauri:build  # Recompiler

# 🎨 Si vous changez l'icône
npm run generate:icons
npm run tauri:build
```

---

## 📊 Fichiers Importants

| Fichier | Rôle |
|---------|------|
| `src-tauri/tauri.conf.json` | Configuration Tauri |
| `src-tauri/icons/*.png` | Icônes de l'application |
| `src-tauri/src/main.rs` | Code Rust (avancé) |
| `public/icon-house.svg` | Icône SVG source |
| `TAURI-INSTALLATION-GUIDE.md` | Guide complet |

---

## ✨ Fonctionnalités Tauri Incluses

✅ **Native Icons** - L'icône "Maison" s'affiche partout  
✅ **System Tray** - Barre des tâches  
✅ **Auto-Updates** - Mises à jour automatiques (à configurer)  
✅ **Offline Support** - Fonctionne sans internet  
✅ **File Access** - Accès aux fichiers locaux  
✅ **Custom Title Bar** - Barre de titre personnalisée  

---

## 🎯 Stratégies d'Installation

### 🟢 Pour les Débutants
1. Ouvrez PowerShell
2. Allez dans : `cd C:\Users\Public\Documents\app-gestionnaire`
3. Exécutez : `.\scripts\install-tauri.ps1`
4. Choisissez l'option 2
5. Attendez et suivez les instructions

### 🟡 Pour les Intermédiaires
```powershell
npm install && npm run build && npm run tauri:build
```

### 🟣 Pour les Avancés
```powershell
# Avec options personnalisées
cargo tauri build --release --verbose
```

---

## 🐛 Dépannage Visuel

### Problème : "rustc: command not found"
```
❌ Erreur : Rust not installed
✅ Solution : irm https://rustup.rs -useb | iex
             (Puis redémarrer PowerShell)
```

### Problème : "npm: command not found"
```
❌ Erreur : Node.js not installed
✅ Solution : https://nodejs.org/ (LTS)
             Installer et redémarrer
```

### Problème : "Build timeout ou freeze"
```
❌ Erreur : La compilation stagne
✅ Solution : Ctrl+C puis :
             rm -r src-tauri/target
             npm run tauri:build
```

---

## 📞 Besoin d'Aide ?

📖 **Fichiers à Lire :**
1. `QUICK-TAURI-INSTALL.md` - Version très courte (2 min)
2. `TAURI-INSTALLATION-GUIDE.md` - Guide complet (détaillé)
3. `ICONS-IMPLEMENTATION-COMPLETE.md` - Pour les icônes

🌐 **Ressources en Ligne :**
- https://tauri.app/
- https://tauri.app/docs/guides/getting-started/

---

## 🎊 Résumé Final

```
Avant Installation          Après Installation
────────────────────────────────────────────────
🌐 Navigateur            →    🖥️  Application Bureau
   (Need active internet)   (Indépendante)

Aucune icône             →    🏠 Icône "Maison"

Pas au menu Démarrer     →    📌 Visible au menu

À relancer chaque fois   →    Lancée 1 clic
```

---

**Installation Tauri - Admin d'Assemblée v0.1.0**  
*Créé pour faciliter votre installation sur bureau*
