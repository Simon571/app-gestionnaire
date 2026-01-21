# Configuration Firebase App Distribution - Mises à jour automatiques

## ✅ Code installé

Tous les fichiers nécessaires ont été ajoutés au projet Flutter :
- ✅ Dépendances Firebase dans `pubspec.yaml`
- ✅ Service de mise à jour automatique créé
- ✅ Configuration Gradle pour Android
- ✅ Vérification automatique au démarrage de l'app

## 🔧 Configuration Firebase (à faire une seule fois)

### 1. Créer un projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet : `gestionnaire-app` (ou votre choix)
4. Acceptez les conditions et créez le projet

### 2. Ajouter Android à Firebase

1. Dans la console Firebase, cliquez sur l'icône **Android** (robot)
2. Remplissez les informations :
   - **Package Android** : `com.assemblee.gestionnaire_app`
   - **Nom** : Gestionnaire App
   - **SHA-1** : (optionnel pour l'instant, cliquez "Suivant")
3. Téléchargez le fichier **`google-services.json`**
4. **IMPORTANT** : Placez ce fichier dans :
   ```
   flutter_app/android/app/google-services.json
   ```

### 3. Activer App Distribution

1. Dans Firebase Console, menu de gauche → **"App Distribution"**
2. Cliquez sur **"Commencer"**
3. Sélectionnez votre app Android
4. Vous êtes prêt !

## 📤 Distribuer une mise à jour

### Option A : Via ligne de commande (Recommandé)

```powershell
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Se connecter à Firebase
firebase login

# 3. Compiler et distribuer
cd flutter_app
flutter build apk --release
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk `
  --app 1:VOTRE_APP_ID `
  --release-notes "Correction des boutons +/-, PINs synchronisés" `
  --groups "testeurs"
```

### Option B : Via console web

1. Allez sur https://console.firebase.google.com/
2. Ouvrez votre projet → **App Distribution**
3. Cliquez **"Distribuer"**
4. Uploadez `app-release.apk`
5. Ajoutez les emails des testeurs
6. Envoyez !

## 👥 Ajouter des testeurs

1. Firebase Console → App Distribution → **Testeurs et groupes**
2. Créez un groupe **"testeurs"**
3. Ajoutez les emails des utilisateurs :
   - simon@example.com
   - abel@example.com
   - etc.
4. Les testeurs recevront un email d'invitation

## 🔄 Fonctionnement automatique

Une fois configuré, voici ce qui se passe :

1. **Vous** : Compilez et uploadez un nouvel APK sur Firebase
2. **L'app** : Vérifie automatiquement au démarrage s'il y a une nouvelle version
3. **Utilisateur** : Reçoit une notification dans l'app → Bouton "Installer"
4. **Android** : Télécharge et installe la mise à jour automatiquement

## 📋 Notes importantes

- **Première installation** : Les testeurs doivent installer Firebase App Tester depuis le Play Store
- **Connexion Internet** : Nécessaire pour vérifier/télécharger les mises à jour
- **Version** : Incrémentez le numéro de version dans `pubspec.yaml` à chaque release
- **Gratuit** : Firebase App Distribution est gratuit (quota généreux)

## 🚀 Alternative simple (sans Firebase)

Si vous ne voulez pas configurer Firebase maintenant, vous pouvez :
1. Envoyer l'APK par WhatsApp/Email
2. Les utilisateurs cliquent dessus → "Mettre à jour"
3. Pas besoin de désinstaller

## ❓ Aide

Si vous avez des questions ou erreurs lors de la configuration Firebase, dites-moi et je vous aiderai !
