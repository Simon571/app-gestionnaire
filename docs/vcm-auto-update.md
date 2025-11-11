# Mise à jour automatique du Cahier Vie et Ministère

## Vue d'ensemble

Le système récupère automatiquement les données du cahier Vie et Ministère depuis le site jw.org et les affiche dans l'application.

## Processus de mise à jour

### 1. Scraping des données
```powershell
npm run scrape-vcm -- --lang=fr
```
Récupère les données brutes depuis jw.org.

### 2. Normalisation
```powershell
npm run normalize-vcm -- --lang=fr
```
Convertit les données en format structuré avec dates, sections, thèmes et durées.

### 3. Validation
```powershell
npm run validate-vcm -- --lang=fr
```

### 4. Import (optionnel)
```powershell
npm run import-vcm -- --lang=fr
```

## Commande unique

```powershell
.\scripts\update-vcm.ps1 -Lang fr
```

Avec import:
```powershell
.\scripts\update-vcm.ps1 -Lang fr -Import
```

## Fichiers générés

1. **export/vcm-program.json** - Données brutes
2. **export/vcm-program.normalized.json** - Données normalisées
3. **public/vcm/fr/vcm-program.normalized.json** - Pour le frontend
4. **public/vcm-program.json** - Attributions (studentId, assistantId)

## Structure des données

```json
{
  "weeks": [
    {
      "weekTitle": "27 octobre – 2 novembre",
      "startDate": "2025-10-27",
      "endDate": "2025-11-02",
      "sections": [
        {
          "key": "ministere",
          "title": "Applique-toi au ministère",
          "items": [
            {
              "type": "demonstration",
              "theme": "Engage la conversation",
              "duration": 3
            }
          ]
        }
      ]
    }
  ]
}
```

## Affichage dans l'interface

L'interface charge automatiquement:
- Les thèmes réels du cahier VCM pour la semaine
- Les attributions (élève, interlocuteur)
- Bouton 📄 pour voir les participations

## Mise à jour automatique

Tâche planifiée Windows (tous les lundis à 8h):

```powershell
$action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument '-File "C:\Users\Public\Documents\app-gestionnaire\scripts\update-vcm.ps1" -Lang fr'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 8am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "UpdateVCM"
```

## État actuel

✅ Scraping fonctionnel
✅ Normalisation avec dates
✅ Affichage des thèmes
✅ Participation (bouton 📄)
⚠️ Items vides actuellement (scraping récupère les sommaires, pas le détail)

## Dépannage

**Scraping échoue**: Vérifier Internet et `npx playwright install`
**Dates incorrectes**: Vérifier `scripts/verify-dates.js`
**Thèmes vides**: Relancer le scraping
