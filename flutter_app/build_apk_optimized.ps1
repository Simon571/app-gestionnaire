#!/usr/bin/env pwsh
# Build optimized APK Script

Set-Location -Path "C:\Users\Public\Documents\app-gestionnaire\flutter_app"
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Build APK Optimisé - Flutter" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Pubspec Exists: $(Test-Path pubspec.yaml)" -ForegroundColor Yellow
Write-Host ""

# Nettoyage avant build
Write-Host "🧹 Nettoyage des fichiers de build précédents..." -ForegroundColor Magenta
flutter clean
Write-Host "✓ Nettoyage terminé" -ForegroundColor Green
Write-Host ""

# Récupération des dépendances
Write-Host "📦 Récupération des dépendances..." -ForegroundColor Magenta
flutter pub get
Write-Host "✓ Dépendances récupérées" -ForegroundColor Green
Write-Host ""

# Build APK optimisé
Write-Host "🏗️  Construction de l'APK optimisé..." -ForegroundColor Magenta
Write-Host "   - Minification activée" -ForegroundColor Gray
Write-Host "   - Shrink resources activé" -ForegroundColor Gray
Write-Host "   - Obfuscation activée" -ForegroundColor Gray
Write-Host "   - Tree-shaking des icônes activé" -ForegroundColor Gray
Write-Host ""

# Build avec optimisations maximales
flutter build apk --release `
    --obfuscate `
    --split-debug-info=build/debug-info `
    --target-platform android-arm,android-arm64,android-x64 `
    --split-per-abi

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  ✅ Build terminé avec succès!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📱 APK générés:" -ForegroundColor Cyan
Write-Host ""

$apkDir = "build\app\outputs\flutter-apk"
if (Test-Path $apkDir) {
    Get-ChildItem $apkDir -Filter "*.apk" | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   ✓ $($_.Name)" -ForegroundColor Yellow
        Write-Host "     Taille: $sizeMB MB" -ForegroundColor Gray
        Write-Host "     Chemin: $($_.FullName)" -ForegroundColor Gray
        Write-Host ""
    }
}

# Copier les APK vers la racine du projet
Write-Host "📋 Copie des APK vers la racine du projet..." -ForegroundColor Magenta
$destDir = "C:\Users\Public\Documents\app-gestionnaire"
Get-ChildItem $apkDir -Filter "*.apk" | ForEach-Object {
    $destPath = Join-Path $destDir "gestionnaire-$($_.Name)"
    Copy-Item $_.FullName -Destination $destPath -Force
    Write-Host "   ✓ Copié: $destPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Tous les fichiers sont prêts!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Conseil: Les APK *-arm64-v8a.apk sont pour les téléphones modernes (64-bit)" -ForegroundColor Yellow
Write-Host "💡 Conseil: Les APK *-armeabi-v7a.apk sont pour les anciens téléphones (32-bit)" -ForegroundColor Yellow
Write-Host ""
