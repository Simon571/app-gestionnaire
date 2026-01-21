# Guide de Synchronisation des Données Flutter

## Problème Résolu

### Problème 1 : Utilisateurs non reconnus
Les utilisateurs ajoutés dans l'application web ne sont pas automatiquement reconnus dans l'application Flutter car les fichiers de données ne sont pas synchronisés.

### Problème 2 : Onglet proclamateur n'affiche qu'un groupe "non prédefinie"
L'application Flutter peut afficher "Groupe non défini" si les données sont obsolètes ou si le cache SharedPreferences contient d'anciennes données.

## Solutions

### 1. Script de Synchronisation Automatique

Un script PowerShell `sync_data.ps1` a été créé pour automatiser la synchronisation.

#### Utilisation du Script

1. **Ouvrir PowerShell** dans le dossier `flutter_app`
2. **Exécuter la commande** :
   ```powershell
   .\sync_data.ps1
   ```

3. **Relancer l'application Flutter** :
   ```powershell
   flutter run -d windows
   ```

### 2. Bouton "Recharger données" dans l'application

Un bouton a été ajouté dans le module MOI, onglet Proclamateurs, pour forcer le rechargement des données depuis les assets.

#### Utilisation

1. Ouvrir l'application Flutter
2. Aller dans le module **MOI**
3. Cliquer sur l'onglet **Proclamateurs**
4. Cliquer sur le bouton **"Recharger données"** (icône cloud_download)
5. Confirmer l'action
6. Les données seront rechargées automatiquement

Ce bouton est visible uniquement pour les anciens et assistants ministériels.

## Ce que fait le script de synchronisation

- ✅ Copie automatiquement tous les fichiers de données depuis `data/` vers `flutter_app/assets/data/`
- ✅ Applique les mappings d'IDs de groupes pour assurer la cohérence
- ✅ Affiche un résumé des opérations effectuées

## Fichiers synchronisés

1. `publisher-users.json` - **18 utilisateurs** répartis dans **6 groupes**
2. `families.json` - Données des familles
3. `attendance.json` - Historique de présence
4. `preaching-groups.json` - Définition des 8 groupes
5. `publisher-preaching.json` - Rapports de prédication

## Répartition Actuelle des Utilisateurs

| Groupe   | Nombre de Membres |
|----------|-------------------|
| Groupe 1 | 7 membres         |
| Groupe 2 | 3 membres         |
| Groupe 3 | 3 membres         |
| Groupe 4 | 2 membres         |
| Groupe 5 | 2 membres         |
| Groupe 8 | 1 membre          |

**Total : 18 utilisateurs**

Les groupes 6 et 7 sont définis mais n'ont pas encore de membres assignés.

## Quand utiliser le script ?

Exécutez `sync_data.ps1` à chaque fois que :
- ✅ De nouveaux utilisateurs sont ajoutés via l'application web
- ✅ Des modifications sont apportées aux groupes
- ✅ Des données de famille ou de prédication sont mises à jour
- ✅ L'application Flutter ne reflète pas les dernières données

## Quand utiliser le bouton "Recharger données" ?

Utilisez le bouton dans l'application quand :
- ✅ L'onglet proclamateur n'affiche qu'un groupe "non prédefinie"
- ✅ Les groupes ne s'affichent pas correctement
- ✅ Les données semblent obsolètes
- ✅ Après avoir exécuté le script de synchronisation

## Note Importante

### Pour développeurs
Après la synchronisation avec le script `sync_data.ps1`, il est recommandé de :
1. Exécuter `flutter clean` pour nettoyer le cache de build
2. Relancer l'application avec `flutter run -d windows`

### Pour utilisateurs finaux
Utilisez simplement le bouton "Recharger données" dans l'application. Aucune manipulation technique n'est nécessaire.

## Améliorations Apportées

### Code modifié
1. **StorageService** ([lib/services/storage_service.dart](lib/services/storage_service.dart))
   - Ajout de la fonction `forceReloadFromAssets()` pour forcer le rechargement des données

2. **MainScreen** ([lib/screens/main_screen.dart](lib/screens/main_screen.dart))
   - Ajout du bouton "Recharger données" dans l'onglet Proclamateurs
   - Dialogue de confirmation avant rechargement
   - Indicateur de chargement pendant l'opération
   - Messages de succès/erreur

---

**Date de création** : 8 janvier 2026  
**Dernière mise à jour** : 8 janvier 2026  
**Version** : 2.0
