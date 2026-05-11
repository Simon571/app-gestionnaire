#!/usr/bin/env pwsh
# Script de build pour Tauri avec Next.js standalone
# Corrigé : remonte d'un niveau la structure standalone

$ErrorActionPreference = "Stop"

Write-Host "=== Build Next.js standalone pour Tauri ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Build Next.js en mode standalone
Write-Host "1. Build Next.js (standalone)..." -ForegroundColor Yellow

$env:NEXT_EXPORT = "false"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Next.js échoué !" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Next.js build avec succès" -ForegroundColor Green

# Étape 2 : Préparer les fichiers pour Tauri
Write-Host ""
Write-Host "2. Préparation des fichiers standalone..." -ForegroundColor Yellow

$tauriResources = ".\src-tauri\resources"
$standaloneSrc = ".\.next\standalone"

if (!(Test-Path $standaloneSrc)) {
    Write-Host "✗ Dossier standalone introuvable : $standaloneSrc" -ForegroundColor Red
    exit 1
}

# Créer le dossier resources s'il n'existe pas
if (!(Test-Path $tauriResources)) {
    New-Item -ItemType Directory -Path $tauriResources -Force | Out-Null
}

# Supprimer l'ancien dossier .next s'il existe
$oldNext = "$tauriResources\.next"
if (Test-Path $oldNext) {
    Remove-Item -Path $oldNext -Recurse -Force
}

# Copier tout le contenu de .next/standalone VERS $tauriResources\.next
Copy-Item -Path "$standaloneSrc\*" -Destination "$tauriResources\.next" -Recurse -Force

Write-Host "✓ Fichiers copiés vers $tauriResources\.next" -ForegroundColor Green

# Vérifier que server.js existe maintenant à la racine de .next
$serverJs = "$tauriResources\.next\server.js"
if (Test-Path $serverJs) {
    $serverSize = (Get-Item $serverJs).Length / 1KB
    Write-Host "✓ server.js trouvé : $serverJs ($([math]::Round($serverSize, 2)) KB" -ForegroundColor Green
} else {
    # Essayer server/index.js
    $serverAlt = "$tauriResources\.next\server\index.js"
    if (Test-Path $serverAlt) {
        Write-Host "✓ server\index.js trouvé, copie vers server.js..." -ForegroundColor Yellow
        Copy-Item -Path $serverAlt -Destination $serverJs -Force
    } else {
        Write-Host "✗ server.js introuvable dans le build standalone !" -ForegroundColor Red
        Write-Host "  Contenu de $tauriResources\.next :" -ForegroundColor Yellow
        Get-ChildItem "$tauriResources\.next" | Format-List
        exit 1
    }
}

# Étape 3 : Copier node.exe
Write-Host ""
Write-Host "3. Copie de node.exe..." -ForegroundColor Yellow

$nodeSrc = ".\node.exe"
$nodeDest = "$tauriResources\node.exe"

if (Test-Path $nodeSrc) {
    Copy-Item -Path $nodeSrc -Destination $nodeDest -Force
    $nodeSize = (Get-Item $nodeDest).Length / 1MB
    Write-Host "✓ node.exe copié : $nodeDest ($([math]::Round($nodeSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "✗ node.exe introuvable : $nodeSrc" -ForegroundColor Red
    exit 1
}

# Étape 4 : Créer la configuration serveur
Write-Host ""
Write-Host "4. Création de la configuration serveur..." -ForegroundColor Yellow

$serverConfig = @{
    "serverEntry" = "server.js"
    "port" = 3000
    "host" = "0.0.0.0"
} | ConvertTo-Json

$serverConfig | Out-File -FilePath "$tauriResources\server-config.json" -Encoding UTF8
Write-Host "✓ Configuration créée" -ForegroundColor Green

Write-Host ""
Write-Host "=== Build terminé avec succès ! ===" -ForegroundColor Cyan
Write-Host "Vous pouvez maintenant lancer : npm run tauri:build:release" -ForegroundColor Green
