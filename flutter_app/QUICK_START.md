# 🚀 QUICK START - Application Mobile Flutter

## ⚡ Démarrage en 5 minutes

### 1. Prérequis Installés ?
```bash
flutter --version    # ✓ Doit afficher 3.0+
dart --version       # ✓ Doit afficher 3.0+
```

### 2. Cloner et Installer
```bash
cd flutter_app
flutter pub get
flutter doctor      # Vérifier aucune erreur rouge
```

### 3. Lancer l'App
```bash
flutter run
```

**Résultat attendu**: App démarre avec écran de connexion bleu

---

## 🔐 Tester la Connexion

### Données de Test
Utilisez ces identifiants avec les données de test (`example_data.json`):

#### Étape 1: Assemblée
- **Région**: Afrique
- **ID Assemblée**: ASM-001
- **PIN Assemblée**: Tout numérique (ex: 1234)

#### Étape 2: Utilisateur
- **Prénom**: Jean (ou Marie, Paul)
- **PIN Personnel**: 1234

---

## 📱 Navigation Principale

Une fois connecté:
```
┌────────────────────────────────┐
│ [Assemblée] [Prog] [Attr] ...  │
├────────────────────────────────┤
│                                │
│  Contenu du module sélectionné │
│                                │
├────────────────────────────────┤
│ 🏠  📅  📝  🛠️  🗺️  👤        │
└────────────────────────────────┘
```

**Cliquer sur les onglets** pour naviguer entre les 6 modules.

---

## 📊 Importer les Données

### Depuis le Desktop

**Option 1: Import Manuel (Recommandé pour test)**
```dart
// Dans lib/services/data_import_service.dart
// Appeler depuis le code:
final jsonString = await readFile('example_data.json');
await ref.read(dataImportService).importPeopleFromJson(jsonString);
```

**Option 2: Depuis le Desktop Tauri**
1. Ouvrir app desktop
2. Publisher App → Envoyer les données
3. Copier le JSON généré
4. Coller dans `example_data.json` mobile

### Vérifier l'Import
```dart
final people = await storageService.getPeople();
print('✓ ${people.length} personnes importées');
```

---

## 🧪 Quick Tests

### Test 1: Authentification
```
1. Lancer l'app
2. Remplir écran 1 (Assemblée)
3. Cliquer "Suivant"
4. Remplir écran 2 (Utilisateur)
5. Cliquer "Connexion"
✓ Devrait afficher MainScreen
```

### Test 2: Navigation
```
1. Connecté
2. Cliquer chaque onglet en bas
3. Vérifier affichage du contenu
✓ Doit afficher quelque chose pour chaque onglet
```

### Test 3: Données Utilisateur
```
1. Aller à "Moi"
2. Vérifier affichage du profil
3. Voir services assignés
✓ Doit afficher le nom et les services
```

---

## 🔧 Commandes Utiles

```bash
# Nettoyage complet
flutter clean
flutter pub get
flutter run

# Logs détaillés
flutter run -v

# DevTools
flutter pub global activate devtools
flutter pub global run devtools

# Tests
flutter test

# Build Android
flutter build apk --release

# Build iOS
flutter build ios --release
```

---

## 🎨 Structure Rapide

```
flutter_app/
├── lib/
│   ├── main.dart                    # Démarrage
│   ├── models/person.dart           # 📊 Données
│   ├── services/                    # 🔧 Services
│   ├── providers/auth_provider.dart # 📍 État global
│   ├── screens/                     # 📱 Écrans
│   └── routes/router.dart           # 🗺️ Navigation
├── pubspec.yaml                     # 📦 Dépendances
├── SETUP_GUIDE.md                   # 📖 Guide complet
├── INTEGRATION_GUIDE.md             # 🔄 Sync desktop
└── FINAL_SUMMARY.md                 # 📋 Résumé complet
```

---

## ❓ FAQ Rapide

### Q: Comment ajouter des utilisateurs ?
R: Modifier `example_data.json` ou importer depuis desktop

### Q: Comment changer les couleurs ?
R: Aller à `lib/main.dart` → `ThemeData`

### Q: Comment ajouter un écran ?
R: 
1. Créer `lib/screens/mon_ecran.dart`
2. Ajouter route dans `lib/routes/router.dart`
3. Ajouter navigation dans `lib/screens/main_screen.dart`

### Q: Comment déboguer ?
R: `flutter run -v` puis ouvrir DevTools

### Q: L'app plante ?
R: 
```bash
flutter clean
flutter pub get
flutter run
```

---

## 📲 Avant de Déployer

- [ ] ✅ Tous les tests passent
- [ ] ✅ `flutter analyze` sans erreurs
- [ ] ✅ Données importées correctement
- [ ] ✅ Authentification testée
- [ ] ✅ Tous les 6 modules testés
- [ ] ✅ Écrans responsifs OK
- [ ] ✅ Version bump dans `pubspec.yaml`

---

## 🔗 Ressources Importantes

| Document | But |
|----------|-----|
| **README.md** | Vue d'ensemble générale |
| **SETUP_GUIDE.md** | Installation et configuration |
| **INTEGRATION_GUIDE.md** | Sync avec desktop |
| **FINAL_SUMMARY.md** | Résumé complet du projet |
| **CONFIG.md** | Configuration détaillée |

---

## 📞 Besoin d'Aide ?

1. **Lire SETUP_GUIDE.md** pour installation
2. **Lire INTEGRATION_GUIDE.md** pour données
3. **Vérifier FINAL_SUMMARY.md** pour architecture
4. **Consulter Config.md** pour paramètres

---

## ✨ Prochaines Étapes Recommandées

1. **Tester l'app**: `flutter run`
2. **Importer les données**: Utiliser `example_data.json`
3. **Vérifier l'authentification**: Se connecter
4. **Tester navigation**: Cliquer tous les onglets
5. **Enrichir modules**: Ajouter plus de contenu
6. **Ajouter API**: Implémenter sync backend
7. **Publier**: Build et release

---

**Que faire maintenant ?**

```
Réponse rapide:
1. flutter pub get
2. flutter run
3. Se connecter avec: Jean / 1234
4. Cliquer les onglets
5. Vérifier que tout fonctionne ✓

Résultat attendu:
✓ App démarre
✓ Login fonctionne
✓ 6 modules affichent du contenu
✓ Navigation OK
✓ Déconnexion OK
```

---

**Version**: 1.0.0  
**Status**: ✅ Prêt à l'emploi  
**Date**: Novembre 2025
