@echo off
REM Ce script exécute la chaîne complète de scraping, normalisation et importation des données VCM.

echo [VCM-Batch] Etape 1/3: Lancement du scraping...
npm run scrape-vcm
if %errorlevel% neq 0 (
    echo [VCM-Batch] Erreur lors du scraping. Arrêt du script.
    exit /b %errorlevel%
)

echo [VCM-Batch] Etape 2/3: Lancement de la normalisation...
npm run normalize-vcm
if %errorlevel% neq 0 (
    echo [VCM-Batch] Erreur lors de la normalisation. Arrêt du script.
    exit /b %errorlevel%
)

echo [VCM-Batch] Etape 3/3: Lancement de l'importation...
npm run import-vcm
if %errorlevel% neq 0 (
    echo [VCM-Batch] Erreur lors de l'importation. Arrêt du script.
    exit /b %errorlevel%
)

echo [VCM-Batch] Processus terminé avec succès.
