# Configuration de l'Application Mobile Flutter

## 🎨 Thème et UI

### Couleurs
```dart
// Primaire - Bleu
Color primary = Color(0xFF1E88E5);

// Secondaire - Vert
Color secondary = Color(0xFF43A047);

// Accent - Orange
Color accent = Color(0xFFFF9800);

// Erreur
Color error = Color(0xFFE53935);

// Succès
Color success = Color(0xFF4CAF50);

// Avertissement
Color warning = Color(0xFFFBC02D);
```

### Typographie
```dart
// H1 - 28pt Bold
heading1 = TextStyle(fontSize: 28, fontWeight: FontWeight.bold);

// H2 - 24pt Bold
heading2 = TextStyle(fontSize: 24, fontWeight: FontWeight.bold);

// Body - 16pt Regular
body = TextStyle(fontSize: 16, fontWeight: FontWeight.normal);

// Small - 14pt Regular
small = TextStyle(fontSize: 14, fontWeight: FontWeight.normal);
```

## 📱 Tailles et Espacements

```dart
// Padding standard
paddingSmall = 8.0;
paddingMedium = 16.0;
paddingLarge = 24.0;

// Border radius
borderRadiusSmall = 4.0;
borderRadiusMedium = 8.0;
borderRadiusLarge = 16.0;

// Hauteurs de bouton
buttonHeightSmall = 40.0;
buttonHeightMedium = 48.0;
buttonHeightLarge = 56.0;
```

## 🔐 Authentification

### PIN Assemblée
- Format: Numérique
- Longueur: 4-8 chiffres
- Stockage: SharedPreferences (chiffré)
- Expiration: Jamais

### PIN Personnel
- Format: Numérique
- Longueur: 4 chiffres minimum
- Stockage: SharedPreferences (chiffré)
- Validation: À chaque connexion

### Session
- Timeout: 1 heure
- Refresh: Automatique
- Logout: Manuel

## 🗄️ Base de Données Locale

### Stockage: SharedPreferences
```
people              → List<Person> JSON
assembly            → Assembly JSON
current_user        → Person JSON (connecté)
auth_token          → String
week_YYYY-MM-DD     → Weekly data JSON
settings_*          → Various settings
```

### Limites
- Max: ~10MB par app
- Recommandé: <1MB pour perf
- Nettoyage: Manuel après logout

## 🌐 Navigation

### Routes principales
```
/login              → Écran de connexion
/home               → Page d'accueil (Assemblée)
/programmes         → Page Programmes
/attributions       → Page Attributions
/services           → Page Services
/territories        → Page Territoires
/profile            → Page Profil
```

### Navigation secondaire
- Bottom Navigation Bar (6 onglets)
- AppBar avec paramètres
- Drawer (futur)

## 📊 Modules et Pages

### 1. Assemblée (6 sections)
- Rapport mensuel (card)
- Prochain (card)
- Témoignage public (card)
- Tableau d'affichage (card)
- Événements (list)
- Communications (list)

### 2. Programmes (3 sections)
- Réunion de semaine (expandable)
- Réunion de week-end (expandable)
- Réunion pour la prédication (expandable)

### 3. Attributions
- Liste par semaine
- Détails par attribution
- Statut (assigné/non assigné)

### 4. Services
- Services actifs
- Calendrier
- Notifications

### 5. Territoires
- Liste des territoires
- Demandes
- Historique

### 6. Moi (Profil)
- Informations personnelles
- Activité de prédication
- Coordonnées
- Paramètres
- Déconnexion

## 🔔 Notifications (Futur)

```dart
// Types
- report_reminder    → Rappel rapport
- service_reminder   → Rappel service
- event_upcoming     → Événement à venir
- new_assignment     → Nouvelle attribution
```

## 🌍 Localisation

```dart
// Langues supportées
- Français (fr)
- Anglais (en) - Futur
- Lingala (ln) - Futur
```

## 📲 Appareils Supportés

### Android
- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- Architectures: arm64-v8a, armeabi-v7a

### iOS
- Minimum: iOS 11.0
- Architectures: arm64

## 🔧 Configurations de Build

### Debug
```bash
flutter run --debug
```

### Release
```bash
flutter build apk --release    # Android
flutter build ios --release    # iOS
```

### Profile
```bash
flutter run --profile
```

## 🧪 Tests

### Types de tests
- Unit tests: Services, modèles
- Widget tests: Composants UI
- Integration tests: Navigation, workflows

### Exécution
```bash
flutter test                    # Tous les tests
flutter test test/auth_test.dart  # Test spécifique
```

## 📈 Performance

### Cibles
- Démarrage: <2 sec
- Première frame: <1 sec
- Frame rate: 60 FPS
- Mémoire: <100 MB

### Optimisations
- Lazy loading des listes
- Caching des images
- State management efficace (Riverpod)
- Code splitting

## 🐛 Debugging

### Logs
```dart
debugPrint('Flutter: $message');  // Logs Flutter
print('Debug: $message');          // Logs normaux
```

### DevTools
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

### Console Riverpod
- Inspecteur de providers
- Historique des changements
- Dépendances

## 📝 Conventions de Code

### Nommage
```dart
// Classes: PascalCase
class PersonService

// Variables: camelCase
final firstName = 'Jean';

// Constantes: camelCase
const maxAttempts = 3;

// Fichiers: snake_case
person_service.dart
```

### Imports
```dart
// Dart
import 'dart:async';

// Packages
import 'package:flutter/material.dart';

// Relatif
import '../models/person.dart';
```

### Commentaires
```dart
/// Commentaire de documentation
///
/// Multi-ligne possible

// TODO: Implémenter la fonctionnalité
// FIXME: Corriger le bug
// NOTE: Information importante
```

## 🚀 Déploiement

### Versions
- Version: MAJOR.MINOR.PATCH
- Build: Incrémenté à chaque build

### PlayStore / AppStore
- Screenshots en format spécifique
- Description longue/courte
- Politique de confidentialité
- Notes de version
