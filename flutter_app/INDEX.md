# 📚 INDEX - Application Mobile Flutter

## 🎯 Par Où Commencer ?

### 🚀 Vous êtes Pressé ?
→ **Lire**: [`QUICK_START.md`](QUICK_START.md) (5 min)

### 📖 Vous Voulez Installer Correctement ?
→ **Lire**: [`SETUP_GUIDE.md`](SETUP_GUIDE.md) (30 min)

### 🔄 Vous Voulez Synchroniser avec Desktop ?
→ **Lire**: [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) (15 min)

### 📋 Vous Voulez Tout Comprendre ?
→ **Lire**: [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md) (45 min)

### ⚙️ Vous Voulez Configurer l'App ?
→ **Lire**: [`CONFIG.md`](CONFIG.md) (20 min)

---

## 📁 Structure du Projet

### Documents Principaux

```
flutter_app/
├─ 📄 QUICK_START.md           ← COMMENCER ICI!
├─ 📄 README.md                ← Vue d'ensemble
├─ 📄 SETUP_GUIDE.md           ← Installation détaillée
├─ 📄 INTEGRATION_GUIDE.md     ← Sync desktop ↔ mobile
├─ 📄 FINAL_SUMMARY.md         ← Résumé complet
├─ 📄 CONFIG.md                ← Configuration
├─ 📄 INDEX.md                 ← Ce fichier
│
├─ 📦 pubspec.yaml             ← Dépendances
├─ 🔧 app_config.json          ← Config app
├─ 📊 example_data.json        ← Données de test
│
└─ 📂 lib/                      ← CODE SOURCE
   ├─ main.dart                ← Point d'entrée
   ├─ 📂 models/               ← Modèles de données
   ├─ 📂 services/             ← Services
   ├─ 📂 providers/            ← État (Riverpod)
   ├─ 📂 screens/              ← Écrans
   ├─ 📂 routes/               ← Navigation
   ├─ 📂 widgets/              ← Composants
   └─ 📂 utils/                ← Utilitaires
```

---

## 🎓 Guide de Lecture par Cas d'Usage

### Cas 1: Je Veux Juste Tester L'App

**Durée**: 10 minutes  
**Étapes**:
1. Lire [`QUICK_START.md`](QUICK_START.md)
2. `flutter pub get`
3. `flutter run`
4. Se connecter (Jean / 1234)
5. Naviguer dans les 6 modules

**Résultat**: App fonctionnelle testée ✓

---

### Cas 2: Je Dois Installer L'App Sur Mon PC

**Durée**: 1 heure  
**Étapes**:
1. Lire [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Installation Flutter
2. Suivre les instructions Android/iOS
3. `flutter doctor` pour vérifier
4. `flutter run` pour tester
5. Build APK/IPA si nécessaire

**Résultat**: App installée et fonctionnelle ✓

---

### Cas 3: Je Veux Importer les Données du Desktop

**Durée**: 20 minutes  
**Étapes**:
1. Lire [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)
2. Exporter données depuis app desktop
3. Importer dans l'app mobile
4. Vérifier les données
5. Tester l'authentification

**Résultat**: Données synchronisées ✓

---

### Cas 4: Je Veux Comprendre L'Architecture

**Durée**: 1-2 heures  
**Étapes**:
1. Lire [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)
2. Explorer le code dans `lib/`
3. Comprendre Riverpod et GoRouter
4. Identifier les modèles de données
5. Tracer le flux authentification

**Résultat**: Compréhension complète ✓

---

### Cas 5: Je Veux Modifier/Étendre L'App

**Durée**: Dépend des changements  
**Étapes**:
1. Lire [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md) pour architecture
2. Lire [`CONFIG.md`](CONFIG.md) pour configuration
3. Identifier le fichier à modifier
4. Suivre les conventions de code
5. Tester les changements

**Ressources**:
- `lib/models/person.dart` - Modifier les modèles
- `lib/screens/main_screen.dart` - Modifier les écrans
- `lib/providers/auth_provider.dart` - Modifier l'état
- `lib/services/` - Ajouter des services

---

### Cas 6: Je Veux Déployer L'App

**Durée**: 2-3 heures  
**Étapes**:
1. Lire [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Section "Build pour Production"
2. Préparer les certificats (iOS) / Keys (Android)
3. `flutter build apk --release` ou `flutter build appbundle --release`
4. Tester sur device physique
5. Uploader sur PlayStore/AppStore

**Résources**:
- Android: PlayStore Console
- iOS: Apple Developer Account

---

## 🗂️ Fichiers Source Expliqués

### `lib/main.dart`
**But**: Point d'entrée de l'application
**Contient**:
- Configuration du thème
- Initialisation Riverpod
- Configuration GoRouter
**À modifier**: Couleurs, langue, titre

---

### `lib/models/person.dart`
**But**: Définition de tous les modèles de données
**Contient**:
- `Person` - Utilisateur
- `ActivityReport` - Rapport mensuel
- `Assignments` - Attributions
- `Services`, `Ministry`, `Spiritual`
- Serialization JSON
**À modifier**: Ajouter/modifier champs utilisateur

---

### `lib/services/`

#### `storage_service.dart`
**But**: Accès à SharedPreferences
**Méthodes**:
- `getPeople()`, `savePeople()`
- `getAssembly()`, `saveAssembly()`
- `getCurrentUser()`, `setCurrentUser()`
- `getAuthToken()`, `setAuthToken()`

#### `auth_service.dart`
**But**: Authentification 2 étapes
**Méthodes**:
- `validateAssembly()` - Étape 1
- `validateUser()` - Étape 2
- `logout()` - Déconnexion
- `isAuthenticated()` - Vérifier état

#### `data_import_service.dart`
**But**: Import/export JSON
**Méthodes**:
- `importPeopleFromJson()`
- `exportPeopleToJson()`
- `syncWithBackend()` (futur API)

---

### `lib/providers/auth_provider.dart`
**But**: Gestion de l'état global (Riverpod)
**Providers**:
- `authStateProvider` - État d'authentification
- `peopleProvider` - Liste des personnes
- `currentUserProvider` - Utilisateur connecté
- `activeServicesProvider` - Services assignés
- `previousMonthReportProvider` - Rapport précédent

---

### `lib/screens/`

#### `login_screen.dart`
**But**: Écrans de connexion
**Classes**:
- `LoginScreen` - PageView avec 2 pages
- `AssemblyLoginPage` - Étape 1
- `UserLoginPage` - Étape 2

#### `main_screen.dart`
**But**: Application principale
**Classes**:
- `MainScreen` - Navigation bottom bar
- `AssemblyPage` - Module Assemblée
- `ProgrammesPage` - Module Programmes
- `AttributionsPage` - Module Attributions
- `ServicesPage` - Module Services
- `TerritoriesPage` - Module Territoires
- `ProfilePage` - Module Moi

---

### `lib/routes/router.dart`
**But**: Configuration GoRouter
**Routes**:
- `/login` → LoginScreen
- `/home` → MainScreen
- Redirection automatique

---

### `lib/utils/helpers.dart`
**But**: Fonctions utilitaires
**Classes**:
- `DateUtils` - Manipulation de dates
- `FormatUtils` - Formatage de texte
- `ValidationUtils` - Validations

---

## 🔍 Navigation Entre Documents

### De QUICK_START vers...
- Installation complète → [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- Données desktop → [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)
- Architecture complète → [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)

### De README vers...
- Installation détaillée → [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- Synchronisation → [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)
- Configuration UI → [`CONFIG.md`](CONFIG.md)
- Résumé technique → [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)

### De SETUP_GUIDE vers...
- Déploiement → Section "Build pour Production"
- Dépannage → Section "Troubleshooting"
- Architecture → [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)

### De INTEGRATION_GUIDE vers...
- Configuration → [`CONFIG.md`](CONFIG.md)
- Architecture données → [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)
- Code source → `lib/models/person.dart`

### De CONFIG vers...
- Installation → [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- Synchronisation → [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)
- Architecture → [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md)

### De FINAL_SUMMARY vers...
- Code source → Consulter `lib/`
- Installation → [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- Données → [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)
- Configuration → [`CONFIG.md`](CONFIG.md)

---

## 🎯 Tableau de Décision

| Je Veux... | Lire | Durée |
|-----------|------|-------|
| Tester rapidement | QUICK_START | 5 min |
| Installer correctement | SETUP_GUIDE | 30 min |
| Comprendre l'architecture | FINAL_SUMMARY | 45 min |
| Importer données desktop | INTEGRATION_GUIDE | 15 min |
| Configurer l'app | CONFIG | 20 min |
| Tout savoir | Lire tous | 2h |
| Modifier un écran | FINAL_SUMMARY + code | 30 min |
| Ajouter un service | FINAL_SUMMARY + code | 1h |
| Déployer l'app | SETUP_GUIDE | 2-3h |

---

## 📊 Statistiques Documentation

| Document | Pages | Temps Lecture | Technicité |
|----------|-------|--------------|-----------|
| QUICK_START | 2 | 5 min | Débutant |
| README | 4 | 10 min | Débutant |
| SETUP_GUIDE | 15 | 30 min | Intermédiaire |
| INTEGRATION_GUIDE | 12 | 20 min | Intermédiaire |
| FINAL_SUMMARY | 18 | 45 min | Avancé |
| CONFIG | 10 | 20 min | Intermédiaire |
| **TOTAL** | **61** | **2h30** | - |

---

## ✅ Checklist de Lecture

Vous avez lu:
- [ ] QUICK_START.md
- [ ] README.md
- [ ] SETUP_GUIDE.md
- [ ] INTEGRATION_GUIDE.md
- [ ] FINAL_SUMMARY.md
- [ ] CONFIG.md
- [ ] Ce fichier (INDEX.md)

**Bravo!** 🎉 Vous maîtrisez complètement le projet.

---

## 🆘 Aide Rapide

### Je ne sais pas par où commencer
→ Lire [`QUICK_START.md`](QUICK_START.md)

### L'app ne fonctionne pas
→ Lire [`SETUP_GUIDE.md`](SETUP_GUIDE.md) section "Troubleshooting"

### Les données ne s'importent pas
→ Lire [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md)

### L'architecture est incompréhensible
→ Lire [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md) section "Architecture"

### Je ne sais pas comment modifier un écran
→ Lire [`FINAL_SUMMARY.md`](FINAL_SUMMARY.md) section "Modèles de Données" + consulter `lib/screens/`

### Comment changer la couleur ?
→ Lire [`CONFIG.md`](CONFIG.md) section "Couleurs"

---

## 🎓 Ressources Externes

- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [GoRouter Documentation](https://pub.dev/packages/go_router)
- [Dart Documentation](https://dart.dev/guides)
- [Material Design 3](https://m3.material.io)

---

**Version**: 1.0.0  
**Dernière mise à jour**: Novembre 2025  
**Maintenu par**: Gestionnaire d'Assemblée Team  

---

🎉 **Bienvenue dans le projet Flutter!**

Vous avez des questions ? Consultez ce guide ou les documents spécialisés.

**Bonne lecture!** 📚
