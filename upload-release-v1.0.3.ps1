#!/usr/bin/env pwsh
# Script d'upload des builds vers GitHub Releases v1.0.3
# Utilise l'outil GitHub CLI (gh)

$ErrorActionPreference = "Stop"

$releaseTag = "v1.0.3"
$releaseTitle = "Version 1.0.3 - Synchronisation automatique"
$repo = "Simon571/app-gestionnaire"

# Chemins des fichiers
$msiPath = "C:\Users\Public\Documents\app-gestionnaire\src-tauri\target\release\bundle\msi\Gestionnaire d'Assemblée_1.0.3_x64_en-US.msi"
$apkPath = "C:\Users\Public\Documents\app-gestionnaire\flutter_app\build\app\outputs\flutter-apk\app-release.apk"

Write-Host "=== Upload vers GitHub Releases ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les fichiers existent
Write-Host "1. Vérification des fichiers..." -ForegroundColor Yellow

if (!(Test-Path $msiPath)) {
    Write-Host "✗ MSI non trouvé: $msiPath" -ForegroundColor Red
    exit 1
}
$msiSize = (Get-Item $msiPath).Length / 1MB
Write-Host "   ✓ MSI trouvé: $([math]::Round($msiSize, 2)) MB" -ForegroundColor Green

if (!(Test-Path $apkPath)) {
    Write-Host "✗ APK non trouvé: $apkPath" -ForegroundColor Red
    exit 1
}
$apkSize = (Get-Item $apkPath).Length / 1MB
Write-Host "   ✓ APK trouvé: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Green

Write-Host ""
Write-Host "2. Création de la release $releaseTag..." -ForegroundColor Yellow

# Créer la release
gh release create $releaseTag `
    --repo $repo `
    --title $releaseTitle `
    --notes "## 🎯 Nouveautés

### ✅ Synchronisation automatique
- L'MSI lance automatiquement le serveur Next.js au démarrage
- L'APK peut se connecter au serveur local (saisie de l'IP)
- Plus besoin de configuration technique pour les utilisateurs

### ✅ Correctifs de sync
- L'app mobile accepte toutes les URLs d'API (pas seulement Vercel)
- Les données se synchronisent entre MSI et APK via le réseau local

### 📥 Installation
1. Installer l'MSI sur Windows (le serveur démarre automatiquement)
2. Noter l'IP affichée sur http://localhost:3000/server-info
3. Installer l'APK sur Android
4. Entrer l'IP du serveur dans les paramètres de l'APK

---

✅ Aucune connaissance technique requise !"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Échec de la création de la release" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Release créée avec succès" -ForegroundColor Green

Write-Host ""
Write-Host "3. Upload des fichiers..." -ForegroundColor Yellow

# Upload MSI
Write-Host "   Upload MSI..." -ForegroundColor Yellow
gh release upload $releaseTag `
    --repo $repo `
    --clobber `
    "$msiPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Échec upload MSI" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ MSI uploadé" -ForegroundColor Green

# Upload APK
Write-Host "   Upload APK..." -ForegroundColor Yellow
gh release upload $releaseTag `
    --repo $repo `
    --clobber `
    "$apkPath"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Échec upload APK" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ APK uploadé" -ForegroundColor Green

Write-Host ""
Write-Host "=== Upload terminé avec succès ! ===" -ForegroundColor Cyan
Write-Host "Release URL: https://github.com/$repo/releases/tag/$releaseTag" -ForegroundColor Green
