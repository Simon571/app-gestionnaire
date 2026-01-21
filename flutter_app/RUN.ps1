# Script PowerShell pour lancer l'application Flutter
# Usage: powershell -ExecutionPolicy Bypass -File RUN.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Application Flutter Mobile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ajouter Flutter au PATH
$env:Path = "C:\flutter\bin;$env:Path"

# Vérifier que Flutter est installé
Write-Host "Vérification de Flutter..." -ForegroundColor Yellow
flutter --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Flutter n'est pas installé!" -ForegroundColor Red
    Write-Host "Veuillez installer Flutter d'abord." -ForegroundColor Red
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

Write-Host ""
Write-Host "Localisation: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 1. Nettoyer
Write-Host "1️⃣  Nettoyage..." -ForegroundColor Yellow
flutter clean
if ($LASTEXITCODE -ne 0) { goto error }

Write-Host ""
# 2. Installer les dépendances
Write-Host "2️⃣  Installation des dépendances..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) { goto error }

Write-Host ""
# 3. Lancer l'app
Write-Host "3️⃣  Lancement de l'application..." -ForegroundColor Yellow
flutter run
if ($LASTEXITCODE -ne 0) { goto error }

Write-Host ""
Write-Host "✅ SUCCESS! Application lancée!" -ForegroundColor Green
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"
exit 0

:error
Write-Host ""
Write-Host "❌ ERREUR lors de l'exécution!" -ForegroundColor Red
Write-Host ""
Read-Host "Appuyez sur Entrée pour quitter"
exit 1
