# Script de publication d'une nouvelle version APK
# Usage: .\scripts\publish-apk.ps1 -Version "1.0.1" -Notes "Corrections de bugs"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = "Mise à jour"
)

Write-Host "🚀 Publication de la version $Version" -ForegroundColor Cyan
Write-Host ""

# 1. Mettre à jour les fichiers de version
Write-Host "📝 Étape 1: Mise à jour des fichiers de version..." -ForegroundColor Yellow
node scripts/update-apk-version.js $Version $Notes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la mise à jour de version" -ForegroundColor Red
    exit 1
}

# 2. Compiler l'APK
Write-Host ""
Write-Host "🔨 Étape 2: Compilation de l'APK..." -ForegroundColor Yellow
Push-Location flutter_app
flutter build apk --release
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "❌ Erreur lors de la compilation" -ForegroundColor Red
    exit 1
}

# 3. Créer le dossier downloads s'il n'existe pas
Write-Host ""
Write-Host "📂 Étape 3: Préparation du dossier de téléchargement..." -ForegroundColor Yellow
if (!(Test-Path "public\downloads")) {
    New-Item -ItemType Directory -Path "public\downloads" | Out-Null
}

# 4. Copier l'APK
Write-Host ""
Write-Host "📦 Étape 4: Copie de l'APK..." -ForegroundColor Yellow
Copy-Item "flutter_app\build\app\outputs\flutter-apk\app-release.apk" "public\downloads\app-release.apk" -Force

# 5. Vérifier la taille de l'APK
$apkSize = (Get-Item "public\downloads\app-release.apk").Length / 1MB
Write-Host ""
Write-Host "✅ APK compilé avec succès!" -ForegroundColor Green
Write-Host "   Version: $Version" -ForegroundColor Cyan
Write-Host "   Taille: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
Write-Host "   Emplacement: public\downloads\app-release.apk" -ForegroundColor Cyan

# 6. Instructions finales
Write-Host ""
Write-Host "📤 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Tester l'APK sur un appareil Android" -ForegroundColor White
Write-Host "   2. Déployer les fichiers sur votre serveur:" -ForegroundColor White
Write-Host "      - public/app/version.json" -ForegroundColor Gray
Write-Host "      - public/downloads/app-release.apk" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Commande de déploiement (exemple):" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Release v$Version'" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Gray
