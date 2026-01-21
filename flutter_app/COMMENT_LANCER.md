# 🚀 Comment Lancer l'App Flutter

## Option 1: Fichier BAT (Plus Simple - Recommandé)

### Double-cliquez sur `RUN.bat`

C'est tout! Le fichier fera automatiquement:
1. Nettoyer le projet
2. Installer les dépendances
3. Lancer l'app

---

## Option 2: Fichier PowerShell

Ouvrez PowerShell dans le dossier et tapez:

```powershell
powershell -ExecutionPolicy Bypass -File RUN.ps1
```

---

## Option 3: Commandes Manuelles

Ouvrez PowerShell et exécutez:

```powershell
# 1. Aller au dossier
cd C:\Users\Public\Documents\app-gestionnaire\flutter_app

# 2. Ajouter Flutter au PATH
$env:Path = "C:\flutter\bin;$env:Path"

# 3. Nettoyer
flutter clean

# 4. Installer dépendances
flutter pub get

# 5. Lancer l'app
flutter run
```

---

## 🔐 Se Connecter à l'App

Une fois l'app lancée:

### Page 1 - Assemblée
```
Région: Afrique
ID Assemblée: ASM-001
PIN Assemblée: 1234
→ Cliquer "Suivant"
```

### Page 2 - Utilisateur
```
Prénom: Jean
PIN Personnel: 1234
→ Cliquer "Connexion"
```

---

## ⚠️ Erreurs Courantes

### "Flutter n'est pas reconnu"
- ✅ Installer Flutter: Voir **SETUP_GUIDE.md**
- ✅ Ajouter au PATH: `$env:Path = "C:\flutter\bin;$env:Path"`

### "Waiting for another flutter command"
- ✅ Fermer les autres instances Flutter
- ✅ Relancer: `flutter clean` puis `flutter pub get`

### "No devices found"
- ✅ Lancer un émulateur Android
- ✅ Ou connecter un téléphone en USB

---

## 📞 Besoin d'Aide?

Consultez ces fichiers:
- **START_HERE_NOW.md** - 5 minutes pour comprendre
- **TROUBLESHOOTING.md** - Solutions aux problèmes
- **SETUP_GUIDE.md** - Installation complète

---

**Prêt? Lancez `RUN.bat`! 🎉**
