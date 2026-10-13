# 🔄 FLUX COMPLET: Envoi de Rapports Flutter → Web Publisher

## Vue d'Ensemble Visuelle

```
┌──────────────────────────────────────────────────────────────────┐
│                      FLUTTER APP (Mobile)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Utilisateur saisit un rapport:                                   │
│  • Date: 31 décembre 2025                                         │
│  • Heures: 5                                                      │
│  • Cours bibliques: 2                                             │
│                                                                    │
│  [ENVOYER] button clicked                                         │
│                                                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ submitCurrentMonth()
                   │ ├─ Valide le PIN (user.pin)
                   │ ├─ Récupère les données du mois
                   │ └─ Appelle sendPreachingReport()
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  StorageService.sendPreachingReport()                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1️⃣ Construit le payload:                                         │
│  {                                                                 │
│    "userId": "person-xxx",                                        │
│    "month": "2025-12",                                            │
│    "pin": "1234",              ← ⚠️ Critère d'auth                │
│    "didPreach": true,                                             │
│    "totals": {                                                     │
│      "hours": 5,                                                  │
│      "bibleStudies": 2,                                           │
│      "credit": 0                                                  │
│    },                                                              │
│    "entries": {                                                    │
│      "2025-12-31": {                                              │
│        "hours": 5,                                                │
│        "bibleStudies": 2,                                         │
│        "credit": 0                                                │
│      }                                                             │
│    }                                                               │
│  }                                                                 │
│                                                                    │
│  2️⃣ Récupère l'API base:                                          │
│  URL = await getEffectiveApiBase()                                │
│  ❌ PROBLÈME: Peut être:                                          │
│     • http://192.168.200.152:3000   (défaut)                     │
│     • http://172.17.225.21:3000     (autre défaut)               │
│     • Aucune des deux = FAIL!                                     │
│                                                                    │
│  3️⃣ Lance POST:                                                   │
│  POST http://API_BASE/api/publisher-app/activity                 │
│  ❌ PROBLÈME: Pas de retry si erreur!                            │
│                                                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ HTTP POST
                   │ (internet!)
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                   WEB SERVER (Node.js/Next.js)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  API Route: POST /api/publisher-app/activity                      │
│  (src/app/api/publisher-app/activity/route.ts)                   │
│                                                                    │
│  1️⃣ Valide le payload Zod:                                        │
│  ✓ userId (string)                                               │
│  ✓ pin (string) — pour authentication                            │
│  ✓ month (YYYY-MM format)                                        │
│  ✓ totals, entries, didPreach                                    │
│                                                                    │
│  2️⃣ Authentifie l'utilisateur:                                    │
│  const matched = users.find(u =>                                 │
│    u.id === userId && u.pin === pin                              │
│  )                                                                 │
│  ❓ Si PIN incorrecte → HTTP 401                                  │
│                                                                    │
│  3️⃣ Enregistre le rapport:                                        │
│  await upsertPreachingReport({                                    │
│    ...report,                                                     │
│    status: 'received',   ← Badge orange dans le web               │
│    meta: { auth: 'pin', deviceId: ..., ... }                     │
│  })                                                                │
│  ✓ Écrit dans data/publisher-preaching.json                      │
│                                                                    │
│  4️⃣ Crée un \"job incoming\" pour notification:                   │
│  await PublisherSyncStore.addJob({                                │
│    type: 'rapports',                                              │
│    direction: 'mobile_to_desktop',                                │
│    payload: { userId, month, didPreach, totals, ... },          │
│  })                                                                │
│  ✓ Badge rouge \"Recevoir les données\" s'active                  │
│                                                                    │
│  5️⃣ Retourne:                                                     │
│  HTTP 200                                                          │
│  {                                                                 │
│    \"ok\": true,                                                   │
│    \"report\": { userId, month, status, ... }                    │
│  }                                                                 │
│                                                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   │ HTTP Response
                   │ 
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              FLUTTER: Reçoit la réponse                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  if (resp.statusCode >= 200 && resp.statusCode < 300) {          │
│    ✅ Succès!                                                     │
│    markMonthAsSubmitted(monthKey)                                 │
│    state.isSubmitted = true                                       │
│    return true                                                    │
│  } else {                                                          │
│    ❌ Erreur (pas de retry!)                                      │
│    state.error = \"⚠️ Impossible d'envoyer...\"                   │
│    return false                                                   │
│  }                                                                 │
│                                                                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                 DASHBOARD WEB (Browser)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Page: Activité → Prédication → Tab \"Proclamateurs\"            │
│                                                                    │
│  GET /api/publisher-app/activity   ← Récupère les rapports       │
│                                                                    │
│  Affiche le tableau:                                              │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Nom      │ Statut  │ Heures │ Cours │ Crédit │ Reçu   │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │ Jean D.  │ Actif   │ 5      │ 2     │ 0      │ ✅ Reçu │  ← Reçu depuis Flutter\n│  │ Marie C. │ Actif   │ 3      │ 1     │ 0      │ ❌ Non  │     │
│  │ Pierre M.│ Inactif │ 0      │ 0     │ 0      │ ❌ Non  │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                    │
│  La ligne avec \"✅ Reçu\" provient du rapport Flutter!           │
│                                                                    │
│  Admin peut:                                                       │
│  • Cliquer badge \"Reçu\" → Valide le rapport (status=validated) │
│  • Envoyer à la filiale → Status \"sent\"                         │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Stockage Persistant

```
data/
├── publisher-preaching.json
│   └── {
│       "reports": [
│         {
│           "userId": "person-xxx",
│           "month": "2025-12",
│           "didPreach": true,
│           "submitted": true,
│           "status": "received",    ← REÇU DEPUIS FLUTTER
│           "totals": {
│             "hours": 5,
│             "bibleStudies": 2,
│             "credit": 0
│           },
│           "entries": {
│             "2025-12-31": {
│               "hours": 5,
│               "bibleStudies": 2,
│               "credit": 0
│             }
│           },
│           "meta": {
│             "auth": "pin"
│           },
│           "updatedAt": "2025-12-31T10:30:00Z"
│         }
│       ]
│     }
│
└── publisher-preaching-submissions.json
    └── {
        "submissions": [
          {
            "month": "2025-12",
            "sentAt": "2025-12-31T15:00:00Z",
            "lateUserIds": []  ← Utilisateurs en retard
          }
        ]
      }
```

---

## 🔍 Problèmes et Points de Rupture

### ❌ Point de Rupture #1: URL API Incorrecte
```
Flutter:  http://192.168.200.152:3000
Serveur:  http://192.168.1.100:3000
                      ↑ MISMATCH
Résultat: Zéro rapport reçu
```

**Diagnostic:** 
```bash
curl http://192.168.200.152:3000/api/publisher-app/activity
# curl: (7) Failed to connect to 192.168.200.152 port 3000
```

### ❌ Point de Rupture #2: Pas de Retry
```
Flutter envoie 1x
  ├─ Succès → OK
  └─ Erreur réseau (timeout, drop, etc)
       └─ Abandonne → Rapport perdu!
```

**Solution:** Retry automatique avec exponential backoff

### ❌ Point de Rupture #3: Pas de Feedback
```
Utilisateur Flutter:
  ├─ Envoie le rapport
  ├─ Attend 5 secondes...
  ├─ Rien ne se passe
  └─ \"Ça a marché ou pas? Aucune idée! 😕\"

Rapport est peut-être:
  • En transit
  • Rejeté (PIN incorrect)
  • Jamais arrivé (URL mauvaise)
  • Perdu sur le réseau
```

**Solution:** Afficher statut clair:
- 🟡 En attente d'envoi
- 🔄 Envoi en cours...
- ✅ Rapport envoyé avec succès
- ❌ Erreur: [raison spécifique]

---

## ✅ Happy Path (Idéal)

```
1️⃣ Utilisateur Flutter saisit rapport
   ↓
2️⃣ Clique \"Envoyer\"
   ↓
3️⃣ Flutter: \"En attente d'envoi...\" (loading)
   ↓
4️⃣ POST vers http://GOOD_URL:3000/api/publisher-app/activity
   ↓
5️⃣ Serveur valide PIN et enregistre
   ↓
6️⃣ Flutter: ✅ \"Rapport envoyé avec succès!\"
   ↓
7️⃣ Admin web: Voir le rapport dans le tableau avec badge \"Reçu\"
   ↓
8️⃣ Admin clique \"Valider\" → status = \"validated\"
   ↓
9️⃣ Admin clique \"Envoyer à la filiale\" → status = \"sent\"
   ↓
🔟 Filiale reçoit le rapport dans leur système
```

---

## ⚠️ Unhappy Path (Actuel)

```
1️⃣ Utilisateur Flutter saisit rapport
   ↓
2️⃣ Clique \"Envoyer\"
   ↓
3️⃣ Flutter envoie une fois (pas loading)
   ↓
4️⃣ POST vers http://192.168.200.152:3000 ❌ WRONG URL
   ↓
5️⃣ Timeout après 10s
   ↓
6️⃣ Flutter: \"⚠️ Rapport enregistré localement mais pas d'envoi au serveur\"
   ↓
7️⃣ Admin web: Rien ne s'affiche dans le tableau
   ↓
8️⃣ Admin pense: \"Les données n'arrivent pas de Flutter!\"
   ↓
9️⃣ Rapport est perdu (ou restera local sur le téléphone)
```

---

## 🔧 Points d'Intervention

### Pour Corriger le Problème

1. **Configuration (15 min)**
   - Changer l'URL API dans Flutter
   - Rebuild l'app
   - Test

2. **Robustesse (1-2h)**
   - Ajouter retry automatique
   - Améliorer les messages d'erreur
   - Tester avec réseau instable

3. **Observabilité (1-2h)**
   - Ajouter logs serveur détaillés
   - Ajouter timestamps et source
   - Dashboard de synchronisation

---

## 🎯 Résumé

| Étape | Composant | État | Problème |
|-------|-----------|------|----------|
| 1 | Saisie utilisateur | ✅ OK | Aucun |
| 2 | Sérialisation JSON | ✅ OK | Aucun |
| 3 | URL API | ❌ FAIL | Hardcodée |
| 4 | Envoi HTTP | ⚠️ ONCE | Pas de retry |
| 5 | Auth PIN | ✅ OK | Aucun |
| 6 | Stockage BD | ✅ OK | Aucun |
| 7 | Notification | ✅ OK | Pas de feedback |
| 8 | Affichage web | ✅ OK | Aucun |
| 9 | Sync filiale | ✅ OK | Aucun |

**Total:** 1 problème critique + 2 problèmes importants = Solution simple à mettre en œuvre
