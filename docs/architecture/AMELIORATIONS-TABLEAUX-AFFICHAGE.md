# Améliorations des Tableaux d'Affichage - Synchronisation Web ↔️ Flutter

## 📋 Vue d'ensemble

Ce document détaille les améliorations apportées au système de communication entre les tableaux d'affichage de l'application web et l'application Flutter pour les trois tableaux distincts :
- **Tableau d'affichage assemblée** (accessible à tous)
- **Tableau d'affichage anciens** (accessible aux anciens uniquement)
- **Tableau d'affichage anciens et assistants** (accessible aux anciens et assistants ministériels)

---

## 🎯 Améliorations réalisées

### 1. ✅ Envoi différencié par tableau (Web)

**Fichier modifié** : `src/app/communications/page.tsx`

#### Fonctionnalités ajoutées :
- **Envoi groupé par tableau** : Chaque tableau est maintenant envoyé séparément avec ses métadonnées spécifiques
- **Bouton "Envoyer ce tableau"** : Permet d'envoyer uniquement les communications du tableau actif
- **Bouton "Tout envoyer"** : Envoie tous les tableaux en une seule opération
- **Métadonnées enrichies** : Chaque envoi inclut :
  - `boardType` : Type de tableau (assembly, elders, elders-assistants)
  - `boardLabel` : Label lisible pour l'affichage
  - `totalCount` : Nombre de communications
  - `message` : Message descriptif pour les notifications

#### Exemple de payload envoyé :
```json
{
  "type": "communications",
  "payload": {
    "generatedAt": "2026-01-17T14:30:00Z",
    "boardType": "assembly",
    "boardLabel": "Tableau d'affichage assemblée",
    "communications": [...],
    "totalCount": 5
  },
  "notify": true,
  "metadata": {
    "boardType": "assembly",
    "count": 5,
    "message": "5 communication(s) sur Tableau d'affichage assemblée"
  }
}
```

---

### 2. 🔔 Système de notifications (Flutter)

**Fichier créé** : `flutter_app/lib/providers/bulletin_notifications_provider.dart`

#### Fonctionnalités :
- **Détection automatique** des nouvelles communications par tableau
- **Notifications persistantes** sauvegardées localement
- **Marquage lu/non-lu** par notification
- **Compteur global** de notifications non lues
- **Filtrage par tableau** pour cibler les notifications

#### API du provider :
```dart
// Ajouter une notification
notifier.addNotification(
  boardType: 'assembly',
  boardLabel: "Tableau d'affichage assemblée",
  newCount: 3,
);

// Marquer comme lu
notifier.markAsRead(notificationId);
notifier.markAllAsReadForBoard('assembly');

// Obtenir le compte de notifications non lues
final unreadCount = ref.watch(unreadBulletinCountProvider);
```

---

### 3. 📎 Gestion avancée des pièces jointes (Flutter)

**Fichier créé** : `flutter_app/lib/services/attachment_service.dart`

#### Fonctionnalités :
- **Téléchargement** automatique des pièces jointes
- **Stockage local** organisé par tableau
- **Détection** des fichiers déjà téléchargés
- **Ouverture** des fichiers avec l'application appropriée
- **Gestion de l'espace** : calcul de la taille totale, suppression par tableau
- **Nettoyage** automatique des fichiers orphelins

#### Structure de stockage :
```
bulletin_attachments/
  ├── assembly/
  │   ├── comm-123_document.pdf
  │   └── comm-456_lettre.docx
  ├── elders/
  │   └── comm-789_rapport.pdf
  └── elders-assistants/
      └── comm-101_directive.pdf
```

#### API du service :
```dart
// Télécharger une pièce jointe
final file = await attachmentService.downloadAttachment(
  url: 'https://...',
  fileName: 'document.pdf',
  boardType: 'assembly',
  communicationId: 'comm-123',
);

// Vérifier si téléchargée
final isDownloaded = await attachmentService.isAttachmentDownloaded(
  fileName: 'document.pdf',
  boardType: 'assembly',
  communicationId: 'comm-123',
);

// Ouvrir une pièce jointe
final path = await attachmentService.getAttachmentPath(...);
await OpenFilex.open(path);
```

---

### 4. 📱 Écran dédié pour chaque tableau (Flutter)

**Fichier créé** : `flutter_app/lib/screens/bulletin_board_screen.dart`

#### Fonctionnalités :
- **Liste complète** des communications du tableau
- **Filtres multiples** :
  - Par type : Communications, Documents, Lettres
  - Par état : Tout, Non lues, Lues
- **Tri** : Par date, titre ou ordre
- **Vue détaillée** avec toutes les métadonnées
- **Indicateurs visuels** :
  - Point bleu pour les communications non lues
  - Icône de téléchargement pour les pièces jointes
  - Badge d'ordre
- **Menu contextuel** (appui long) :
  - Marquer comme lu/non-lu
  - Voir les détails
- **Actions** :
  - Ouvrir les liens externes
  - Télécharger et ouvrir les pièces jointes
  - Actualiser les données

#### Navigation :
L'écran est accessible depuis le dashboard principal en cliquant sur n'importe quelle ligne du tableau d'affichage.

---

### 5. ✓ Système de marquage lu/non-lu (Flutter)

**Fichier créé** : `flutter_app/lib/services/communication_read_state_service.dart`

#### Fonctionnalités :
- **Stockage local** des états de lecture par utilisateur
- **Marquage automatique** lors de l'ouverture d'une communication
- **Marquage manuel** via le menu contextuel
- **Compteurs** de communications lues/non lues
- **Statistiques** détaillées par tableau
- **Synchronisation** : export/import pour partage entre appareils
- **Nettoyage** automatique des états orphelins

#### API du service :
```dart
// Marquer comme lu
await readStateService.markAsRead('comm-123');

// Marquer plusieurs comme lus
await readStateService.markMultipleAsRead(['comm-123', 'comm-456']);

// Vérifier l'état
final isRead = await readStateService.isRead('comm-123');

// Compter les non lus
final unreadCount = await readStateService.countUnread(communicationIds);

// Obtenir les statistiques
final stats = await readStateService.getReadStatistics(communications);
```

---

### 6. 📊 Compteurs et badges de notifications (Flutter)

**Fichiers modifiés** :
- `flutter_app/lib/providers/assembly_dashboard_provider.dart`
- `flutter_app/lib/screens/main_screen.dart`

#### Améliorations :
- **Badge "X nouveaux"** affiché sur chaque tableau avec des communications non lues
- **Compteur rouge** pour le nombre total de communications
- **Intégration** avec le système de lecture pour afficher les compteurs en temps réel

#### Affichage :
```
📢 Communications           [5] [3 nouveaux] →
📄 Documents et lettres     [2]              →
```

---

## 🔄 Flux de synchronisation amélioré

### Du Web vers Flutter :

1. **L'utilisateur crée/modifie des communications** sur le web
2. **Clic sur "Envoyer ce tableau"** ou "Tout envoyer"
3. **Le système envoie** :
   - Les communications groupées par tableau
   - Les métadonnées (boardType, boardLabel, count)
   - Une notification pour informer les utilisateurs
4. **Flutter reçoit** les données via l'API Publisher Sync
5. **Le provider de notifications** détecte les nouvelles communications
6. **Une notification locale** est créée pour chaque tableau concerné
7. **L'utilisateur voit** :
   - Le badge "X nouveaux" sur le dashboard
   - La notification dans la liste
   - Le point bleu sur les communications non lues

### Actions utilisateur Flutter :

1. **Clic sur un tableau** → Ouvre l'écran dédié
2. **Les notifications du tableau** sont automatiquement marquées comme lues
3. **Clic sur une communication** :
   - Ouvre la vue détaillée
   - Marque automatiquement comme lue
   - Affiche les pièces jointes
4. **Appui long** sur une communication :
   - Menu contextuel
   - Marquer/démarquer comme lu
5. **Téléchargement de pièce jointe** :
   - Stockage local
   - Indicateur visuel de téléchargement
   - Ouverture directe

---

## 📦 Nouveaux fichiers créés

### Services :
1. `flutter_app/lib/services/attachment_service.dart` - Gestion des pièces jointes
2. `flutter_app/lib/services/communication_read_state_service.dart` - Gestion des états de lecture

### Providers :
1. `flutter_app/lib/providers/bulletin_notifications_provider.dart` - Système de notifications

### Screens :
1. `flutter_app/lib/screens/bulletin_board_screen.dart` - Écran dédié aux tableaux

---

## 🔧 Configuration requise

### Dépendances Flutter à ajouter dans `pubspec.yaml` :

```yaml
dependencies:
  open_filex: ^4.3.2  # Pour ouvrir les fichiers locaux
  path_provider: ^2.1.1  # Pour accéder aux répertoires de l'app
  path: ^1.8.3  # Pour manipuler les chemins de fichiers
```

### Permissions Android (`android/app/src/main/AndroidManifest.xml`) :

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### Permissions iOS (`ios/Runner/Info.plist`) :

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Accès aux fichiers pour les pièces jointes</string>
```

---

## 🎨 Améliorations visuelles

### Interface Web :
- Deux boutons distincts : "Envoyer ce tableau" (bleu) et "Tout envoyer" (standard)
- Icône d'envoi différente pour chaque bouton
- Feedback visuel pendant l'envoi
- Messages de succès détaillés

### Interface Flutter :
- Point bleu pour les communications non lues
- Badge "X nouveaux" en bleu sur le dashboard
- Couleur de fond grisée pour les communications lues
- Icônes colorées selon le type de communication
- Indicateurs de téléchargement pour les pièces jointes

---

## 🚀 Prochaines étapes suggérées

1. **Téléchargement réel des pièces jointes** depuis une URL serveur
2. **Synchronisation bidirectionnelle** des états de lecture
3. **Notifications push** via Firebase Cloud Messaging
4. **Recherche dans les communications** par mot-clé
5. **Archivage** des communications expirées
6. **Vue calendrier** pour les communications planifiées
7. **Partage** de communications entre utilisateurs
8. **Mode hors-ligne** avec mise en cache avancée

---

## 📝 Notes techniques

### Performance :
- Les compteurs de non lus sont calculés de manière asynchrone
- Les pièces jointes sont chargées à la demande
- Les états de lecture sont mis en cache en mémoire

### Sécurité :
- Les états de lecture sont stockés par utilisateur
- Les pièces jointes sont isolées par tableau
- Les permissions d'accès aux tableaux sont vérifiées côté provider

### Maintenance :
- Nettoyage automatique des états orphelins
- Suppression des pièces jointes par tableau
- Logs de debug détaillés pour le suivi

---

## ✅ Tests recommandés

1. **Envoi d'une communication** vers chaque tableau
2. **Vérification des compteurs** de notifications
3. **Marquage lu/non-lu** et mise à jour des badges
4. **Téléchargement et ouverture** de pièces jointes
5. **Filtrage et tri** des communications
6. **Navigation** entre les tableaux
7. **Gestion des erreurs** réseau
8. **Comportement hors-ligne**

---

## 📞 Support

Pour toute question ou problème, consulter les logs de debug avec les préfixes :
- `🔍` : Informations de chargement
- `✅` : Opérations réussies
- `❌` : Erreurs
- `📎` : Opérations sur les pièces jointes
- `🗑️` : Opérations de nettoyage

---

**Date de mise à jour** : 17 janvier 2026  
**Version** : 2.0
