# Correction des Groupes de Prédication

## Problème
Le module MOI de l'application Flutter n'affichait que 2 groupes de prédication au lieu de 8.

## Cause
1. Le fichier `assets/data/publisher-users.json` dans l'application Flutter n'était pas à jour (642 lignes au lieu de 2882)
2. Le fichier `assets/data/preaching-groups.json` n'existait pas dans l'application Flutter
3. Les IDs de groupes dans `publisher-users.json` ne correspondaient pas aux IDs définis dans `preaching-groups.json`

## Solutions Appliquées

### 1. Mise à jour des fichiers de données
- ✅ Copie du fichier `data/publisher-users.json` vers `flutter_app/assets/data/publisher-users.json`
- ✅ Copie du fichier `data/preaching-groups.json` vers `flutter_app/assets/data/preaching-groups.json`

### 2. Mapping des IDs de groupes
Les anciens IDs ont été remplacés par les nouveaux pour assurer la cohérence :

| Ancien ID | Nouveau ID | Nom du Groupe |
|-----------|------------|---------------|
| group-1762075710921 | group-1764631730179 | GROUPE 1 |
| group-1762075718330 | group-1764631738466 | GROUPE 2 |
| group-1762075746776 | group-1764631744941 | GROUPE 3 |
| group-1762075754432 | group-1762075782725 | GROUPE 4 |
| group-1762075760487 | group-1764631760309 | GROUPE 5 |
| group-1762075800148 | group-1764631772096 | GROUPE 6 |

### 3. Groupes disponibles
Les 8 groupes définis dans `preaching-groups.json` :
1. GROUPE 1 (group-1764631730179)
2. GROUPE 2 (group-1764631738466)
3. GROUPE 3 (group-1764631744941)
4. GROUPE 4 (group-1762075782725)
5. GROUPE 5 (group-1764631760309)
6. GROUPE 6 (group-1764631772096)
7. GROUPE 7 (group-1764631782847) - Pas encore utilisé
8. GROUPE 8 (group-1764631790811) - Pas encore utilisé

## Notes
- Actuellement, seuls 6 groupes sur 8 ont des membres assignés
- Les groupes 7 et 8 sont disponibles mais n'ont pas encore de membres
- L'application Flutter crée dynamiquement les groupes affichés en fonction des données des utilisateurs dans `publisher-users.json`
- Pour qu'un groupe soit affiché, il faut qu'au moins un utilisateur ait cet ID de groupe dans son profil (`spiritual.group`)

## Pour ajouter des membres aux groupes 7 et 8
1. Ouvrir le fichier `flutter_app/assets/data/publisher-users.json`
2. Modifier la propriété `spiritual.group` des utilisateurs concernés
3. Utiliser les IDs suivants :
   - Groupe 7 : `group-1764631782847`
   - Groupe 8 : `group-1764631790811`
4. Relancer l'application

## Date de la correction
8 janvier 2026
