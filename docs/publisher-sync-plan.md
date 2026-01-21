# Publisher App Sync Plan

## Objectives
- Garantir la synchronisation bidirectionnelle entre App-Gestionnaire (desktop) et l'application mobile.
- Supporter les types de données suivants :
  - Programme semaine (VCM) et réunions du week-end.
  - Réunions pour la prédication et Témoignage public.
  - Répartitions de tâches / services.
  - Rapports de service, assistance.
  - Communications diverses.
  - Échanges depuis les éditeurs (rapports, assistance) vers les administrateurs.

## Architecture proposée
1. **API REST** (`/api/publisher-app/*`) : routes Next.js sécurisées avec token ou session admin.
2. **Base locale** : tables dédiées pour tracer les jobs de synchro et stocker les payloads JSON (SQLite chiffré + migration JSON → DB).
3. **Mode hybride** :
   - **Push** (desktop -> mobile) lorsqu'un admin déclenche un envoi.
   - **Pull** (mobile -> desktop) via polling périodique ou en réponse à une notification push.

## Tables (à ajouter via Prisma)
### `publisher_sync_jobs`
| Champ | Type | Description |
| --- | --- | --- |
| id | string (cuid) | identifiant du job |
| type | enum | `programme_week`, `programme_weekend`, `predication`, `temoignage_public`, `services`, `rapport`, `assistance`, `communications`, etc. |
| direction | enum | `desktop_to_mobile` / `mobile_to_desktop` |
| payload | JSONB | données complètes à synchroniser |
| status | enum | `pending`, `sent`, `processed`, `failed` |
| initiator | string | user/admin ayant déclenché |
| deviceTarget | string? | identifiant appareil si ciblé |
| createdAt / updatedAt | DateTime |

### `publisher_sync_notifications`
Historique des notifications push/email.

### `publisher_devices`
Référence des appareils mobiles (token FCM, version app, utilisateur).

## API Endpoints
| Méthode & Route | Description |
| --- | --- |
| `GET /api/publisher-app/queue` | Liste des jobs en attente (filtres par type, status). Alimente l’onglet « Envoyer ». |
| `POST /api/publisher-app/send` | Crée un job `desktop_to_mobile` avec payload fourni (programme, tâches, etc.). Option `notify`. |
| `GET /api/publisher-app/updates` | Consommé par le mobile : renvoie tous les jobs `desktop_to_mobile` mis à jour depuis `since`. |
| `POST /api/publisher-app/ack` | Le mobile confirme réception d’un job. |
| `GET /api/publisher-app/incoming` | Liste des jobs `mobile_to_desktop` en attente de traitement. Alimente l’onglet « Recevoir ». |
| `POST /api/publisher-app/import` | L’admin accepte une donnée remontée (rapports, assistance). Met à jour les tables finales + job `processed`. |

## DTO / Payload
Chaque `type` aura un schéma JSON versionné.

Exemple `programme_weekend` :
```json
{
  "weekStart": "2025-12-01",
  "discourse": {
    "title": "-",
    "speaker": "",
    "congregation": ""
  },
  "assignments": { ... },
  "services": [...],
  "zoom": { "id": "", "password": "", "url": "" }
}
```

Exemple `rapport` (mobile -> desktop) :
```json
{
  "personId": "abc123",
  "month": "2025-11",
  "hours": 15,
  "placements": 10,
  "bibleStudies": 2,
  "submittedAt": "2025-12-01T18:30:00Z"
}
```

## Étapes de mise en œuvre
1. Initialiser la base SQLite (`data/publisher-sync/state.db`) et migrer l’ancien `state.json`.
2. Créer/mettre à jour les route handlers Next.js :
   - `src/app/api/publisher-app/send/route.ts`
   - `.../queue/route.ts`
   - `.../updates/route.ts`
   - `.../ack/route.ts`
   - `.../incoming/route.ts`
   - `.../import/route.ts`
3. Refactorer les pages React `send-data` et `receive-data` pour consommer ces endpoints (SWR ou React Query).
4. Côté Flutter, ajouter un `PublisherSyncService` qui :
   - Stocke `lastSync` (SharedPreferences).
   - Appelle `GET /updates` pour charger les données pertinentes et les mappe vers les modèles.
   - Envoie des rapports/assistances via `POST /send` (type `rapport`/`assistance`).
5. Ajouter une couche d’authentification pour les endpoints (token par appareil, vérifié côté API via `devices.json`).

## Configuration actuelle

- **Persistance** : `better-sqlite3` + tables `publisher_sync_jobs` / `publisher_sync_notifications`, migration automatique depuis `state.json`.
- **Auth par appareil** : fichier `data/publisher-sync/devices.json` contenant `id`, `role`, `permissions`, `apiKeyHash`.
- **CLI** : `npm run sync:keys` (`list`, `generate`, `revoke`) pour gérer les clés.
- **Variables d’environnement** (UI desktop) :
  ```
  NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_ID=desktop-admin
  NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_KEY=<clé claire distribuée>
  ```
- **Signature HMAC** : chaque requête porte `X-Device-Id`, `X-Api-Key`, `X-Timestamp`, `X-Signature`.

## Sécurité & Observabilité
- Générer un token unique par appareil (`publisher_devices`).
- Journaliser toutes les opérations (table `publisher_sync_logs`).
- Ajouter des statuts détaillés (`errorMessage`, `retryCount`).

Ce document servira de référence pour les implémentations successives.
