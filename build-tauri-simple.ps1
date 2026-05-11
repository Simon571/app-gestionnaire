#!/usr/bin/env pwsh
# Script SIMPLE et DIRECT pour Tauri + Next.js standalone
$ErrorActionPreference = "Stop"

Write-Host "=== Build MSI v1.0.3 ===" -ForegroundColor Cyan
Write-Host ""

# ========== ÉTAPE 1: Build Next.js standalone ==========
Write-Host "1. Build Next.js (standalone)..." -ForegroundColor Yellow

cd C:\Users\Public\Documents\app-gestionnaire
$env:NEXT_CONFIG = "next.config.tauri.ts"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Next.js échoué!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Next.js build avec succès" -ForegroundColor Green
Write-Host ""

# ========== ÉTAPE 2: Préparer les ressources Tauri ==========
Write-Host "2. Préparation des ressources Tauri..." -ForegroundColor Yellow

$tauriResources = "C:\Users\Public\Documents\app-gestionnaire\src-tauri\resources"
$standaloneSrc = "C:\Users\Public\Documents\app-gestionnaire\.next\standalone"

# Nettoyer le dossier resources
if (Test-Path $tauriResources) {
    Remove-Item -Path $tauriResources -Recurse -Force
}
New-Item -ItemType Directory -Path $tauriResources -Force | Out-Null

# Copier TOUT le contenu de .next/standalone/ VERS $tauriResources\.next\standalone\
Copy-Item -Path "$standaloneSrc\*" -Destination "$tauriResources\.next\standalone" -Recurse -Force

# Vérifier que server.js est là
$serverJs = "$tauriResources\.next\standalone\server.js"
if (!(Test-Path $serverJs)) {
    # Essayer server/index.js
    $serverJs = "$tauriResources\.next\standalone\server\index.js"
    if (Test-Path $serverJs) {
        Copy-Item -Path $serverJs -Destination "$tauriResources\.next\standalone\server.js" -Force
        $serverJs = "$tauriResources\.next\standalone\server.js"
    }
}

if (!(Test-Path $serverJs)) {
    Write-Host "✗ server.js introuvable!" -ForegroundColor Red
    Write-Host "  Contenu de $tauriResources\.next\standalone:" -ForegroundColor Yellow
    Get-ChildItem "$tauriResources\.next\standalone" | Format-List
    exit 1
}

$serverSize = (Get-Item $serverJs).Length / 1KB
Write-Host "✓ server.js trouvé ($([math]::Round($serverSize, 2)) KB)" -ForegroundColor Green

# Vérifier que .next/static/ est présent
$staticDir = "$tauriResources\.next\standalone\.next\static"
if (!(Test-Path $staticDir)) {
    Write-Host "✗ .next/static/ introuvable dans standalone!" -ForegroundColor Red
    Write-Host "  Le serveur donnera 404 !" -ForegroundColor Yellow
    Write-Host "  Copie de .next/static/..." -ForegroundColor Yellow
    
    # Copier .next/static/ vers standalone/.next/static/
    $staticSrc = "C:\Users\Public\Documents\app-gestionnaire\.next\static"
    if (Test-Path $staticSrc) {
        Copy-Item -Path "$staticSrc\*" -Destination "$tauriResources\.next\standalone\.next\static" -Recurse -Force
        Write-Host "✓ .next/static/ copié" -ForegroundColor Green
    }
}
Write-Host ""

# ========== ÉTAPE 3: Copier node.exe ==========
Write-Host "3. Copie de node.exe..." -ForegroundColor Yellow

$nodeSrc = "C:\Users\Public\Documents\app-gestionnaire\node.exe"
$nodeDest = "$tauriResources\node.exe"

if (Test-Path $nodeSrc) {
    Copy-Item -Path $nodeSrc -Destination $nodeDest -Force
    $nodeSize = (Get-Item $nodeDest).Length / 1MB
    Write-Host "✓ node.exe copié ($([math]::Round($nodeSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "✗ node.exe introuvable!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ========== ÉTAPE 4: Créer la configuration ==========
Write-Host "4. Configuration du serveur..." -ForegroundColor Yellow=

$serverConfig = @{
    "serverEntry" = "server.js"
    "port" = 3000
    "host" = "0.0.0.0"
} | ConvertTo-Json

$serverConfig | Out-File -FilePath "$tauriResources\server-config.json" -Encoding UTF8
Write-Host "✓ Configuration créée" -ForegroundColor Green
Write-Host ""

# ========== ÉTAPE 5: Build Tauri ==========
Write-Host "5. Build Tauri (MSI)..." -ForegroundColor Yellow

cd C:\Users\Public\Documents\app-gestionnaire
npm run tauri:build:release

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Tauri échoué!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== ✅ Build terminé avec succès ! ===" -ForegroundColor Cyan
Write-Host "MSI prêt à : src-tauri\target\release\bundle\msi\" -ForegroundColor Green
