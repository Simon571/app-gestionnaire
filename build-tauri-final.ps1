#!/usr/bin/env pwsh
# Préparation des ressources Tauri (beforeBuildCommand)
# NE PAS appeler tauri build ici (circulaire !)
$ErrorActionPreference = "Stop"

Write-Host "=== Préparation ressources Tauri ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\Public\Documents\app-gestionnaire"
$tauriResources = "$projectRoot\src-tauri\resources"
$standaloneDir = "$projectRoot\.next\standalone"
$staticDir = "$projectRoot\.next\static"

# ÉTAPE 1 : Construire Next.js standalone si nécessaire
if (!(Test-Path $standaloneDir)) {
    Write-Host "1. Build Next.js (standalone)..." -ForegroundColor Yellow
    Set-Location $projectRoot
    $env:NEXT_CONFIG = "next.config.tauri.ts"
    npx next build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build Next.js échoué !" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Next.js build réussi" -ForegroundColor Green
} else {
    Write-Host "1. Next.js standalone déjà présent - skip build" -ForegroundColor Green
}

Write-Host ""

# ÉTAPE 2 : Copier les fichiers statiques dans standalone (si pas déjà fait)
Write-Host "2. Copie des fichiers statiques..." -ForegroundColor Yellow
$staticDest = "$standaloneDir\.next\static"
if ((Test-Path $staticDir) -and !(Test-Path $staticDest)) {
    Copy-Item -Path $staticDir -Destination "$standaloneDir\.next" -Recurse -Force
    Write-Host "✓ Fichiers statiques copiés" -ForegroundColor Green
} else {
    Write-Host "✓ Fichiers statiques déjà en place" -ForegroundColor Green
}

Write-Host ""

# ÉTAPE 3 : Préparer resources/
Write-Host "3. Préparation du dossier resources..." -ForegroundColor Yellow
if (Test-Path $tauriResources) {
    Remove-Item -Path $tauriResources -Recurse -Force
}
New-Item -ItemType Directory -Path "$tauriResources\.next" -Force | Out-Null

# Copier standalone → resources/.next/standalone  (conserve le sous-dossier "standalone")
Copy-Item -Path $standaloneDir -Destination "$tauriResources\.next" -Recurse -Force
Write-Host "✓ Next.js standalone → resources/.next/standalone" -ForegroundColor Green

Write-Host ""

# ÉTAPE 4 : Copier node.exe → resources/node.exe
Write-Host "4. Copie de node.exe..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodeSrc = if ($nodeCmd) { $nodeCmd.Source } else { $null }
if (-not $nodeSrc) {
    $candidates = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Users\$env:USERNAME\AppData\Local\Programs\nodejs\node.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $nodeSrc = $c; break }
    }
}
if (-not $nodeSrc -or !(Test-Path $nodeSrc)) {
    Write-Host "✗ node.exe introuvable !" -ForegroundColor Red
    exit 1
}
Copy-Item -Path $nodeSrc -Destination "$tauriResources\node.exe" -Force
$nodeSize = [math]::Round((Get-Item "$tauriResources\node.exe").Length / 1MB, 2)
Write-Host "✓ node.exe copié ($nodeSize MB) depuis $nodeSrc" -ForegroundColor Green

Write-Host ""
Write-Host "=== ✅ Ressources prêtes ! ===" -ForegroundColor Cyan


