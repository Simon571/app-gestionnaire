# Script de mise à jour de version
# Usage: .\update-version.ps1 -Version "1.1.0"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "🔄 MISE À JOUR DE VERSION" -ForegroundColor Cyan
Write-Host "Nouvelle version: $Version" -ForegroundColor Yellow
Write-Host ""

# Validation du format de version
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Format de version invalide. Utilisez le format: X.Y.Z (ex: 1.0.0)" -ForegroundColor Red
    exit 1
}

# Fichier 1: package.json
Write-Host "📝 Mise à jour de package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
Write-Host "   ✅ package.json mis à jour" -ForegroundColor Green

# Fichier 2: src-tauri/tauri.conf.json
Write-Host "📝 Mise à jour de tauri.conf.json..." -ForegroundColor Yellow
$tauriConf = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
$tauriConf.version = $Version
$tauriConf | ConvertTo-Json -Depth 100 | Set-Content "src-tauri/tauri.conf.json"
Write-Host "   ✅ tauri.conf.json mis à jour" -ForegroundColor Green

# Fichier 3: CHANGELOG.md
Write-Host "📝 Préparation du CHANGELOG.md..." -ForegroundColor Yellow
$changelogPath = "CHANGELOG.md"
$changelog = Get-Content $changelogPath -Raw

$today = Get-Date -Format "yyyy-MM-dd"
$newEntry = @"

## [$Version] - $today

### ✨ Ajouté
- 

### 🔧 Modifié
- 

### 🐛 Corrigé
- 

### 🗑️ Supprimé
- 

"@

# Insérer après la première section [Unreleased]
if ($changelog -match '\[Unreleased\]') {
    $changelog = $changelog -replace '(\[Unreleased\].*?\n)', "`$1$newEntry"
    Set-Content $changelogPath $changelog
    Write-Host "   ✅ CHANGELOG.md préparé (veuillez compléter les sections)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  CHANGELOG.md - ajoutez manuellement la section [$Version]" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "✅ Version mise à jour vers $Version" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Complétez le CHANGELOG.md" -ForegroundColor White
Write-Host "2. Commitez les changements:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Release v$Version'" -ForegroundColor Gray
Write-Host "3. Créez un tag:" -ForegroundColor White
Write-Host "   git tag v$Version" -ForegroundColor Gray
Write-Host "4. Pushez vers GitHub:" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host "   git push origin v$Version" -ForegroundColor Gray
Write-Host "5. Buildez l'application:" -ForegroundColor White
Write-Host "   .\build-tauri.ps1" -ForegroundColor Gray
Write-Host "6. Créez une GitHub Release" -ForegroundColor White
Write-Host ""
