# Guide de Mise à Jour Automatique APK

## 🎯 Comment ça fonctionne

L'application vérifie automatiquement les mises à jour au démarrage. Si une nouvelle version existe, l'utilisateur reçoit une notification avec un bouton "Mettre à jour".

## 📋 Workflow de Publication

### 1. Préparer une nouvelle version

```bash
# Mettre à jour la version (exemple: 1.0.1)
node scripts/update-apk-version.js 1.0.1 "Corrections de bugs et nouvelles fonctionnalités"
```

Ce script va :
- ✅ Mettre à jour `public/app/version.json`
- ✅ Mettre à jour `flutter_app/pubspec.yaml`

### 2. Compiler l'APK

```bash
cd flutter_app
flutter build apk --release
```

### 3. Déployer l'APK

```bash
# Créer le dossier downloads s'il n'existe pas
mkdir -p public/downloads

# Copier l'APK compilé
copy flutter_app\build\app\outputs\flutter-apk\app-release.apk public\downloads\app-release.apk
```

### 4. Déployer sur le serveur

Envoyez ces fichiers sur votre serveur :
- `public/app/version.json` - Informations de version
- `public/downloads/app-release.apk` - Le fichier APK

## 🔧 Configuration

### Modifier l'URL du serveur

Dans `flutter_app/lib/services/update_service.dart`, ligne 9 :

```dart
static const String updateCheckUrl = 'https://VOTRE-DOMAINE.com/api/app/version';
```

Remplacez par votre véritable domaine.

### Tester localement

1. Démarrer le serveur Next.js :
```bash
npm run dev
```

2. Modifier temporairement l'URL dans `update_service.dart` :
```dart
static const String updateCheckUrl = 'http://localhost:3000/api/app/version';
```

3. Tester l'app Flutter

## 📱 Expérience Utilisateur

1. L'utilisateur ouvre l'app
2. L'app vérifie les mises à jour (3 secondes après le démarrage)
3. Si nouvelle version disponible :
   - Popup "Mise à jour disponible"
   - Affichage de la version et des notes
   - Bouton "Mettre à jour" ou "Plus tard"
4. Si l'utilisateur clique "Mettre à jour" :
   - Téléchargement de l'APK
   - Installation automatique (l'utilisateur doit autoriser)

## 🚀 Workflow Complet (Exemple)

```bash
# 1. Créer une nouvelle version
node scripts/update-apk-version.js 1.0.2 "Ajout du bouton d'envoi dans l'onglet Moi"

# 2. Compiler
cd flutter_app
flutter build apk --release
cd ..

# 3. Copier l'APK
copy flutter_app\build\app\outputs\flutter-apk\app-release.apk public\downloads\app-release.apk

# 4. Déployer (exemple avec git)
git add .
git commit -m "Release v1.0.2"
git push

# Ou avec FTP/rsync vers votre serveur
```

## ⚙️ Fichier version.json

Structure :
```json
{
  "version": "1.0.2",
  "buildNumber": 102,
  "downloadUrl": "https://votre-serveur.com/downloads/app-release.apk",
  "releaseNotes": "- Correction du bug X\n- Ajout de la fonctionnalité Y",
  "minimumVersion": "1.0.0",
  "forceUpdate": false
}
```

- `version` : Version lisible (1.0.2)
- `buildNumber` : Numéro de build incrémental (102)
- `downloadUrl` : URL de téléchargement de l'APK
- `releaseNotes` : Notes de version affichées à l'utilisateur
- `minimumVersion` : Version minimum requise
- `forceUpdate` : Si true, l'utilisateur DOIT mettre à jour

## 🎓 Plus tard : Google Play Store

Quand vous aurez les $25 :

1. Créer un compte développeur : https://play.google.com/console
2. Créer une application
3. Uploader l'APK
4. Les utilisateurs recevront les mises à jour automatiquement via le Play Store

Avantages Play Store :
- ✅ Mises à jour 100% automatiques
- ✅ Pas besoin de gérer l'hébergement APK
- ✅ Statistiques d'utilisation
- ✅ Avis utilisateurs
