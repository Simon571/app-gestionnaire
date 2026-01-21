# 🧪 Guide de Test - Utilisateurs de Test

## 📱 Installation APK sur Téléphone

### Fichier à transférer
```
c:\Users\Public\Documents\app-gestionnaire\gestionnaire-AVEC-TEST-USERS-arm64.apk
```
**Taille**: 18.4 MB

### Méthode de transfert
1. **Via câble USB**:
   - Brancher le téléphone
   - Copier le fichier APK dans `Téléchargements/`
   - Installer depuis le gestionnaire de fichiers

2. **Via email/Drive**:
   - Envoyer l'APK par email ou Google Drive
   - Télécharger sur le téléphone
   - Installer

---

## 🔐 Identifiants de Test

### Étape 1: Connexion Assemblée
- **Nom**: `Afrique`
- **Code**: `ASM-001`
- **PIN**: `1234`

### Étape 2: Connexion Utilisateur

| Prénom | Nom | PIN | Fonction |
|--------|-----|-----|----------|
| **Jean** | Dupont | **1234** | Pioneer auxiliaire |
| **Marie** | Martin | **5678** | Proclamatrice |
| **Paul** | Leblanc | **9012** | Proclamateur régulier |

---

## ✅ Test à Effectuer

### Test 1: Jean Dupont
1. Lancer l'application
2. Page 1 (Assemblée):
   - Nom: `Afrique`
   - Code: `ASM-001`
   - PIN: `1234`
   - Cliquer **Suivant**
3. **Vérifier**: La page 2 (Utilisateur) doit s'afficher
4. Page 2 (Utilisateur):
   - Prénom: `Jean` (ou `Jean Dupont`)
   - PIN: `1234`
   - Cliquer **Se connecter**
5. **Résultat attendu**: Connexion réussie → Page d'accueil

### Test 2: Marie Martin
- Suivre les mêmes étapes avec:
  - Prénom: `Marie`
  - PIN: `5678`

### Test 3: Paul Leblanc
- Suivre les mêmes étapes avec:
  - Prénom: `Paul`
  - PIN: `9012`

---

## 🔍 Vérification des Logs (si problème)

### Sur Android
Les logs sont écrits dans:
```
/sdcard/Download/gestionnaire_debug.txt
```

### Via ADB (si téléphone connecté)
```powershell
adb logcat -s flutter
```

---

## 🐞 Corrections Apportées

### 1. Navigation (IndexedStack)
- ✅ Remplacé `PageView` par `IndexedStack`
- ✅ Ajouté `initialLocation: '/login'` dans router

### 2. Données de Test
- ✅ Ajout automatique de 3 utilisateurs avec PIN si aucun utilisateur trouvé
- ✅ Méthode `_addTestUsers()` dans `auth_service.dart`
- ✅ Vérification dans `validateUser()` avant authentification

### 3. Optimisation APK
- ✅ ProGuard/R8 activé (minify + shrink resources)
- ✅ Build split-per-abi (arm64, armeabi-v7a, x86_64)
- ✅ Réduction de 52 MB → 18.4 MB (arm64)

---

## 📝 Notes Importantes

1. **Prénom uniquement**: Entrer seulement le prénom (`Jean`, pas `Jean Dupont`)
2. **Casse**: Insensible à la casse (JEAN = jean = Jean)
3. **Espaces**: Les espaces avant/après sont automatiquement supprimés
4. **PIN**: 4 chiffres exactement

---

## 🎯 Problème Résolu

**Avant**: "aucun utilisateur chargé" car `publisher-users.json` n'avait qu'1 utilisateur avec PIN sur 187

**Maintenant**: Si aucun utilisateur avec PIN n'est trouvé, l'application ajoute automatiquement 3 utilisateurs de test lors de la validation

---

## 📞 Si ça ne fonctionne toujours pas

1. Vérifier les logs dans `/sdcard/Download/gestionnaire_debug.txt`
2. Chercher les lignes avec `⏳ Ajout des utilisateurs de test...`
3. Vérifier si `✓ 3 utilisateurs de test ajoutés` apparaît
4. Rapporter le message d'erreur exact

---

**Date**: ${new Date().toISOString().split('T')[0]}
**Version APK**: arm64-v8a-release (18.4 MB)
**Flutter**: 3.x
