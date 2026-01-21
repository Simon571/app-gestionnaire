# VÉRIFICATION: Envoi de Rapports Flutter → Web - RÉSUMÉ RAPIDE

## 🔍 Problème Signalé
"Le module Publisher ne reçoit pas les données de Flutter"

## ✅ État RÉEL du Système

### Les données ARRIVENT ✅
```bash
✓ Fichier data/publisher-preaching.json contient 236 lignes
✓ Les rapports sont enregistrés avec userId, month, totals, entries
✓ Exemples: person-1762074610641-0, person-1762074610641-1 (décembre 2025)
```

### Le problème EST... 🤔

Pas un problème d'**arrivée des données**, mais plutôt:

#### 1. **Pas de feedback visuel de l'envoi** ⚠️
- Flutter enregistre localement comme "envoyé" même si le serveur n'a rien reçu
- Pas de confirmation que c'est vraiment arrivé

#### 2. **Configuration API peut être mauvaise** 🔴
- Flutter a une URL hardcodée: `http://192.168.200.152:3000` ou `http://172.17.225.21:3000`
- Si votre serveur n'est pas à cette adresse = **zéro rapport reçu**
- **Solution**: Vérifier `flutter_app/lib/services/storage_service.dart:10`

#### 3. **Pas de retry si erreur réseau** ⚠️
- Si la connexion drop une fois = rapport perdu
- Flutter essaie une seule fois, puis abandonne

#### 4. **Les rapports n'apparaissent pas visibles** 🔴
- Les rapports arrivent dans la BD mais:
  - Pas d'indication "reçu depuis Flutter" vs "saisi manuellement"
  - Pas d'historique des tentatives
  - Pas de timestamp de réception serveur

---

## 🎯 ACTION IMMÉDIATE À FAIRE

### Étape 1: Vérifier la Configuration API

**Sur le serveur web**, vérifier si Flutter peut le joindre:

```bash
# Tester si l'endpoint de santé répond
curl http://YOUR_SERVER:3000/api/health

# Ou vérifier la route activity
curl http://YOUR_SERVER:3000/api/publisher-app/activity
```

### Étape 2: Vérifier l'URL API dans Flutter

**Fichier à modifier:**
- `flutter_app/lib/services/storage_service.dart` (ligne 10)
- `flutter_app/lib/services/sync_service.dart` (ligne 4)

**Vérifier/changer:**
```dart
// ❌ AVANT (peut être mauvaise adresse)
const String _defaultApiBase = String.fromEnvironment('API_BASE', 
    defaultValue: 'http://192.168.200.152:3000');

// ✅ APRÈS (utiliser votre URL réelle)
const String _defaultApiBase = String.fromEnvironment('API_BASE', 
    defaultValue: 'http://YOUR_ACTUAL_SERVER:3000');
```

### Étape 3: Tester un envoi dans les logs

**Sur Flutter** (en mode Debug):
1. Ouvrir l'app
2. Entrer un rapport de prédication
3. Cliquer "Envoyer"
4. Regarder les logs de la console Flutter (sortie stderr):

```
StorageService: Attempting to send report to: http://192.168.200.152:3000
StorageService: Sending POST to http://192.168.200.152:3000/api/publisher-app/activity
StorageService: ✓ preaching report sent for 2025-12   ← ✅ Succès!
OR
StorageService: ✗ preaching report send failed...      ← ❌ Erreur
```

### Étape 4: Vérifier que le rapport est arrivé

**Sur le web**, aller à:
- **Page**: Activité → Prédication → Tab "Proclamateurs"
- **Chercher**: Le rapport du proclamateur avec badge "reçu" (orange)

OU vérifier directement:
```bash
curl http://YOUR_SERVER:3000/api/publisher-app/activity
# Doit retourner les rapports en JSON
```

---

## 🚨 Diagnostic Rapide

### Scénario 1: L'app Flutter n'arrive pas à rejoindre le serveur
**Symptômes:**
- Message "Impossible d'envoyer au serveur"
- `StorageService: ✗ preaching report send error`
- Logs: "Failed to connect to..."

**Cause:** URL API incorrecte ou serveur down  
**Fix:** Vérifier/corriger l'URL API dans storage_service.dart

---

### Scénario 2: L'app Flutter envoie mais rien n'arrive
**Symptômes:**
- Pas de message d'erreur (confus!)
- Les logs ne montrent rien
- Rapport n'apparaît pas sur le web

**Cause:** 
- API key/authentification invalide
- Serveur rejette la requête silencieusement

**Fix:**
```dart
// Ajouter dans storage_service.dart
if (kDebugMode) {
  print('StorageService: Response status: ${resp.statusCode}');
  print('StorageService: Response body: ${resp.body}');
}
```

---

### Scénario 3: Les rapports arrivent parfois seulement
**Symptômes:**
- Envoyer 5 rapports
- 2-3 arrivent, 2-3 n'arrivent pas
- Connexion réseau instable

**Cause:** Pas de retry en cas d'erreur réseau  
**Fix:** Implémenter retry automatique avec backoff exponentiel

---

## 📊 État de la Chaîne d'Envoi

```
┌─────────────────────────────────────────────────────────────┐
│ FLUTTER: Vous envoyez un rapport                            │
├──────────────────────────────┬──────────────────────────────┤
│ ✅ Enregistrement local      │ Rapports sauvés en mémoire    │
│ ✅ Sérialisation JSON        │ Format correct, champs bon    │
│ ⚠️ Validation API URL        │ URL peut être incorrecte!     │
│ ⚠️ Authentification PIN      │ PIN doit être valide          │
└──────────────────────────────┴──────────────────────────────┘
         ↓ [POST /api/publisher-app/activity]
┌─────────────────────────────────────────────────────────────┐
│ SERVEUR WEB: Reçoit et traite                               │
├──────────────────────────────┬──────────────────────────────┤
│ ✅ Accepte POST              │ Endpoint configuré            │
│ ✅ Authentifie PIN           │ Valide ou rejette            │
│ ✅ Enregistre en BD          │ publisher-preaching.json     │
│ ✅ Crée job incoming         │ Pour badge "reçu"           │
└──────────────────────────────┴──────────────────────────────┘
         ↓ [GET /api/publisher-app/activity]
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD WEB: Affiche les rapports                         │
├──────────────────────────────┬──────────────────────────────┤
│ ✅ Requête GET OK            │ Retourne tous les rapports   │
│ ✅ Parsage JSON              │ Format correct               │
│ ✅ Affichage badge "reçu"    │ Orange sur l'interface       │
│ ⚠️ Pas de traçabilité        │ Pas de "source" du rapport   │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 📍 Points d'Investigation

### Essayer ces commandes:

```bash
# 1. Vérifier que le serveur répond
curl -v http://YOUR_SERVER:3000/api/publisher-app/activity

# Réponse attendue:
# HTTP/1.1 200 OK
# {"reports":[...]}

# 2. Tester l'envoi manuellement
curl -X POST http://YOUR_SERVER:3000/api/publisher-app/activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "month": "2025-12",
    "pin": "1234",
    "didPreach": true,
    "totals": {"hours": 5, "bibleStudies": 1, "credit": 0},
    "entries": {}
  }'

# Réponse attendue:
# {"ok": true, "report": {...}}
# OU
# {"error": "..."}  ← Explique le problème
```

---

## ✅ Conclusion

**Le système MARCHE techniquement** mais manque de:
- ✋ Configuration correcte de l'URL API Flutter
- 🔄 Retry automatique en cas d'erreur
- 👁️ Feedback visuel clair à l'utilisateur
- 📋 Traçabilité des envois (logs, timestamps)

**Prochaine étape**: Vérifier que `http://192.168.200.152:3000` est la bonne URL, sinon la changer!
