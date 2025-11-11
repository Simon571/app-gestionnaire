# Mise à jour automatique du cahier VCM (FR/EN)

Ce guide explique comment récupérer, normaliser et valider les données du cahier Vie et Ministère (VCM) pour les langues Français et Anglais, et comment planifier l'exécution mensuelle sous Windows.

## Prérequis
- Node.js 18+
- Playwright installé (devDependency déjà présent). Si nécessaire, installez les navigateurs: `npx playwright install --with-deps`
- Droits pour créer des tâches planifiées sous Windows

## Structure des scripts
- `scripts/scrape-vcm.ts` — Scrap le sommaire JW.ORG et les pages hebdomadaires (paramètre `--lang=fr|en`).
- `scripts/normalize-vcm.ts` — Normalise le JSON brut en `public/vcm/<lang>/vcm-program.normalized.json` (et copie legacy FR).
- `scripts/validate-vcm.ts` — Valide le schéma JSON (Zod) par langue.
- `scripts/verify-dates.js` — Affiche un résumé des dates détectées.
- `scripts/import-vcm.ts` — (Optionnel) Envoie les données vers une API interne. Utilise `VCM_API_URL` et `VCM_IMPORT_SECRET`.
- `scripts/update-vcm.ps1` — Orchestrateur PowerShell.

## Scripts npm
- `npm run vcm:update:fr` — FR: scrape → normalize → verify → validate
- `npm run vcm:update:en` — EN: scrape → normalize → verify → validate
- `npm run vcm:update:all` — FR puis EN

Validation seule:
- `npm run vcm:validate:fr`
- `npm run vcm:validate:en`

## Utilisation manuelle
Exécuter en PowerShell (Windows):

```powershell
# Français
./scripts/update-vcm.ps1 -Lang fr

# Anglais
./scripts/update-vcm.ps1 -Lang en

# Inclure l'import API (nécessite .env avec VCM_API_URL et VCM_IMPORT_SECRET)
./scripts/update-vcm.ps1 -Lang fr -Import
```

## Planification Windows (Task Scheduler)
1. Ouvrir Planificateur de tâches.
2. Créer une tâche de base → nom: "VCM Update".
3. Déclencheur: Mensuel (sélectionner le jour souhaité après parution).
4. Action: Démarrer un programme.
   - Programme/script: `powershell.exe`
   - Ajouter des arguments:
     `-ExecutionPolicy Bypass -NoProfile -File "C:\\Users\\Public\\Documents\\app-gestionnaire\\scripts\\update-vcm.ps1" -Lang fr`
   - Démarrer dans: `C:\\Users\\Public\\Documents\\app-gestionnaire`
5. Cocher "Exécuter avec les autorisations maximales" si nécessaire.

Astuce: planifier deux actions pour FR et EN, ou utiliser `npm run vcm:update:all` via `cmd.exe /c`.

## Journaux et dépannage
- Les sorties sont visibles dans la console Task Scheduler. Pour garder des logs:
  - Modifier la tâche pour rediriger la sortie: `...update-vcm.ps1 -Lang fr *> C:\\Temp\\vcm-fr.log`
- Si Playwright échoue:
  - Réinstaller les navigateurs: `npx playwright install`
  - Vérifier la connexion internet et les proxies.
- Si le parsing change:
  - Ajuster les regex dans `normalize-vcm.ts` (sections, dates, durées, cantiques).

## Sécurité et robustesse (TODO)
- Backoff et retries (déjà en partie dans le scraper).
- Détection de changements DOM (tests smoke mensuels).
- Validation stricte (Zod) — en place.
- Limites de débit et délais entre pages.

## Intégration app
- L'app lit d'abord `public/vcm/<lang>/vcm-program.normalized.json` selon la locale, sinon revient sur `public/vcm/vcm-program.normalized.json` (FR legacy).
