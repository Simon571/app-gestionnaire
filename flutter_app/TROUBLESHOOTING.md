# 🔧 GUIDE DE DÉPANNAGE - Flutter App

## Avant Toute Chose

```bash
# 1. Vérifier l'environnement
flutter doctor

# 2. Nettoyer le projet
flutter clean

# 3. Récupérer les dépendances
flutter pub get

# 4. Relancer
flutter run
```

---

## ❌ Erreurs Courantes et Solutions

### 1. "Unable to find suitable Android SDK"

**Symptôme:**
```
Error: Unable to find suitable Android SDK
```

**Solution:**
```bash
# Android Studio doit être installé
# Puis:
flutter config --android-sdk <chemin_android_sdk>

# Ou sur Windows (PowerShell):
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
```

**Vérifier:**
```bash
flutter doctor -v
```

---

### 2. "CocoaPods not installed" (iOS)

**Symptôme:**
```
Error: Unable to find any Xcode development kits matching the Simulator
```

**Solution (sur Mac):**
```bash
sudo gem install cocoapods
pod setup
```

**Note:** Si vous ne compilez que pour Android, ignorez ce message.

---

### 3. "Permission denied" sur scripts

**Symptôme:**
```
Permission denied: ./flutter/bin/flutter
```

**Solution (sur Mac/Linux):**
```bash
chmod +x ./flutter/bin/flutter
chmod +x ./flutter/bin/dart
```

**Sur Windows:** Pas applicable (PowerShell gère les permissions)

---

### 4. "Gradle build failed"

**Symptôme:**
```
FAILURE: Build failed with an exception.
```

**Solution:**
```bash
# Nettoyer et reconstruire
flutter clean
flutter pub get
flutter run
```

**Si toujours un problème:**
```bash
# Supprimer le cache Gradle
rm -rf ~/.gradle/caches
flutter pub get
flutter run
```

---

### 5. "Pub get failed"

**Symptôme:**
```
Error: Pub get failed.
```

**Solution:**
```bash
# 1. Vérifier votre connexion internet
ping google.com

# 2. Forcer l'upgrade
flutter pub upgrade

# 3. Lister les dépendances
flutter pub get -v

# 4. Nettoyer le cache pub
flutter pub cache repair
flutter pub get
```

---

### 6. "Version solver failure"

**Symptôme:**
```
version solving failed
```

**Cause:** Les dépendances ne sont pas compatibles.

**Solution:**
```bash
# Voir pubspec.yaml - vérifier les versions
# Essayer:
flutter pub upgrade --major-versions

# Ou revenir à des versions stables
flutter pub get
```

---

### 7. "App ne démarre pas"

**Symptôme:** Écran noir, crash, ou rien.

**Étapes:**
```bash
# 1. Voir les logs
flutter run -v

# 2. Nettoyer et recommencer
flutter clean
flutter pub get
flutter run

# 3. Vérifier les erreurs de syntaxe
flutter analyze

# 4. Vérifier dans le code:
```

**Causes courantes:**
- ❌ `main()` manquant ou mal formaté
- ❌ Imports circulaires
- ❌ Riverpod mal initialisé
- ❌ GoRouter mal configuré

---

### 8. "Device not found"

**Symptôme:**
```
No devices found
```

**Solution:**
```bash
# 1. Vérifier les appareils disponibles
flutter devices

# 2. Pour l'émulateur Android:
flutter emulators
flutter emulators launch <emulator_id>

# 3. Pour iOS (Mac):
open -a Simulator
flutter run

# 4. Pour téléphone connecté (USB):
# - Activer "USB Debugging" en settings
# - Connecter le câble
flutter devices
flutter run
```

---

### 9. "MissingPluginException"

**Symptôme:**
```
MissingPluginException: No implementation found for method
```

**Solution:**
```bash
# Les plugins ne sont pas compilés
flutter clean
flutter pub get
flutter run
```

---

### 10. "SharedPreferences not initialized"

**Symptôme:**
```
SharedPreferences has not been initialised
```

**Raison:** `StorageService.init()` n'a pas été appelé.

**Solution:**
Dans `main.dart`, ajouter avant de lancer l'app:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService().init();  // ← AJOUTER CECI
  runApp(const ProviderScope(child: MyApp()));
}
```

---

### 11. "StateNotifierProvider not found"

**Symptôme:**
```
The provider was already disposed and is no longer usable
```

**Raison:** Provider Riverpod mal configuré.

**Solution:**
```bash
# Vérifier que 'auth_provider.dart' existe
# Vérifier que le provider est correct:
flutter analyze
```

**Dans le code:**
```dart
// ✓ BON
final authStateProvider = StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier(ref);
});

// ✗ MAUVAIS
final authStateProvider = StateNotifierProvider((ref) {
  return AuthStateNotifier(ref);
});
```

---

### 12. "Login validation toujours échoue"

**Symptôme:** Impossible de se connecter même avec données correctes.

**Étapes de debug:**
```dart
// Ajouter print dans auth_service.dart
print('Validating: $region, $assemblyId, $assemblyPin');
print('Result: $isValid');

// Vérifier example_data.json:
// Région: "Afrique"
// ID: "ASM-001"
// PIN: "1234"
```

**Cause courante:** Majuscules/minuscules incorrectes.

**Solution:**
```dart
// Dans auth_service.dart, utiliser .toLowerCase():
bool isValid = (region.toLowerCase() == 'afrique' && assemblyId == 'ASM-001' && assemblyPin == '1234');
```

---

### 13. "TextFields ne s'affichent pas"

**Symptôme:** Écran blanc ou TextField invisible.

**Cause:** Manque de Scaffold ou Material app.

**Vérifier:**
```dart
// Dans login_screen.dart:
class LoginScreen extends ConsumerStatefulWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(  // ← DOIT AVOIR SCAFFOLD
      appBar: AppBar(...),
      body: PageView(...),
    );
  }
}
```

---

### 14. "Navigation ne fonctionne pas"

**Symptôme:** Clic sur bouton n'a aucun effet.

**Vérifier:**
```dart
// GoRouter doit être configuré
final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    routes: [
      GoRoute(path: '/login', builder: ...),
      GoRoute(path: '/home', builder: ...),
    ],
    redirect: (context, state) { ... },
  );
});

// Dans MyApp:
class MyApp extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(goRouterProvider);
    
    return MaterialApp.router(
      routerConfig: goRouter,  // ← IMPORTANT
      ...
    );
  }
}
```

---

### 15. "Hot Reload/Restart ne marche pas"

**Symptôme:** Les changements de code ne s'appliquent pas.

**Solution:**
```bash
# 1. Essayer hot reload
r

# 2. Essayer hot restart
R

# 3. Arrêter et relancer
q
flutter run
```

**Cas où hot reload échoue:**
- Changement de structure de classe
- Changement dans `main()`
- Changement dans les imports

---

### 16. "Impossible de naviguer entre les écrans"

**Symptôme:** PageView ne fonctionne pas dans LoginScreen.

**Vérifier:**
```dart
// Vérifier pageController
pageController = PageController();

// Vérifier que PageView a une liste complète
PageView(
  controller: pageController,
  physics: const NeverScrollableScrollPhysics(),
  children: [
    AssemblyLoginPage(...),  // Page 0
    UserLoginPage(...),       // Page 1
  ],
)

// Vérifier le bouton "Suivant"
ElevatedButton(
  onPressed: () {
    pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  },
  child: const Text('Suivant'),
)
```

---

### 17. "Données ne s'affichent pas après connexion"

**Symptôme:** Connexion OK mais aucune donnée visible.

**Étapes:**
```bash
# 1. Vérifier que example_data.json est importé
# 2. Vérifier que StorageService.getPeople() retourne des données
```

**Dans le code:**
```dart
// Ajouter debug dans main_screen.dart
final people = ref.watch(peopleProvider);

return people.when(
  data: (list) {
    print('People loaded: ${list.length}');  // ← DEBUG
    return ...
  },
  loading: () => const Center(child: CircularProgressIndicator()),
  error: (err, stack) {
    print('Error loading people: $err');  // ← DEBUG
    return Center(child: Text('Erreur: $err'));
  },
);
```

---

### 18. "Services not found" ou affichage vide

**Symptôme:** Module Services affiche "Aucun" même si services assignés.

**Cause:** Données incorrectes ou non chargées.

**Solution:**
```dart
// Dans services_page.dart
final activeServices = ref.watch(activeServicesProvider);

return activeServices.when(
  data: (services) {
    print('Services: $services');  // ← VÉRIFIER
    if (services.isEmpty) {
      return const Center(child: Text('Aucun service assigné'));
    }
    return ListView.builder(...);
  },
  error: (err, stack) => Center(child: Text('Erreur: $err')),
  loading: () => const Center(child: CircularProgressIndicator()),
);
```

---

### 19. "Authentification échoue au login utilisateur"

**Symptôme:** Étape 1 OK mais Étape 2 échoue.

**Vérifier example_data.json:**
```json
{
  "people": [
    {
      "firstName": "Jean",
      "lastName": "Dupont",
      "pin": "1234"
    }
  ]
}
```

**Vérifier validation:**
```dart
// Dans auth_service.dart
bool validateUser(String firstName, String personalPin) {
  print('Looking for: $firstName / $personalPin');  // ← DEBUG
  
  for (var person in people) {
    print('Checking: ${person.firstName} / ${person.pin}');  // ← DEBUG
    if (person.firstName == firstName && person.pin == personalPin) {
      return true;
    }
  }
  return false;
}
```

---

### 20. "App crash au démarrage"

**Symptôme:** Aucun message d'erreur, crash silencieux.

**Solution:**
```bash
# Voir les logs
flutter run -v 2>&1 | grep -i error

# Ou
flutter run 2>&1 | tail -50
```

**Causes courantes:**
1. Exception dans `main()`
2. Exception dans Riverpod provider
3. Exception dans GoRouter redirect
4. Exception dans StorageService.init()

**Debug:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    await StorageService().init();
    print('✓ Storage initialized');  // ← ADD
  } catch (e) {
    print('✗ Storage error: $e');  // ← ADD
    rethrow;
  }
  
  try {
    runApp(const ProviderScope(child: MyApp()));
  } catch (e) {
    print('✗ App error: $e');  // ← ADD
    rethrow;
  }
}
```

---

### 21. "App très lent / lag"

**Symptôme:** Interactions lentes, UI freezes.

**Causes:**
- Trop de rebuilds Riverpod
- Build method complexe
- SharedPreferences bloque UI thread
- Trop de listeners

**Solutions:**
```dart
// 1. Utiliser select pour cibler le state:
// ✗ MAUVAIS - rebuild à chaque changement
final user = ref.watch(currentUserProvider);

// ✓ BON - rebuild seulement si nom change
final userName = ref.watch(currentUserProvider.select((p) => p?.firstName));

// 2. Utiliser const widgets:
// ✗ MAUVAIS
class MyWidget extends Widget {
  @override
  Widget build(BuildContext context) {
    return Container(child: Icon(Icons.settings));  // Rebuild à chaque fois
  }
}

// ✓ BON
class MyWidget extends Widget {
  @override
  Widget build(BuildContext context) {
    return Container(child: const Icon(Icons.settings));  // Réutilisé
  }
}

// 3. Profiler:
flutter run --profile
flutter run --release  // Plus rapide que debug
```

---

### 22. "Erreur de certificat SSL"

**Symptôme:**
```
HandshakeException: Handshake error in client
```

**Cause:** Problème de certificat HTTPS.

**Solution:**
```dart
// Pour dev seulement (NON pour production!):
HttpClient httpClient = HttpClient();
httpClient.badCertificateCallback =
    (X509Certificate cert, String host, int port) => true;
```

**Better:**
```dart
// Utiliser Dio avec certificat correct:
Dio(BaseOptions(
  baseUrl: 'https://api.example.com',
  validateStatus: (status) => status! < 500,
))
```

---

### 23. "URL not launching"

**Symptôme:** Impossible d'ouvrir des liens.

**Solution:**
```dart
import 'package:url_launcher/url_launcher.dart';

void openUrl(String url) async {
  if (await canLaunchUrl(Uri.parse(url))) {
    await launchUrl(Uri.parse(url));
  } else {
    print('Could not launch $url');
  }
}
```

**Ajouter à pubspec.yaml:**
```yaml
dependencies:
  url_launcher: ^6.1.0
```

---

### 24. "Build APK trop volumineux"

**Symptôme:** APK > 150MB.

**Solution:**
```bash
# Utiliser app bundle (recommandé pour PlayStore)
flutter build appbundle --release

# Ou réduire l'APK:
flutter build apk --release --split-per-abi

# Ce qui crée:
# - app-armeabi-v7a-release.apk (~40MB)
# - app-arm64-v8a-release.apk (~40MB)
# - app-x86-release.apk (~50MB)
```

---

### 25. "Impossible de tester sur téléphone physique"

**Symptôme:** "No devices found"

**Sur Android:**
```bash
# 1. Activer "Developer Options" sur téléphone:
#    Settings → About phone → Build number (7 fois)
# 2. Activer "USB Debugging"
# 3. Connecter par USB
# 4. Approuver la connexion sur téléphone
flutter devices
flutter run
```

**Sur iOS (Mac):**
```bash
# 1. Ouvrir Xcode
# 2. Connecter l'iPhone
# 3. Signer l'app avec certificat
# 4. Lancer depuis Xcode ou:
flutter run
```

---

## 🧹 Nettoyage et Maintenance

### Nettoyer Régulièrement
```bash
# Nettoyer le projet
flutter clean

# Nettoyer Gradle (Android)
cd android
./gradlew clean
cd ..

# Nettoyer le cache Pub
flutter pub cache repair
```

### Mettre à Jour
```bash
# Mettre à jour Flutter
flutter upgrade

# Mettre à jour les dépendances
flutter pub upgrade
flutter pub upgrade --major-versions

# Vérifier la santé
flutter doctor
```

---

## 📊 Commandes Utiles

```bash
# Analyser le code
flutter analyze

# Formater le code
dart format lib/

# Voir les dépendances
flutter pub deps

# Tester la compilation
flutter build apk --verbose
flutter build ios --verbose

# Profiler l'app
flutter run --profile

# Voir les logs
flutter logs

# Tester sur device spécifique
flutter run -d <device_id>

# Lancer avec custom argument
flutter run --dart-define=DEBUG=true
```

---

## 🆘 Obtenir de l'Aide

### Ressources
1. **Flutter Docs:** https://flutter.dev/docs
2. **Dart Docs:** https://dart.dev/guides
3. **Stack Overflow:** Tag `flutter`
4. **Flutter Issues:** https://github.com/flutter/flutter/issues

### Rapport de Bug
```bash
flutter doctor -v
flutter run -v 2>&1 > debug_log.txt
# Inclure debug_log.txt dans le rapport
```

---

**Version:** 1.0.0  
**Dernière mise à jour:** Novembre 2025

🎯 **Besoin d'aide? Vérifiez d'abord cette liste, puis consultez la documentation officielle!**
