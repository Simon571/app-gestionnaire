# Script de build automatique pour Tauri
# Ce script prépare l'application pour la production Windows

Write-Host "🚀 Build Tauri - Gestionnaire d'Assemblée" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Nettoyage
Write-Host "📦 Étape 1/5: Nettoyage des fichiers de build précédents..." -ForegroundColor Yellow
Remove-Item -Path "out" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "src-tauri\target\release" -Recurse -ErrorAction SilentlyContinue

# Étape 2: Installation des dépendances
Write-Host "📦 Étape 2/5: Vérification des dépendances..." -ForegroundColor Yellow
npm install

# Étape 3: Build Next.js en mode export
Write-Host "⚙️  Étape 3/5: Préparation du build statique..." -ForegroundColor Yellow

# ─────────────────────────────────────────────────────────────────
# STRATÉGIE:
# Le MSI est un export statique. Les routes API ne sont PAS embarquées
# dans le MSI — le MSI appelle les API Vercel directement via getApiBase().
# On renomme temporairement le dossier api/ pour éviter les conflits
# avec l'export statique (force-dynamic, fs, redirect, etc.)
# ─────────────────────────────────────────────────────────────────

$apiDir = "src\app\api"
$apiBackupDir = "src\app\_api_backup_tauri"

# Renommer le dossier api/ → _api_backup_tauri/ pour le build
if (Test-Path $apiDir) {
    Rename-Item -Path $apiDir -NewName "_api_backup_tauri"
    Write-Host "  → Routes API masquées pour le build statique" -ForegroundColor Gray
}

# De même, masquer les routes serveur-only (vcm/weeks qui utilise fs)
$vcmWeeksDir = "src\app\vcm\weeks"
$vcmWeeksBackup = "src\app\vcm\_weeks_backup_tauri"
if (Test-Path $vcmWeeksDir) {
    Rename-Item -Path $vcmWeeksDir -NewName "_weeks_backup_tauri"
    Write-Host "  → Route vcm/weeks masquée" -ForegroundColor Gray
}

$env:NEXT_CONFIG = "next.config.tauri.ts"
$env:NEXT_PUBLIC_PORTAL_MODE = "0"
# Limiter le parallélisme Rust pour éviter "LLVM ERROR: out of memory"
$env:CARGO_BUILD_JOBS = "2"

# Étape 5: Build Tauri (beforeBuildCommand relance npm run build:tauri)
Write-Host "🔨 Étape 5/5: Build de l'application Windows..." -ForegroundColor Yellow
npx tauri build --bundles msi
$buildResult = $LASTEXITCODE

# ─────────────────────────────────────────────────────────────────
# Restaurer les dossiers api/ et vcm/weeks
# ─────────────────────────────────────────────────────────────────
if (Test-Path $apiBackupDir) {
    # Supprimer le dossier api/ vide s'il a été recréé
    if (Test-Path $apiDir) {
        Remove-Item -Path $apiDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Rename-Item -Path $apiBackupDir -NewName "api"
    Write-Host "  → Routes API restaurées" -ForegroundColor Gray
}

if (Test-Path $vcmWeeksBackup) {
    if (Test-Path $vcmWeeksDir) {
        Remove-Item -Path $vcmWeeksDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Rename-Item -Path $vcmWeeksBackup -NewName "weeks"
    Write-Host "  → Route vcm/weeks restaurée" -ForegroundColor Gray
}

Write-Host "  → Structure du code restaurée pour Vercel" -ForegroundColor Gray

if ($buildResult -ne 0) {
    Write-Host "❌ Erreur lors du build Tauri" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📂 Fichiers d'installation créés dans:" -ForegroundColor Cyan
Write-Host "   src-tauri\target\release\bundle\" -ForegroundColor White
Write-Host ""
Write-Host "Formats disponibles:" -ForegroundColor Cyan
Write-Host "   • .msi (Windows Installer)" -ForegroundColor White
