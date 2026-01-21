# 🚀 Guide de Setup Complet - Application Mobile Flutter

## ✅ Prérequis

- **Flutter**: 3.0.0 ou plus
- **Dart**: 3.0.0 ou plus
- **Android Studio**: Dernière version (pour Android)
- **Xcode**: 14+ (pour iOS)
- **Git**: Pour le contrôle de version

## 📦 Installation de Flutter

### Windows
```bash
# 1. Télécharger Flutter SDK
# https://flutter.dev/docs/get-started/install/windows

# 2. Extraire le zip dans un dossier (ex: C:\flutter)

# 3. Ajouter au PATH
# Variables d'environnement → PATH → Ajouter C:\flutter\bin

# 4. Vérifier l'installation
flutter --version
flutter doctor
```

### Mac
```bash
# 1. Installer via Homebrew
brew install flutter

# 2. Vérifier
flutter --version
flutter doctor
```

### Linux
```bash
# 1. Télécharger et extraire
cd ~/development
tar xf ~/Downloads/flutter_linux_*.tar.xz

# 2. Ajouter au PATH
export PATH="$PATH:~/development/flutter/bin"

# 3. Vérifier
flutter --version
```

## 🎯 Setup du Projet

### Étape 1: Cloner/Copier le projet
```bash
# Copier le dossier flutter_app du workspace
# Ou cloner le repo si applicable
cd flutter_app
```

### Étape 2: Installer les dépendances
```bash
flutter pub get
```

### Étape 3: Vérifier le setup
```bash
flutter doctor
```

**Output attendu:**
```
[✓] Flutter (Channel stable, ...)
[✓] Android toolchain - develop for Android devices
[✓] Xcode - develop for iOS and macOS (optional)
[✓] Android Studio (version ...)
[✓] VS Code (version ...)
```

## 🔧 Configuration Spécifique

### Android

#### Fichier: `android/app/build.gradle`
```gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
    minSdkVersion 21
}
```

#### Fichier: `android/app/src/main/AndroidManifest.xml`
```xml
<manifest ...>
    <application
        android:label="Gestionnaire d'Assemblée"
        android:icon="@mipmap/ic_launcher">
        ...
    </application>
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

### iOS

#### Fichier: `ios/Podfile`
```ruby
platform :ios, '11.0'
```

#### Fichier: `ios/Runner/Info.plist`
```xml
<key>CFBundleName</key>
<string>Gestionnaire</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

## 🏃 Exécution

### Lister les appareils
```bash
flutter devices
```

### Exécuter sur émulateur/device
```bash
# Démarrer un émulateur d'abord (si nécessaire)
flutter emulators

# Puis exécuter
flutter run

# En mode debug complet
flutter run -v

# Sur un device spécifique
flutter run -d <device-id>
```

### Hot Reload
- Appuyer sur `r` dans le terminal pendant que l'app tourne
- Appuyer sur `R` pour hot restart

### Stop l'app
- Appuyer sur `q` dans le terminal

## 🧪 Tests

### Exécuter les tests
```bash
# Tous les tests
flutter test

# Test spécifique
flutter test test/auth_test.dart

# Avec couverture
flutter test --coverage

# Tests d'intégration
flutter test integration_test/
```

### Générer un rapport de couverture
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

## 🔍 Débogage

### DevTools
```bash
# Lancer DevTools
flutter pub global activate devtools
flutter pub global run devtools

# Ou automatiquement pendant flutter run
flutter run --device-vmservice-port=5858
```

### Logs
```bash
# Afficher les logs complets
flutter logs

# Filtrer les logs
flutter logs | grep "gestionnaire"

# Logs détaillés
flutter run -v 2>&1 | grep "E/"
```

### Breakpoints
1. Ouvrir le fichier dans VS Code
2. Cliquer à gauche du numéro de ligne pour placer un breakpoint
3. DevTools affichera les variables à l'arrêt

## 📊 State Management Riverpod

### Inspecter l'état
```dart
// Dans le code
ref.listen(authStateProvider, (prev, next) {
  print('Auth state changed: $prev → $next');
});

// Via DevTools
- Riverpod tab
- Voir tous les providers
- Inspecter les valeurs
```

## 💾 Données Locales

### SharedPreferences
```bash
# Accéder à SharedPreferences
adb shell
run-as com.example.gestionnaire_app
sqlite3 databases/default.db
```

### Nettoyer les données
```dart
// En code
await storageService.clearAll();

// Ou manuellement
flutter run
// À la console: Appuyez sur 'q'
// Puis réinstallez: flutter clean && flutter run
```

## 🔐 Configuration Sécurité

### Variables d'environnement
```bash
# Créer un fichier .env
ASSEMBLY_PIN=secret123
API_KEY=your_api_key_here

# Charger dans l'app
const String assemblyPin = String.fromEnvironment('ASSEMBLY_PIN');
```

### Fichier .gitignore
```
build/
.dart_tool/
pubspec.lock
.env
ios/Flutter/Flutter.podspec
android/gradle.properties
```

## 📈 Build pour Production

### Android APK
```bash
# Build APK
flutter build apk --release

# Build APK split par architecture (recommandé)
flutter build apk --split-per-abi --release

# Fichier généré: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle
```bash
# Recommandé pour PlayStore
flutter build appbundle --release

# Fichier généré: build/app/outputs/bundle/release/app-release.aab
```

### iOS
```bash
# Build IPA
flutter build ios --release

# Ou via Xcode
open ios/Runner.xcworkspace
# Puis Archive et Upload

# Fichier généré: build/ios/iphoneos/Runner.app
```

## 📱 Installation sur Device

### Android
```bash
# Via APK
adb install build/app/outputs/flutter-apk/app-release.apk

# Via App Bundle (PlayStore)
# Upload sur PlayStore et installer via Play Store
```

### iOS
```bash
# Via IPA
xcrun altool --upload-app --file build/ios/iphoneos/Runner.app \
  --username apple_id@example.com --password app_password

# Ou installer sur device connecté
flutter install -v
```

## 🌐 Configuration API (Futur)

### Fichier: `lib/config/api_config.dart`
```dart
class ApiConfig {
  static const String baseUrl = 'https://api.example.com';
  static const String apiKey = 'your_api_key';
  static const Duration timeout = Duration(seconds: 30);
}
```

## 📋 Checklist de Développement

- [ ] Flutter et Dart installés
- [ ] Dépendances (`flutter pub get`) téléchargées
- [ ] Émulateur démarré ou device connecté
- [ ] `flutter run` fonctionne
- [ ] App affiche les écrans correctement
- [ ] Authentification testée
- [ ] Données importées/synchronisées
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] `flutter analyze` sans erreurs
- [ ] `flutter pub get --offline` en offline mode
- [ ] Build APK/IPA fonctionne

## 🔗 Ressources Utiles

- [Flutter Docs](https://flutter.dev/docs)
- [Dart Docs](https://dart.dev/guides)
- [Riverpod Docs](https://riverpod.dev)
- [GoRouter Docs](https://pub.dev/packages/go_router)
- [Material Design 3](https://m3.material.io)

## 🆘 Troubleshooting

### Issue: "Flutter command not found"
**Solution:**
```bash
# Ajouter au PATH
export PATH="$PATH:[chemin_vers_flutter]/bin"

# Ou sur Windows:
set PATH=%PATH%;C:\flutter\bin
```

### Issue: "Unable to locate Android SDK"
**Solution:**
```bash
flutter config --android-sdk /path/to/android-sdk

# Sur Windows:
flutter config --android-sdk "C:\Android\sdk"
```

### Issue: "Unable to boot simulator"
**Solution:**
```bash
flutter emulators --launch Nexus_5X_API_31

# Ou créer un nouvel émulateur via Android Studio
```

### Issue: "Gradle sync failed"
**Solution:**
```bash
cd android
./gradlew clean

# Puis
cd ..
flutter clean
flutter pub get
flutter run
```

### Issue: "CocoaPods dependency resolution failed"
**Solution:**
```bash
cd ios
rm Podfile.lock
pod repo update
pod install

cd ..
flutter run
```

## 📞 Support

Pour des questions ou bugs:
1. Vérifier les logs avec `flutter logs -v`
2. Consulter la documentation officielle
3. Créer une issue sur GitHub
4. Contacter l'équipe de développement

---

**Version**: 1.0.0  
**Dernière mise à jour**: Novembre 2025  
**Auteur**: Gestionnaire d'Assemblée Team
