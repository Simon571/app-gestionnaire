# 🔄 Guide d'Intégration Desktop ↔ Mobile

## Flux de Données

### Direction 1: Desktop → Mobile (Import)

#### Étape 1: Exporter depuis Desktop (Tauri)
```
1. Ouvrir l'application desktop
2. Aller à: Publisher App → Envoyer les données
3. Sélectionner:
   - ✓ Personnes
   - ✓ Rapports
   - ✓ Attributions
   - ✓ Services
4. Cliquer "Exporter" 
5. Fichier généré: `people.json`
```

#### Étape 2: Importer dans Mobile
```dart
// Option 1: Via fichier JSON
final jsonString = await readJsonFile('people.json');
final success = await dataImportService.importPeopleFromJson(jsonString);

// Option 2: Via API (futur)
final people = await apiService.fetchPeople();
await storageService.savePeople(people);
```

#### Structure des données exportées

**Format: `List<Person>`**
```json
[
  {
    "id": "001",
    "firstName": "Jean",
    "lastName": "Dupont",
    "displayName": "Jean Dupont",
    "pin": "1234",
    "email1": "jean@example.com",
    "mobilePhone": "+243123456789",
    "spiritual": {
      "function": "publisher",
      "active": true,
      "group": "groupe1"
    },
    "assignments": {
      "services": {
        "doorAttendant": true,
        "soundSystem": false,
        "rovingMic": true,
        "stageMic": false,
        "sanitary": false,
        "hallAttendant": false,
        "mainDoorAttendant": false,
        "maintenance": false
      },
      "ministry": {
        "student": false,
        "firstContact": true,
        "returnVisit": true,
        "bibleStudy": true,
        "explainBeliefs": false,
        "discourse": false
      }
    },
    "activity": [
      {
        "month": "2025-11",
        "participated": true,
        "bibleStudies": 3,
        "isAuxiliaryPioneer": false,
        "hours": 12.5,
        "credit": 0,
        "isLate": false,
        "remarks": ""
      },
      {
        "month": "2025-10",
        "participated": true,
        "bibleStudies": 2,
        "isAuxiliaryPioneer": false,
        "hours": 10.0,
        "credit": 0,
        "isLate": false,
        "remarks": "Congé"
      }
    ]
  }
]
```

### Direction 2: Mobile → Desktop (Synchronisation futur)

#### Rapports envoyés par utilisateur
```
Mobile → Admin Desktop
  └─ Module "Publisher App"
     └─ Onglet "Recevoir les données"
        └─ Type: "Rapport"
           - Accepter → Transférer à "Personnes" → "Activité de proclamateur"
```

## 📋 Checklist d'Implémentation

### Phase 1: Import Initial
- [ ] Générer `people.json` depuis desktop
- [ ] Placer dans le dossier assets mobile
- [ ] Exécuter `DataImportService.importPeopleFromJson()`
- [ ] Vérifier les données dans SharedPreferences

### Phase 2: Authentification
- [ ] Tester connexion assemblée (étape 1)
- [ ] Tester connexion utilisateur (étape 2)
- [ ] Vérifier persistance des données
- [ ] Tester logout

### Phase 3: Affichage des données
- [ ] Afficher les attributions de l'utilisateur
- [ ] Afficher les services assignés
- [ ] Afficher les rapports d'activité
- [ ] Afficher les événements

### Phase 4: Synchronisation (Futur)
- [ ] Implémenter API backend
- [ ] Ajouter WebSockets pour sync temps réel
- [ ] Gérer les conflits de données
- [ ] Implémenter offline-first

## 🔗 Correspondance des Données

| Desktop | Mobile | Stockage | Sync |
|---------|--------|----------|------|
| Module "Personnes" | Modèle `Person` | SQLite/SharedPrefs | Manuel ✓ |
| Tab "Information" | `Person.displayName` | JSON | Manuel ✓ |
| Tab "Activités de proclamateur" | `Person.activity[]` | JSON | Manuel ✓ |
| Tab "Attribuer" | `Person.assignments.services` | JSON | Manuel ✓ |
| Module "Programme" → "Services" | `WeeklyServiceAssignment` | JSON | Manuel ✓ |
| Module "Publisher App" → "Utilisateurs" | `Person.pin` | JSON | Manuel ✓ |
| Module "Assemblée" → "Partage" | `Assembly` | JSON | Manuel ✓ |

## 🛠️ Fonctions d'Aide

### 1. Générer JSON depuis Desktop
```typescript
// Dans application desktop (TypeScript)
const people = usePeople();

const exportJson = () => {
  const json = JSON.stringify(people, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'people.json';
  link.click();
};
```

### 2. Importer dans Mobile
```dart
// Dans application mobile (Flutter)
Future<void> importData() async {
  try {
    final file = File('assets/data/people.json');
    final jsonString = await file.readAsString();
    
    final success = await ref.read(dataImportService)
        .importPeopleFromJson(jsonString);
    
    if (success) {
      print('✓ Données importées avec succès');
      // Recharger l'UI
      ref.refresh(peopleProvider);
    }
  } catch (e) {
    print('✗ Erreur import: $e');
  }
}
```

### 3. Exporter depuis Mobile (backup)
```dart
Future<void> backupData() async {
  final jsonString = await ref.read(dataImportService)
      .exportPeopleToJson();
  
  // Sauvegarder dans les fichiers locaux
  final dir = await getApplicationDocumentsDirectory();
  final file = File('${dir.path}/backup_${DateTime.now().millisecondsSinceEpoch}.json');
  await file.writeAsString(jsonString);
}
```

## 🔐 Sécurité de la Sync

1. **Avant d'importer**: Valider le format JSON
2. **Pendant l'import**: Vérifier les champs requis
3. **Après l'import**: Crypter les données sensibles
4. **Authentification**: Vérifier assemblée + utilisateur
5. **Intégrité**: Comparer les checksums

## ⚠️ Gestion des Erreurs

| Erreur | Cause | Solution |
|--------|-------|----------|
| `JSON invalid` | Format incorrect | Vérifier le format depuis desktop |
| `PersonNotFound` | PIN inexistent | Vérifier le PIN dans desktop |
| `StorageError` | SharedPrefs plein | Nettoyer les anciennes données |
| `AuthFailed` | Données corrompues | Réimporter les données |

## 📞 Débogage

```dart
// Afficher les données importées
final people = await storageService.getPeople();
for (final person in people) {
  print('ID: ${person.id}');
  print('Name: ${person.displayName}');
  print('Services: ${person.assignments.services.getActiveServices()}');
  print('---');
}

// Vérifier le stockage
final assembly = await storageService.getAssembly();
print('Assembly: ${assembly?.name}');

// Tester l'authentification
final success = await authService.validateUser(
  firstName: 'Jean',
  personalPin: '1234',
);
print('Auth: $success');
```

## 🎯 Prochaines Étapes

1. **Court terme**: Tester import manuel
2. **Moyen terme**: Implémenter API pour sync automatique
3. **Long terme**: Ajouter synchronisation temps réel (WebSockets)
4. **Futur**: Ajouter offline-first avec cache intelligent
