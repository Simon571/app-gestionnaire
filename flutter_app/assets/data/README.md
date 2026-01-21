# Dossier des Données Flutter

Ce dossier contient les fichiers JSON utilisés par l'application Flutter mobile.

## ⚠️ Important - Ne pas modifier directement

**NE MODIFIEZ PAS** les fichiers de ce dossier directement !

Les modifications doivent être faites dans le dossier parent `../../data/` (au niveau de l'application web).

## 🔄 Synchronisation

Pour synchroniser les données de l'application web vers Flutter :

1. Retournez au dossier parent : `cd ..`
2. Exécutez le script : `.\sync_data.ps1`

Le script copiera automatiquement tous les fichiers à jour depuis `../../data/` vers ce dossier.

## 📁 Fichiers contenus

| Fichier | Description | Source |
|---------|-------------|--------|
| `publisher-users.json` | Liste des proclamateurs (18 utilisateurs) | Application web |
| `families.json` | Données des familles | Application web |
| `attendance.json` | Historique de présence | Application web |
| `preaching-groups.json` | Définition des 8 groupes | Application web |
| `publisher-preaching.json` | Rapports de prédication | Application web |

## 🔄 Workflow de mise à jour

```
Application Web (../../data/)
         ↓
   sync_data.ps1
         ↓
Flutter Assets (./assets/data/)
         ↓
   flutter clean
   flutter run
```

## 📊 État actuel

- **Utilisateurs** : 18 proclamateurs
- **Groupes actifs** : 6 sur 8
- **Dernière sync** : 8 janvier 2026

---

Pour plus d'informations, consultez `../GUIDE-SYNCHRONISATION.md`
