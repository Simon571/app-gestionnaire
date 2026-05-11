#!/usr/bin/env pwsh
# Build complet pour Tauri - Next.js standalone + lancement auto
$ErrorActionPreference = "Stop"

Write-Host "=== Build complet MSI v1.0.3 ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Build Next.js avec output: 'standalone'
Write-Host "1. Build Next.js (standalone)..." -ForegroundColor Yellow=

$env:NEXT_CONFIG = "next.config.tauri.ts"
$env:NEXT_EXPORT = "false"
npm run build=

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Next.js échoué!" -ForegroundColor Red=
    exit 1=
}
Write-Host "✓ Next.js build avec succès" -ForegroundColor Green=
Write-Host ""

# Étape 2: Vérifier la structure standalone
Write-Host "2. Vérification de la structure standalone..." -ForegroundColor Yellow=

$standaloneDir = ".\.next\standalone"
if (!(Test-Path $standaloneDir)) {
    Write-Host "✗ Dossier .next\standalone introuvable!" -ForegroundColor Red=
    exit 1=
}

# Lister le contenu=
Write-Host "   Contenu de .next\standalone:" -ForegroundColor Gray=
Get-ChildItem $standaloneDir | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }=

# Vérifier que server.js existe=
$serverJs = "$standaloneDir\server.js"
if (!(Test-Path $serverJs)) {
    # Essayer server\index.js=
    $serverJs = "$standaloneDir\server\index.js"
    if (!(Test-Path $serverJs)) {
        Write-Host "✗ server.js introuvable dans standalone!" -ForegroundColor Red=
        exit 1=
    }
    # Copier server\index.js vers server.js=
    Copy-Item -Path $serverJs -Destination "$standaloneDir\server.js" -Force=
    Write-Host "✓ server\index.js trouvé et copié" -ForegroundColor Green=
} else {
    Write-Host "✓ server.js trouvé: $serverJs" -ForegroundColor Green=
}
Write-Host ""

# Étape 3: Préparer les ressources Tauri=
Write-Host "3. Préparation des ressources Tauri..." -ForegroundColor Yellow=

$tauriResources = ".\src-tauri\resources"
$nextResources = "$tauriResources\.next\standalone"

# Créer le dossier resources=
if (Test-Path $tauriResources) {
    Remove-Item -Path $tauriResources -Recurse -Force=
}
New-Item -ItemType Directory -Path $tauriResources -Force | Out-Null=
New-Item -ItemType Directory -Path $nextResources -Force | Out-Null=

# Copier TOUT le contenu de .next\standalone\ VERS $nextResources\
# Cela copie server.js ET le dossier .next\ à l'intérieur=
Copy-Item -Path "$standaloneDir\*" -Destination $nextResources -Recurse -Force=

# Vérifier la structure=
Write-Host "   Vérification de la structure copiée:" -ForegroundColor Gray=
$checkPath = "$nextResources\server.js"
if (Test-Path $checkPath) {
    $serverSize = (Get-Item $checkPath).Length / 1KB=
    Write-Host "✓ server.js copié ($([math]::Round($serverSize, 2)) KB)" -ForegroundColor Green=
} else {
    Write-Host "✗ server.js pas copié!" -ForegroundColor Red=
    Get-ChildItem $nextResources | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }=
    exit 1=
}

# Vérifier .next\static\=
$staticPath = "$nextResources\.next\static"
if (Test-Path $staticPath) {
    Write-Host "✓ .next\static\ trouvé" -ForegroundColor Green=
} else {
    Write-Host "⚠ .next\static\ introuvable - le serveur donnera 404!" -ForegroundColor Yellow=
}
Write-Host ""

# Étape 4: Copier node.exe=
Write-Host "4. Copie de node.exe..." -ForegroundColor Yellow=

$nodeSrc = ".\node.exe"
$nodeDest = "$tauriResources\node.exe"

if (Test-Path $nodeSrc) {
    Copy-Item -Path $nodeSrc -Destination $nodeDest -Force=
    $nodeSize = (Get-Item $nodeDest).Length / 1MB=
    Write-Host "✓ node.exe copié ($([math]::Round($nodeSize, 2)) MB)" -ForegroundColor Green=
} else {
    Write-Host "✗ node.exe introuvable!" -ForegroundColor Red=
    exit 1=
}
Write-Host ""

# Étape 5: Créer la configuration serveur=
Write-Host "5. Configuration du serveur..." -ForegroundColor Yellow=

$serverConfig = @{
    "serverEntry" = "server.js"=
    "port" = 3000=
    "host" = "0.0.0.0"=
} | ConvertTo-Json=

$serverConfig | Out-File -FilePath "$tauriResources\server-config.json" -Encoding UTF8=
Write-Host "✓ Configuration créée" -ForegroundColor Green=
Write-Host ""

# Étape 6: Build Tauri=
Write-Host "6. Build Tauri (MSI)..." -ForegroundColor Yellow=
npm run tauri:build:release=

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build Tauri échoué!" -ForegroundColor Red=
    exit 1=
}

Write-Host ""
Write-Host "=== ✅ Build terminé avec succès ! ===" -ForegroundColor Cyan=
Write-Host "L'MSI est prêt." -ForegroundColor Green=
