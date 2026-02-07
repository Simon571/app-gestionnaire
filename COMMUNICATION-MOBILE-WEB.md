# 🔄 Communication Mobile ↔️ Web : Guide Complet

## 📊 Vue d'Ensemble

```
┌─────────────────────────┐         INTERNET         ┌──────────────────────────┐
│                         │                          │                          │
│   📱 App Mobile         │◄───────────────────────►│   🌐 Vercel (Web)        │
│   (Flutter)             │     API REST/HTTPS       │   (Next.js)              │
│                         │                          │                          │
│  • Envoie rapports      │                          │  • Reçoit rapports      │
│  • Reçoit données       │                          │  • Envoie données       │
│  • Synchronisation      │                          │  • Base de données      │
│                         │                          │                          │
└─────────────────────────┘                          └──────────────────────────┘
```

---

## 🔀 Flux de Communication

### 1️⃣ Envoi de Rapport (Mobile → Web)

```
┌──────────────┐
│ Proclamateur │
│  utilise     │
│   l'app      │
└──────┬───────┘
       │
       │ 1. Remplit rapport mensuel
       ▼
┌──────────────────────┐
│  App Mobile          │
│  ├─ Saisie données   │
│  ├─ Validation       │
│  └─ Ajout PIN        │
└──────┬───────────────┘
       │
       │ 2. POST /api/publisher-app/activity
       │    Body: { userId, month, totals, pin }
       ▼
┌──────────────────────┐
│  Vercel API          │
│  ├─ Auth PIN ✓       │
│  ├─ Sauvegarde DB    │
│  └─ Sync fichiers    │
└──────┬───────────────┘
       │
       │ 3. Réponse { success: true }
       ▼
┌──────────────────────┐
│  App Mobile          │
│  "✅ Rapport envoyé" │
└──────────────────────┘
```

#### Configuration Requise

**Sur l'App Mobile :**
- ✅ URL configurée : `https://app-gestionnaire.vercel.app`
- ✅ Utilisateur connecté avec son PIN
- ✅ Connexion internet active

**Authentification (3 méthodes):**

1. **PIN Utilisateur** (simple - recommandé) :
   ```json
   {
     "userId": "user-123",
     "pin": "1234",
     "month": "2026-02",
     "totals": { "hours": 10 }
   }
   ```

2. **Admin Override** (ancien/assistant envoie pour quelqu'un) :
   ```json
   {
     "userId": "user-456",
     "month": "2026-02",
     "adminOverride": {
       "actorId": "elder-001",
       "actorPin": "5678"
     }
   }
   ```

3. **Device Auth** (synchronisation automatique) :
   ```
   Headers:
   X-Device-Id: mobile-main
   X-Api-Key: [clé sécurisée]
   X-Timestamp: 1706745600
   X-Signature: [HMAC-SHA256]
   ```

---

### 2️⃣ Réception de Données (Web → Mobile)

```
┌──────────────┐
│ Surveillant  │
│  met à jour  │
│   programme  │
└──────┬───────┘
       │
       │ 1. Modifie programme VCM
       ▼
┌──────────────────────┐
│  Interface Web       │
│  ├─ Édition données  │
│  ├─ Sauvegarde       │
│  └─ Sync auto ✓      │
└──────┬───────────────┘
       │
       │ 2. POST /api/publisher-app/send
       │    { type: 'programme_week', payload: {...} }
       ▼
┌──────────────────────┐
│  Queue de Sync       │
│  ├─ Job créé         │
│  ├─ Status: pending  │
│  └─ Direction:       │
│     desktop_to_mobile│
└──────┬───────────────┘
       │
       │ 3. App mobile interroge périodiquement
       │    GET /api/publisher-app/updates
       ▼
┌──────────────────────┐
│  App Mobile          │
│  ├─ Récupère jobs    │
│  ├─ Traite données   │
│  └─ ACK réception    │
└──────────────────────┘
```

#### Types de Données Synchronisées

| Type | Direction | Description |
|------|-----------|-------------|
| `programme_week` | 🖥️→📱 | Programme VCM hebdomadaire |
| `programme_weekend` | 🖥️→📱 | Programme réunion publique |
| `predication` | 🖥️→📱 | Programme prédication |
| `services` | 🖥️→📱 | Attributions services |
| `communications` | 🖥️→📱 | Annonces tableau |
| `territories` | 🖥️→📱 | Territoires disponibles |
| `rapports` | 📱→🖥️ | Rapports d'activité |
| `assistance` | 📱→🖥️ | Assistance aux réunions |
| `user_data` | 🖥️→📱 | Données proclamateurs |

---

## 🔐 Sécurité

### Chiffrement

Toutes les communications utilisent **HTTPS** (TLS 1.3) :
- ✅ Données chiffrées en transit
- ✅ Certificat SSL Vercel automatique
- ✅ Protection contre interception

### Authentification

```
┌──────────────────────────────────────────┐
│  Niveaux de Sécurité                     │
├──────────────────────────────────────────┤
│                                          │
│  1. PIN Utilisateur (4-6 chiffres)      │
│     → Validé côté serveur                │
│     → Hashé en SHA256                    │
│                                          │
│  2. Device Authentication (optionnel)   │
│     → API Key (256 bits)                 │
│     → HMAC-SHA256 signature              │
│     → Timestamp anti-replay              │
│                                          │
│  3. Admin Override                       │
│     → Réservé anciens/assistants        │
│     → Validation fonction spirituelle   │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🛠️ Configuration Technique

### URLs et Endpoints

**Production (Vercel) :**
```
Base URL: https://app-gestionnaire.vercel.app

Endpoints:
  POST   /api/publisher-app/activity          (Rapports)
  GET    /api/publisher-app/updates           (Récupérer données)
  POST   /api/publisher-app/send              (Envoyer données)
  POST   /api/publisher-app/incoming          (Messages mobile)
  POST   /api/publisher-app/ack               (Confirmer réception)
  GET    /api/publisher-app/queue             (File d'attente)
```

**Développement Local :**
```
Base URL: http://192.168.x.x:3000

⚠️ Remplacer x.x par votre IP locale
⚠️ Même réseau Wi-Fi requis
```

### Configuration App Mobile

**Fichier : `lib/services/storage_service.dart`**
```dart
const String _defaultApiBase = String.fromEnvironment(
  'API_BASE', 
  defaultValue: 'http://192.168.169.152:3000'
);
```

**Pour Vercel, configurer via l'interface :**
1. Menu → Paramètres serveur
2. Entrer : `https://app-gestionnaire.vercel.app`
3. Sauvegarder

---

## 🔄 Synchronisation Automatique

### Polling (App Mobile)

L'app mobile vérifie régulièrement les nouvelles données :

```dart
Timer.periodic(Duration(minutes: 15), (timer) async {
  await syncService.fetchUpdates();
});
```

**Fréquence :**
- ⏱️ Toutes les **15 minutes** en arrière-plan
- 🔄 À chaque ouverture de l'app
- 📱 Notification si nouvelles données

### Push (Web → Queue)

Quand le web crée/modifie des données :

```typescript
await publisherSyncFetch('/api/publisher-app/send', {
  type: 'programme_week',
  payload: { /* données */ }
});
```

**Process :**
1. Données sauvegardées dans la queue
2. Status `pending`
3. App mobile récupère lors du prochain poll
4. Status passe à `processed`

---

## 🐛 Dépannage Communication

### Problème : Rapports ne s'envoient pas

**Diagnostic :**
```
📱 App Mobile Logs:
❌ StorageService: Attempting to send report to: http://192.168.169.152:3000
❌ SocketException: Failed host lookup
```

**Solution :**
1. Vérifier URL configurée (doit être Vercel)
2. Test connexion internet
3. Vérifier PIN utilisateur

### Problème : Données du web n'arrivent pas sur mobile

**Diagnostic :**
```
🖥️ Web : Données synchronisées ✓
📱 Mobile : Aucune nouvelle donnée
```

**Solutions :**
1. **Forcer synchronisation manuelle** :
   - Ouvrir l'app
   - Tirer vers le bas (pull-to-refresh)
   - Ou : Paramètres → Synchronisation → "Sync Now"

2. **Vérifier la queue web** :
   - Aller sur : https://app-gestionnaire.vercel.app/publisher-app
   - Menu "Receive Data"
   - Vérifier que jobs existent avec status `pending`

3. **Logs côté serveur** :
   - Vérifier sur Vercel Dashboard → Logs
   - Chercher erreurs API

### Problème : "Auth required"

**Cause :** PIN manquant ou incorrect

**Solution :**
1. Se déconnecter de l'app mobile
2. Se reconnecter avec le bon PIN
3. Réessayer

---

## 📊 Monitoring

### Côté Web (Vercel)

**Dashboard Publisher-App :**
```
https://app-gestionnaire.vercel.app/publisher-app

Sections :
  • Send Data : Envoyer manuellement des données
  • Receive Data : Voir rapports reçus
  • Queue : File d'attente synchronisation
  • Notifications : Alertes système
```

**Vercel Logs :**
```
https://vercel.com/[votre-projet]/logs

Rechercher :
  📩 "Activity POST received"     (rapport reçu)
  🔑 "Auth: PIN validated"        (auth OK)
  ✅ "Rapport synchronisé"        (succès)
  ❌ "Invalid user or PIN"        (erreur)
```

### Côté Mobile

**Debug Mode (Flutter) :**
```dart
if (kDebugMode) {
  print('📤 Sending report to: $apiBase');
  print('✅ Report sent successfully');
}
```

**Logs Système :**
```
flutter logs

ou

adb logcat | grep "StorageService"
```

---

## ✅ Checklist de Fonctionnement

### Configuration Initiale

- [ ] URL Vercel configurée dans l'app mobile
- [ ] Test connexion réussi
- [ ] Utilisateur connecté avec PIN
- [ ] Rapport test envoyé avec succès

### Communication Mobile → Web

- [ ] Rapport envoyé depuis mobile
- [ ] Message "✅ Rapport envoyé" affiché
- [ ] Rapport visible sur dashboard web
- [ ] Données synchronisées dans `publisher-users.json`

### Communication Web → Mobile

- [ ] Modification de données sur web
- [ ] Job créé dans queue de sync
- [ ] App mobile récupère les données (< 15 min)
- [ ] Données visibles dans l'app mobile

---

## 🚀 Optimisations Futures

### Notifications Push (en développement)

- Firebase Cloud Messaging (FCM)
- Notifications instantanées
- Pas besoin de polling

### Synchronisation Offline

- Mise en cache locale
- Queue de rapports en attente
- Retry automatique au retour connexion

### WebSockets (temps réel)

- Communication bidirectionnelle instantanée
- Mise à jour en temps réel
- Remplacement du polling

---

## 📞 Support

**En cas de problème persistant :**

1. **Vérifier :** [GUIDE-CONFIG-MOBILE-VERCEL.md](./GUIDE-CONFIG-MOBILE-VERCEL.md)
2. **Logs :** Activer mode debug et noter erreurs exactes
3. **Contact :** Administrateur système avec :
   - Message d'erreur exact
   - Captures d'écran
   - Configuration actuelle (URL, Version app)

---

## 📚 Documentation Technique Complète

- **Architecture :** [ARCHITECTURE-MULTI-NIVEAUX.md](./ARCHITECTURE-MULTI-NIVEAUX.md)
- **API Sync :** [docs/publisher-sync-plan.md](./docs/publisher-sync-plan.md)
- **Flutter App :** [flutter_app/API_INTEGRATION.md](./flutter_app/API_INTEGRATION.md)
- **Config Réseau :** [flutter_app/CONFIG-API-RESEAU.md](./flutter_app/CONFIG-API-RESEAU.md)
