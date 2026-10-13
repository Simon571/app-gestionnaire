# 🖥️ Guide Rapide - Installation Bureau (5 Minutes)

## 🎯 Résumé Rapide

Vous avez 2 options :

### Option 1️⃣ : Les Impatients (Clique-Clique)
```powershell
cd C:\Users\Public\Documents\app-gestionnaire
.\scripts\install-tauri.ps1
# Puis choisissez l'option [2]
```

### Option 2️⃣ : Les Manuels (Étape par Étape)
```powershell
cd C:\Users\Public\Documents\app-gestionnaire
npm install
npm run build
npm run tauri:build
# Attendez 5-15 minutes...
# Double-cliquez sur le .exe généré
```

---

## ✅ Avant de Commencer

Avez-vous **Rust** ?
```powershell
rustc --version
```

**NON ?** Exécutez ceci en PowerShell :
```powershell
irm https://rustup.rs -useb | iex
```

Puis **redémarrez PowerShell**.

---

## 🚀 Les 3 Étapes

### Étape 1 : Préparer
```powershell
cd C:\Users\Public\Documents\app-gestionnaire
npm install
npm run build
```
⏱️ **~2 minutes**

### Étape 2 : Compiler pour Bureau
```powershell
npm run tauri:build
```
⏱️ **~10 minutes** (première fois)  
☕ *Allez prendre un café...*

### Étape 3 : Installer
📂 Cherchez : `src-tauri/target/release/bundle/nsis/*.exe`  
🖱️ Double-cliquez dessus  
✅ Installé sur votre bureau !

---

## 💡 C'est Tout !

Maintenant vous avez :
- ✅ Icône sur le bureau
- ✅ Icône dans le Menu Démarrer  
- ✅ Application indépendante (pas de navigateur nécessaire)

---

## ❓ Erreur ?

| Erreur | Solution |
|--------|----------|
| "rustc not found" | Exécutez : `irm https://rustup.rs -useb \| iex` |
| "npm not found" | Téléchargez Node.js : https://nodejs.org/ |
| "Build fails" | Exécutez : `rm -r src-tauri/target` puis réessayez |

---

## 📖 Pour Plus de Détails

👉 Ouvrez : `TAURI-INSTALLATION-GUIDE.md`

---

**Créé pour : Admin d'Assemblée**
