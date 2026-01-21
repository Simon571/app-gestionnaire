# Publisher App → Flutter: payload mapping & display expectations

This document lists all Publisher App job types and describes how the Flutter app consumes / displays each payload. It also states what the server will write to `flutter_app/assets/data` for developer convenience and what UI behavior we expect on mobile (phone-only users).

## Goals
- Clear mapping between `PUBLISHER_SYNC_TYPES` and Flutter asset filenames
- Confirm the payload shape Flutter expects
- Make mobile UX friendly and automatic (no code/terminal operations needed on phone)

---

## Type → Asset mapping (server writes to /flutter_app/assets/data)
- `programme_week` → `programme_week.json`
  - Format written by server: { "weeks": [ { weekStart, weekEnd, weekLabel, meetingType, assignments, songs, participants, hall, updatedAt } ] }
  - Flutter loader (`vcm_assignments_provider`) prefers `assets/data/programme_week.json` or SharedPreferences key `sync_programme_week`.
    - Behaviour on the device: when an incoming `programme_week` job is processed by the Flutter SyncService it will now save the single-week payload under a per-week key (for debugging) and also merge it into the canonical `programme_week` shared key (i.e. `sync_programme_week`) as an array entry. This ensures the UI providers (which read `programme_week.json` or `sync_programme_week`) will discover newly published weekly programmes immediately.
  - Display: weekly assignments and participants in Programmes tab; VCM pages parse `weeks` and display them.

- `programme_weekend` → `programme_weekend.json`
  - Format: { "weeks": [ ... ] } or single-week payload. Used by weekend meeting pages.

- `services` → `services.json`
  - Format: payload from the web UI (roles, rolePersonCounts, serviceData, generatedAt)
  - Display: Services page and Services tab on mobile should show assignments for the selected week.

- `communications` → `communications.json`
  - Server writes: { updatedAt, items: [ ... ] } for consistent mobile consumption.
  - Display: Bulletin/communications carousel and home page announcements.

- `temoignage_public` → `temoignage_public.json`
  - Format: array/object consistent with web UI payload. Mobile displays public witness content on Public Witness page.

- `predication` → `predication.json`
  - Format: payload describing preaching meetings/assignments.
  - Display: Predication/meeting-related screens.

- `assistance`, `rapports`, `taches`, `emergency_contacts`, `territories` → `<type>.json`
  - Behavior: server writes the `payload` object as JSON to the respective asset file. Flutter's sync worker writes this payload into local SharedPreferences during processing and UI will query `getGenericData(key)`.

---

## Flutter-side expectations & UX improvements
- Automatic sync: the app already performs periodic sync and a manual "Sync" action. We added a short, user-friendly SnackBar when new jobs are processed so phone-only users see that new data arrived.
- Local assets: server now writes files into `flutter_app/assets/data/<type>.json` on `publisher-app/send`. This helps device/desktop developers and ensures mobile can load fresh data during local testing.
- Consistent payload shapes: writers aim to keep the payload shape identical to what Flutter `SyncService` expects, avoiding extra nesting/wrapper objects (exceptions: `programme_week` and `communications` where special merging or array semantics are required).

## Authentification et signature HMAC 🔐

Le protocole de synchronisation utilise des en-têtes HMAC pour l'authentification des appareils : `X-Device-Id`, `X-Api-Key`, `X-Timestamp`, `X-Signature`.

- Le serveur vérifie d'abord que la `X-Api-Key` correspond au hash SHA256 stocké (on compare SHA256(apiKey) au `apiKeyHash` du device).
- La signature attendue par le serveur est calculée ainsi :
  - secret = SHA256(apiKey) (hex string)
  - payload = "METHOD\n/PATH[?query]\nTIMESTAMP"
  - signature = HMAC-SHA256(payload, secret)

Cette logique est maintenant appliquée par le client Flutter (`SyncService`) afin d'éviter l'erreur 403 "Signature invalide" lors des appels à `/api/publisher-app/updates` et `/api/publisher-app/ack`.

---

## Next recommended improvements (follow-ups)
- Add E2E tests covering full flow: web save → publisher job created → Flutter `SyncService` fetches & processes → visible UI update.
- Validate every page's `getPayload()` in the web UI to verify shapes match mobile expectations (small audit/cleanup for each Programme/Module if necessary).
- Add a mobile visual cue on target pages (e.g., a green "Mise à jour" tag that briefly appears) after sync to make the new/changed section explicit.
- Add server-side feature toggle to enable/disable writing to `flutter_app/assets` (useful for production where writing build files is not desired).

If you want, I can proceed to:
- Guarantee payload shapes for each `getPayload()` call in the web codebase and update any mismatches,
- Add the feature toggle for file writes, and
- Add an E2E test harness to exercise the full flow locally.

---

Last changed: Automatically generated by the integration work (server + mobile) — author: automation.
