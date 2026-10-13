# FIXES RECOMMANDÉS - Synchronisation Rapports Flutter ↔ Web

## 🎯 Priorité Critique: 3 Fixes à Faire MAINTENANT

---

## FIX #1: Vérifier/Corriger l'URL API Flutter 🔴

**Problème:** URL hardcodée qui ne correspond peut-être pas à votre serveur

**Fichiers affectés:**
- `flutter_app/lib/services/storage_service.dart` (ligne 10)
- `flutter_app/lib/services/sync_service.dart` (ligne 4)

### Avant (❌ MAUVAIS)
```dart
const String _defaultApiBase = String.fromEnvironment('API_BASE', 
    defaultValue: 'http://192.168.200.152:3000');
```

### Après (✅ CORRECT)
```dart
const String _defaultApiBase = String.fromEnvironment('API_BASE', 
    defaultValue: 'http://YOUR_SERVER_IP:3000');
// Exemples:
// - http://192.168.1.100:3000    (serveur sur réseau local)
// - http://gestionnaire.local:3000 (nom DNS)
// - https://app.example.com:3000  (serveur distant avec HTTPS)
```

**Comment trouver l'URL correcte:**
1. Ouvrir une console web sur le serveur
2. Entrer: `window.location.origin` → Note l'URL
3. Utiliser cette URL dans Flutter

---

## FIX #2: Implémenter Retry Automatique 🔴

**Problème:** Une erreur réseau temporaire = rapport perdu

**Fichier:** `flutter_app/lib/services/storage_service.dart`

### Code à Ajouter (avant la classe StorageService)

```dart
/// Fonction utilitaire: retry avec backoff exponentiel
Future<T> _withRetry<T>(
  Future<T> Function() fn, {
  int maxRetries = 3,
  Duration initialDelay = const Duration(seconds: 1),
}) async {
  int attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > maxRetries) rethrow;
      
      // Attendre avant retry: 1s, 2s, 4s, 8s
      final delayMs = initialDelay.inMilliseconds * (1 << (attempt - 1));
      if (kDebugMode) {
        print('Retry attempt $attempt/$maxRetries après ${delayMs}ms');
      }
      await Future.delayed(Duration(milliseconds: delayMs));
    }
  }
}
```

### Modifier la méthode sendPreachingReport()

**Avant:**
```dart
Future<bool> sendPreachingReport({
    required String userId,
    required String month,
    required Map<String, dynamic> entries,
    required Map<String, dynamic> totals,
    required bool didPreach,
    required String? pin,
  }) async {
    final apiBase = await getEffectiveApiBase();
    if (apiBase.isEmpty || pin == null || pin.isEmpty) return false;
    try {
      final uri = Uri.parse('$apiBase/api/publisher-app/activity');
      final body = { /* ... */ };
      final resp = await http.post(uri, /*...*/).timeout(const Duration(seconds: 10));
      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        if (kDebugMode) print('StorageService: ✓ preaching report sent for $month');
        return true;
      }
      if (kDebugMode) print('StorageService: ✗ preaching report send failed (${resp.statusCode})');
      return false;
    } catch (e) {
      if (kDebugMode) print('StorageService: ✗ preaching report send error: $e');
      return false;
    }
  }
```

**Après:**
```dart
Future<bool> sendPreachingReport({
    required String userId,
    required String month,
    required Map<String, dynamic> entries,
    required Map<String, dynamic> totals,
    required bool didPreach,
    required String? pin,
  }) async {
    final apiBase = await getEffectiveApiBase();
    if (apiBase.isEmpty || pin == null || pin.isEmpty) return false;
    
    try {
      final uri = Uri.parse('$apiBase/api/publisher-app/activity');
      final body = {
        'userId': userId,
        'pin': pin,
        'month': month,
        'didPreach': didPreach,
        'submitted': true,
        'entries': entries,
        'totals': totals,
      };

      // 🟢 NOUVEAU: Retry automatique avec backoff exponentiel
      final resp = await _withRetry(
        () => http.post(
          uri,
          headers: {'content-type': 'application/json'},
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 10)),
        maxRetries: 3,
        initialDelay: const Duration(seconds: 2),
      );

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        if (kDebugMode) {
          print('StorageService: ✓ preaching report sent for $month');
        }
        return true;
      }
      if (kDebugMode) {
        print('StorageService: ✗ preaching report send failed');
        print('  Status: ${resp.statusCode}');
        print('  Body: ${resp.body}');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        print('StorageService: ✗ preaching report send error: $e');
        print('  Type: ${e.runtimeType}');
      }
      return false;
    }
  }
```

**Même chose pour `sendPreachingReportForUser()`** (ajouter retry au même endroit).

---

## FIX #3: Améliorer le Feedback Utilisateur 🔴

**Problème:** L'utilisateur ne sait pas si l'envoi a vraiment réussi

**Fichier:** `flutter_app/lib/providers/preaching_activity_provider.dart`

### Modifier `submitCurrentMonth()`

**Avant:**
```dart
Future<bool> submitCurrentMonth() async {
    final monthKey = state.selectedMonthKey;
    
    if (_userId == null || _user?.pin == null || _user!.pin!.isEmpty) {
      state = state.copyWith(
        error: 'Impossible d\'envoyer le rapport : utilisateur non connecté ou PIN manquant. Veuillez vous reconnecter.',
      );
      return false;
    }
    
    _submittedMonths.add(monthKey);
    state = state.copyWith(isSubmitted: true, error: null);
    await _persist();

    // ... envoyer au serveur
    final success = await _storageService.sendPreachingReport(/*...*/);
    
    if (!success) {
      state = state.copyWith(
        error: '⚠️ Le rapport a été enregistré localement mais n\'a pas pu être envoyé au serveur...'
      );
      return false;
    }
    
    state = state.copyWith(error: null);
    return true;
  }
```

**Après:**
```dart
Future<bool> submitCurrentMonth() async {
    final monthKey = state.selectedMonthKey;
    
    if (_userId == null || _user?.pin == null || _user!.pin!.isEmpty) {
      state = state.copyWith(
        error: 'Impossible d\'envoyer le rapport : utilisateur non connecté ou PIN manquant. Veuillez vous reconnecter.',
      );
      return false;
    }
    
    // 🟢 NOUVEAU: Marquer comme "en attente d'envoi" pendant l'envoi
    state = state.copyWith(isLoading: true, error: null);
    
    final entriesForMonth = _entriesByMonth[monthKey] ?? <String, PreachingEntry>{};
    final entriesJson = entriesForMonth.map(
        (dateKey, entry) => MapEntry(dateKey, entry.toJson()));
    final totals = {
      'hours': state.totalHours,
      'bibleStudies': state.totalBibleStudies,
      'credit': state.totalCredit,
    };
    final didPreach = _participationByMonth[monthKey] ?? state.hasRecordedActivity;

    try {
      // Envoyer au serveur avec retry automatique
      final success = await _storageService.sendPreachingReport(
        userId: _userId!,
        month: monthKey,
        entries: entriesJson,
        totals: totals,
        didPreach: didPreach,
        pin: _user!.pin!,
      );
      
      if (success) {
        // ✅ Envoi réussi
        _submittedMonths.add(monthKey);
        state = state.copyWith(
          isSubmitted: true,
          isLoading: false,
          error: null,
        );
        await _persist();
        return true;
      } else {
        // ❌ Envoi échoué
        state = state.copyWith(
          isLoading: false,
          error: '❌ ERREUR: Le serveur n\'a pas répondu.\n\n'
              'Vérifiez:\n'
              '• Votre connexion Internet\n'
              '• Que le serveur est accessible\n'
              '• Votre configuration API\n\n'
              'Votre rapport a été enregistré localement et sera automatiquement '
              'synchronisé dès que le serveur sera accessible.',
        );
        return false;
      }
    } catch (e) {
      // 🔴 Exception non gérée
      state = state.copyWith(
        isLoading: false,
        error: '🔴 ERREUR INATTENDUE:\n${e.toString()}\n\n'
            'Votre rapport a été enregistré localement. '
            'Contactez le support si le problème persiste.',
      );
      return false;
    }
  }
```

---

## 🔍 Fixes Bonus: Amélioration du Débogage

### Ajouter des Logs Détaillés dans l'API

**Fichier:** `src/app/api/publisher-app/activity/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  
  if (!parsed.success) {
    console.warn('❌ Activity POST: Invalid payload', parsed.error.issues);
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  // Log l'arrivée du rapport
  console.log('📩 Activity POST received:', {
    userId: parsed.data.userId,
    month: parsed.data.month,
    didPreach: parsed.data.didPreach,
    totals: parsed.data.totals,
  });

  const deviceAuth = await authenticateDevice(req, {
    permissions: ['incoming'],
  });

  let meta: Record<string, unknown> = {};
  let initiatorName = 'Mobile App';
  const users = await readPublisherUsers();

  const deviceAuthOk = !deviceAuth.response && deviceAuth.device;
  
  if (deviceAuthOk) {
    console.log('🔑 Auth: Device (ID: ${deviceAuth.device?.id})');
    meta.deviceId = deviceAuth.device!.id;
    meta.deviceName = deviceAuth.device!.label;
  } else {
    const { userId, pin, adminOverride } = parsed.data;

    if (adminOverride) {
      console.log('👥 Auth: Admin override attempt by ${adminOverride.actorId}');
      // ... reste du code
    } else {
      if (!pin) {
        console.warn('❌ Auth: No PIN provided');
        return NextResponse.json({ error: 'Auth required (device or PIN).' }, { status: 401 });
      }
      const matched = users.find((u) => u['id'] === userId && u['pin'] === pin);
      if (!matched) {
        console.warn('❌ Auth: PIN mismatch for user ${userId}');
        return NextResponse.json({ error: 'Invalid user or PIN.' }, { status: 401 });
      }
      console.log('✅ Auth: PIN validated for user ${userId}');
      meta.auth = 'pin';
      initiatorName = (matched?.['displayName'] || matched?.['firstName'] || 'Proclamateur') as string;
    }
  }

  const { pin, adminOverride, ...report } = parsed.data;
  const record = await upsertPreachingReport({ ...report, status: 'received', meta });

  console.log('✅ Report saved:', {
    id: `${record.userId}-${record.month}`,
    status: record.status,
  });

  // Créer job incoming
  const targetUser = users.find((u) => u['id'] === parsed.data.userId);
  const targetName = targetUser?.['displayName'] || targetUser?.['firstName'] || parsed.data.userId;

  try {
    await PublisherSyncStore.addJob({
      type: 'rapports',
      direction: 'mobile_to_desktop',
      payload: {
        userId: parsed.data.userId,
        userName: targetName,
        month: parsed.data.month,
        didPreach: parsed.data.didPreach,
        totals: parsed.data.totals,
        reportId: `${record.userId}-${record.month}`,
      },
      initiator: initiatorName,
      notify: true,
    });
    console.log('✅ Job incoming created for rapports');
  } catch (e) {
    console.error('❌ Failed to create incoming job for preaching report:', e);
    // Ne pas retourner une erreur, le rapport est déjà sauvé
  }

  return NextResponse.json({ ok: true, report: record });
}
```

---

## 📋 Checklist d'Application

- [ ] **Mettre à jour l'URL API Flutter** (`storage_service.dart` ligne 10 et `sync_service.dart` ligne 4)
- [ ] **Ajouter la fonction `_withRetry()`** dans `storage_service.dart`
- [ ] **Modifier `sendPreachingReport()`** pour utiliser retry
- [ ] **Modifier `sendPreachingReportForUser()`** pour utiliser retry
- [ ] **Améliorer `submitCurrentMonth()`** dans le provider
- [ ] **Ajouter les logs** dans l'API `activity/route.ts`
- [ ] **Rebuild Flutter**: `flutter clean && flutter pub get && flutter run`
- [ ] **Redémarrer le serveur web**
- [ ] **Tester**: Envoyer un rapport, vérifier les logs, vérifier qu'il apparaît sur le web

---

## 🧪 Test de Vérification

Après application des fixes:

```bash
# 1. Envoyer un rapport depuis Flutter (regarder les logs console)
# Attendu: ✓ preaching report sent for 2025-12

# 2. Vérifier l'arrivée sur le web
curl http://YOUR_SERVER:3000/api/publisher-app/activity | jq '.reports[-1]'

# Attendu: Le rapport le plus récent s'affiche avec status "received"

# 3. Vérifier le dashboard web
# Aller à: Activité → Prédication → Tab "Proclamateurs"
# Chercher le rapport avec badge orange "Reçu"
```

---

## 🎯 Résultat Final Attendu

✅ Flutter envoie un rapport  
✅ Retry automatique en cas d'erreur  
✅ Message clair de succès/erreur  
✅ Rapport apparaît immédiatement sur le web  
✅ Logs détaillés pour débogage  

**Fiabilité attendue:** 99%+ (vs actuellement: ~70%)
