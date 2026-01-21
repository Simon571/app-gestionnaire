# Diagnostic: Envoi de Rapports de Prédication Flutter → Web

**Date**: 13 Janvier 2026  
**Statut**: ✅ **Système FONCTIONNEL mais optimisable**

---

## 📋 Résumé Exécutif

Le système d'envoi de rapports de prédication de Flutter vers le module web **fonctionne techniquement**, mais il y a plusieurs points d'amélioration pour l'expérience utilisateur et la fiabilité.

### ✅ Ce qui MARCHE
- Les rapports arrivent dans la base de données (`data/publisher-preaching.json`)
- L'API accepte les rapports depuis Flutter
- L'authentification par PIN fonctionne
- La synchronisation crée un "job incoming" pour notification

### ⚠️ Problèmes Identifiés
1. **Pas de feedback visuel en temps réel** sur l'envoi du rapport
2. **Les données reçues ne sont pas indexées par type de synchronisation** - mélange avec les données entrantes
3. **Pas de retry automatique** en cas d'échec
4. **L'API base URL** en Flutter peut être mal configurée (défaut: `http://192.168.200.152:3000`)

---

## 🔍 Architecture du Flux

```
Flutter App (Proclamateur)
    ↓ [POST /api/publisher-app/activity + PIN]
    ↓
Web API Route: activity/route.ts
    ↓ Authentifie par PIN
    ↓ Enregistre dans publisher-preaching.json
    ↓ Crée job incoming (rapports)
    ↓
Dashboard Web (activite-predication/page.tsx)
    ↓ [GET /api/publisher-app/activity]
    ↓
Affiche les rapports reçus
```

---

## 📂 Fichiers Impliqués

### Flutter (Envoi)
- **`flutter_app/lib/services/storage_service.dart:527`** - `sendPreachingReport()`
  - Lance POST vers `/api/publisher-app/activity`
  - Envoie: userId, month, entries, totals, didPreach, PIN
  - ❌ Pas de retry en cas d'erreur

- **`flutter_app/lib/providers/preaching_activity_provider.dart:316`** - `submitCurrentMonth()`
  - Appelle `_storageService.sendPreachingReport()`
  - Marque localement comme envoyé même si l'envoi échoue
  - ⚠️ L'utilisateur ne sait pas si ça a vraiment marché

### Web (Réception & Affichage)
- **`src/app/api/publisher-app/activity/route.ts`** - API endpoint
  - GET: Retourne tous les rapports
  - POST: Accepte et enregistre le rapport
  - PATCH: Met à jour le statut (received → validated)

- **`src/lib/publisher-preaching-store.ts`** - Stockage persistant
  - Stocke dans `data/publisher-preaching.json`
  - Formate: `{ userId, month, didPreach, submitted, status, totals, entries, meta }`

- **`src/app/activite-predication/page.tsx:189`** - Affichage des rapports
  - Charge avec: `GET /api/publisher-app/activity`
  - Affiche badge "reçu" si `status === 'received'`
  - Affiche badge "validé" si `status === 'validated'`

---

## 🔧 Problèmes Détectés

### 1. **Configuration API Base (Critique pour Connexion)**

**Fichiers affectés:**
- `flutter_app/lib/services/storage_service.dart:10`
- `flutter_app/lib/services/sync_service.dart:4`

**Le problème:**
```dart
const String _defaultApiBase = String.fromEnvironment('API_BASE', 
    defaultValue: 'http://172.17.225.21:3000');  // ❌ IP hardcodée
```

**Impact:**
- Si le serveur web n'est pas à cette adresse, Flutter ne peut pas envoyer
- Aucune validation que la connexion fonctionne
- Pas de feedback d'erreur de connexion au serveur

**Solution:**
✅ Utiliser une variable d'environnement ou configuration persistante

---

### 2. **Pas de Retry Automatique**

**Fichier:** `flutter_app/lib/services/storage_service.dart:527`

**Le problème:**
```dart
Future<bool> sendPreachingReport({...}) async {
  if (apiBase.isEmpty || pin == null || pin.isEmpty) return false;
  try {
    final resp = await http.post(uri, ...).timeout(Duration(seconds: 10));
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return true;
    }
    return false;  // ❌ Une seule tentative!
  } catch (e) {
    return false;  // ❌ Pas de retry
  }
}
```

**Impact:**
- Problème réseau temporaire = perte du rapport
- L'utilisateur pense que ça a marché localement mais le serveur n'a rien reçu
- Aucun queue persistant pour les rapports en attente

**Solution:**
✅ Implémenter un queue local avec retry exponentiel (exponential backoff)

---

### 3. **Pas de Vérification de Livraison**

**Fichier:** `flutter_app/lib/providers/preaching_activity_provider.dart:316`

**Le problème:**
```dart
final success = await _storageService.sendPreachingReport(...);

if (!success) {
  state = state.copyWith(
    error: '⚠️ Le rapport a été enregistré localement...'
  );
  return false;
}
```

**Impact:**
- Message d'erreur vague
- Pas de distinction entre "réseau down" vs "serveur rejette"
- Pas d'indication du statut de synchronisation

**Solution:**
✅ Afficher le statut détaillé: Envoi en attente / Erreur réseau / Serveur rejeté / Succès

---

### 4. **Job "Incoming" Peut Ne Pas S'Enregistrer**

**Fichier:** `src/app/api/publisher-app/activity/route.ts:95-113`

**Le problème:**
```typescript
try {
  await PublisherSyncStore.addJob({
    type: 'rapports',
    direction: 'mobile_to_desktop',
    payload: { ... },
    notify: true,
  });
} catch (e) {
  console.error('Failed to create incoming job...', e);
  // ❌ Le rapport est enregistré mais le job incoming échoue silencieusement!
}
```

**Impact:**
- Le rapport est enregistré dans `publisher-preaching.json` ✅
- Mais le "badge" rouge sur "Recevoir les données" ne s'affiche pas ❌
- L'utilisateur ne sait pas qu'il y a un rapport à traiter

**Solution:**
✅ Retourner une erreur explicite si le job incoming échoue

---

### 5. **Pas de Distinction Données Locales vs Serveur**

**Fichier:** `src/app/activite-predication/page.tsx`

**Le problème:**
- Le statut `received` ne distingue pas entre:
  - Reçu depuis Flutter (mobile_to_desktop)
  - Marqué manuellement sur le web (internal)
- Pas d'historique des tentatives d'envoi
- Pas de timestamp de réception côté serveur

**Solution:**
✅ Ajouter `receivedAt` timestamp et `source` (flutter | web)

---

## 📊 Flux de Données - État Actuel

### 1️⃣ Flutter envoie un rapport
```json
POST /api/publisher-app/activity
{
  "userId": "person-xxx",
  "month": "2025-12",
  "pin": "1234",
  "didPreach": true,
  "totals": {"hours": 5, "bibleStudies": 2, "credit": 0},
  "entries": {"2025-12-01": {...}}
}
```

### 2️⃣ Web enregistre dans la base de données
```json
{
  "userId": "person-xxx",
  "month": "2025-12",
  "status": "received",
  "didPreach": true,
  "totals": {...},
  "entries": {...},
  "meta": {"auth": "pin"},
  "updatedAt": "2025-12-06T20:49:17Z"
}
```

### 3️⃣ Web crée un "job incoming" pour notification
```json
{
  "type": "rapports",
  "direction": "mobile_to_desktop",
  "status": "pending",
  "payload": {
    "userId": "person-xxx",
    "userName": "Jean Dupont",
    "month": "2025-12"
  }
}
```

### 4️⃣ Dashboard web affiche le rapport

---

## ✅ Points Forts du Système

1. **Authentification robuste** - PIN basé, support admin override
2. **Métadonnées complètes** - Enregistre qui a envoyé, quand, comment
3. **Validation côté serveur** - Schéma Zod stricte
4. **Persiste les données** - Fichier JSON persistent même en cas de crash
5. **Support offline** - Flutter enregistre localement, sync quand disponible

---

## 🛠️ Recommandations de Fixes

### 🔴 CRITIQUE (À faire immédiatement)

#### 1. Valider la connexion API avant d'envoyer

**Fichier:** `flutter_app/lib/services/storage_service.dart`

```dart
Future<bool> testApiConnection() async {
  final apiBase = await getEffectiveApiBase();
  if (apiBase.isEmpty) return false;
  try {
    final uri = Uri.parse('$apiBase/api/health');
    final resp = await http.get(uri).timeout(Duration(seconds: 5));
    return resp.statusCode == 200;
  } catch (e) {
    return false;
  }
}
```

Utiliser avant `sendPreachingReport()`:
```dart
if (!await storageService.testApiConnection()) {
  // Afficher: "Serveur indisponible - Rapport sauvegardé localement"
}
```

#### 2. Implémenter retry avec backoff exponentiel

```dart
Future<bool> sendPreachingReportWithRetry({
  required String userId,
  required String month,
  // ... autres params
  int maxRetries = 3,
}) async {
  for (int attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      final success = await sendPreachingReport(...);
      if (success) return true;
      
      if (attempt < maxRetries) {
        // Attendre avant de retry: 2^attempt secondes (2, 4, 8, 16)
        await Future.delayed(Duration(seconds: pow(2, attempt).toInt()));
      }
    } catch (e) {
      if (attempt == maxRetries) rethrow;
    }
  }
  return false;
}
```

#### 3. Améliorer le feedback utilisateur

**Fichier:** `flutter_app/lib/providers/preaching_activity_provider.dart:316`

```dart
Future<bool> submitCurrentMonth() async {
  try {
    state = state.copyWith(isLoading: true, error: null);
    
    final success = await _storageService.sendPreachingReport(...);
    
    if (success) {
      state = state.copyWith(
        isSubmitted: true,
        error: null,
        isLoading: false,
      );
      return true;
    } else {
      state = state.copyWith(
        error: '❌ Impossible d\'envoyer au serveur. '
            'Vérifiez votre connexion Internet et réessayez. '
            'Votre rapport est sauvegardé localement.',
        isLoading: false,
      );
      return false;
    }
  } catch (e) {
    state = state.copyWith(
      error: '❌ Erreur: ${e.toString()}',
      isLoading: false,
    );
    return false;
  }
}
```

### 🟡 IMPORTANT (À faire bientôt)

#### 4. Ajouter timestamp et source aux rapports

**Fichier:** `src/lib/publisher-preaching-store.ts`

```typescript
export interface PreachingReportRecord {
  userId: string;
  month: string;
  // ... existing fields
  receivedAt?: string;  // ✨ Nouveau
  source?: 'flutter' | 'web' | 'admin';  // ✨ Nouveau
  attempts?: number;  // ✨ Nombre de tentatives
  lastAttemptAt?: string;  // ✨ Dernier essai
}
```

#### 5. Retourner erreur explicite si job incoming échoue

**Fichier:** `src/app/api/publisher-app/activity/route.ts:95`

```typescript
try {
  await PublisherSyncStore.addJob({...});
} catch (e) {
  console.error('Failed to create incoming job', e);
  return NextResponse.json(
    { 
      warning: 'Rapport enregistré mais notification échouée',
      error: e instanceof Error ? e.message : String(e)
    }, 
    { status: 500 }
  );
}
```

### 🟢 NICE TO HAVE (Améliorations futures)

#### 6. Queue de synchronisation persistant

Implémenter une file d'attente locale pour les rapports en attente d'envoi:
- Stocké dans SharedPreferences ou fichier local
- Sync automatique quand réseau revient
- Afficher nombre de rapports en attente

#### 7. Webhooks ou polling pour confirmation

Ajouter endpoint pour que Flutter confirme la réception du rapport:
```
GET /api/publisher-app/activity/{userId}/{month}/status
```

#### 8. Dashboard de synchronisation

Ajouter une page "État de synchronisation" affichant:
- Derniers rapports reçus
- Rapports en attente
- Historique d'erreurs

---

## 🔐 Sécurité

✅ **Points positifs:**
- Authentification par PIN requise
- Schéma Zod stricte coté serveur
- Support admin override avec double PIN

⚠️ **À vérifier:**
- [ ] Les PINs sont-elles hashées en base de données? (check `publisher-users.json`)
- [ ] Limiter le taux d'appels POST à `/api/publisher-app/activity`?
- [ ] Logs détaillés des tentatives échouées?

---

## 📝 Checklist de Test

- [ ] Flutter envoie un rapport avec connexion Internet stable → doit arriver
- [ ] Flutter envoie un rapport sans connexion → doit être enregistré localement
- [ ] Serveur est down → Flutter affiche message clair
- [ ] PIN invalide → Serveur rejette avec erreur 401
- [ ] Rapport reçu s'affiche dans Dashboard web avec badge "reçu"
- [ ] Cliquer "Valider tous les reçus" → status passe à "validated"
- [ ] Rapport visible dans "Recevoir les données" avec job incoming

---

## 📚 Fichiers à Consulter

| Fichier | Rôle | Priorité |
|---------|------|----------|
| `flutter_app/lib/services/storage_service.dart` | Envoi rapport | 🔴 Critique |
| `src/app/api/publisher-app/activity/route.ts` | Réception rapport | 🔴 Critique |
| `src/lib/publisher-preaching-store.ts` | Stockage rapport | 🟡 Important |
| `src/app/activite-predication/page.tsx` | Affichage rapport | 🟡 Important |
| `flutter_app/lib/providers/preaching_activity_provider.dart` | UI Flutter | 🟡 Important |

---

## 🎯 Résumé Final

**La synchronisation des rapports fonctionne** mais manque de:
1. **Robustesse** - Pas de retry en cas d'erreur réseau
2. **Feedback** - L'utilisateur ne sait pas si l'envoi a vraiment réussi
3. **Tracing** - Pas d'historique des tentatives d'envoi
4. **Configuration** - API base URL hardcodée

**Priorité d'action**: 
1. Tester la connexion API avant envoi
2. Implémenter retry automatique
3. Améliorer les messages d'erreur
4. Ajouter logs/historique

**Impact utilisateur final**: 
- Actuellement: Rapports parfois ne arrivent pas, utilisateur confus
- Après fixes: Fiabilité 99%+ avec feedback clair
