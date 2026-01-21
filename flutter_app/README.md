# 📱 Application Mobile - Gestionnaire d'Assemblée

Version mobile Flutter pour utilisateurs - synchronisée avec la version desktop Tauri.

## 🎯 Fonctionnalités

### 6 Modules Principaux

1. **Assemblée** 🏢
   - Rapport mensuel (statut transmission)
   - Événements à venir
   - Témoignage public
   - Tableau d'affichage

2. **Programmes** 📅
   - Réunion de semaine
   - Réunion de week-end
   - Réunion pour la prédication

3. **Attributions** 📝
   - Services assignés par semaine
   - Statut et détails

4. **Services** 🛠️
   - Services à venir
   - Calendrier des assignations

5. **Territoires** 🗺️
   - Gestion des territoires
   - Disponibilité

6. **Moi** 👤
   - Profil utilisateur
   - Historique d'activité
   - Coordonnées
   - Demandes

## 🔐 Authentification (2 Étapes)

### Étape 1: Connexion Assemblée
- Région
- ID de l'assemblée
- PIN de l'assemblée

### Étape 2: Connexion Utilisateur
- Prénom (autocomplétion)
- PIN personnel

## 🏗️ Architecture

```
lib/
├── main.dart                 # Point d'entrée
├── models/
│   └── person.dart          # Modèles de données
├── services/
│   ├── storage_service.dart      # Stockage local (SharedPreferences)
│   ├── auth_service.dart         # Service d'authentification
│   └── data_import_service.dart  # Import/export de données
├── providers/
│   └── auth_provider.dart        # État global (Riverpod)
├── screens/
│   ├── login_screen.dart    # Écrans de connexion
│   └── main_screen.dart     # Écrans principaux
├── routes/
│   └── router.dart          # Navigation GoRouter
├── widgets/                 # Composants réutilisables
└── utils/
    └── helpers.dart         # Utilitaires
```

## 📦 Dépendances

- **flutter_riverpod**: Gestion d'état
- **go_router**: Navigation
- **shared_preferences**: Stockage local
- **dio**: Requêtes HTTP (futur API)
- **intl**: Localisation et formats

## 🚀 Installation

### Prérequis
- Flutter 3.0+
- Dart 3.0+

### Installation

```bash
cd flutter_app

# Installer les dépendances
flutter pub get

# Exécuter l'app
flutter run

# Build pour Android
flutter build apk --release

# Build pour iOS
flutter build ios --release
```

## 📊 Synchronisation des Données

### Format des données
Les données utilisateur sont stockées en JSON et synchronisées avec la version desktop.

#### Structure Person (depuis desktop)
```json
{
  "id": "123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "displayName": "Jean Dupont",
  "pin": "1234",
  "spiritual": {
    "active": true,
    "function": "publisher"
  },
  "assignments": {
    "services": {
      "doorAttendant": true,
      "soundSystem": false
    }
  },
  "activity": [
    {
      "month": "2025-11",
      "participated": true,
      "hours": 12.5,
      "bibleStudies": 3
    }
  ]
}
```

### Import depuis Desktop

1. **Exporter depuis l'app desktop** (Tauri)
   - Module "Publisher App" → "Envoyer les données"
   - Format: JSON

2. **Importer dans l'app mobile**
   - Utiliser `DataImportService`
   - Valider avec les identifiants

3. **Synchronisation automatique**
   - LocalStorage → SharedPreferences
   - Même structure de données

## 🔄 Flux de Connexion

```
Login Screen (Étape 1)
    ↓ (PIN assemblée valide)
Login Screen (Étape 2)
    ↓ (PIN personnel valide)
Main Screen (Navigation par onglets)
    ↓
- Assemblée
- Programmes
- Attributions
- Services
- Territoires
- Moi
```

## 📱 Écrans Principaux

### Assemblée
- **Rapport**: Statut du rapport mensuel (✓ Transmis ou ✗ Non envoyé)
- **Prochain**: Attributions et services de l'utilisateur
- **Témoignage Public**: Calendrier des participations
- **Tableau d'affichage**: Communications et documents

### Programmes
 
 Lorsque une semaine inclut un meetingType 'vie_chretienne_ministere' dans programme_week.json, l'application affiche maintenant la section "Vie chrétienne" avant la section "Applique-toi au ministère" afin que l'ordre corresponde au cahier pour ce type de réunion.
### Services
- Services actuels assignés
- Calendrier hebdomadaire

### Profil
- Informations personnelles
- Historique d'activité
- Demandes et paramètres

## 🔒 Sécurité

- **LocalStorage sécurisé**: SharedPreferences avec accès limité
- **PIN masqué**: Validation côté client
- **Pas de transmission en clair**: Future API avec SSL/TLS
- **Authentification 2 étapes**: Assemblée + Utilisateur

## 🔌 API (Futur)

L'app est prête pour se connecter à une API backend:

```dart
// Service API (à implémenter)
class ApiService {
  final Dio _dio = Dio();
  
  Future<List<Person>> fetchPeople() async {
    // TODO: Appel API
  }
}
```

## 🧪 Tests

```bash
# Tests unitaires
flutter test

# Tests d'intégration
flutter test integration_test/
```

## 📋 État des Modules

- ✅ **Assemblée**: Complet (Rapport, Prochain, Témoignage, Tableau)
- ✅ **Programmes**: Interface (à enrichir)
- ✅ **Attributions**: Structure (à remplir)
- ✅ **Services**: Affichage des services assignés
- ✅ **Territoires**: Structure (à remplir)
- ✅ **Moi**: Profil utilisateur complet

## 🐛 Débogage

### Logs
```dart
print('Debug: $message');
debugPrint('Flutter: $message');
```

### Shared Preferences Console
```bash
flutter pub global activate shared_preferences_cli
shared_preferences_cli
```

## 📞 Support

Pour les bugs ou améliorations, veuillez:
1. Vérifier les logs (DevTools)
2. Consulter la console Riverpod
3. Vérifier le stockage local (SharedPreferences)

## 📄 Licence

© 2025 Gestionnaire d'Assemblée - Tous droits réservés
