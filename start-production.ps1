# Script de démarrage en mode production
# Lance l'application Next.js en production

Write-Host "🚀 Démarrage de l'application en mode production..." -ForegroundColor Green
Write-Host ""

# Vérifier si le port 3000 est déjà utilisé
$port = 3000
$processOnPort = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1

if ($processOnPort) {
    $processId = $processOnPort.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    Write-Host "⚠️  Le port $port est déjà utilisé par:" -ForegroundColor Yellow
    Write-Host "   Processus: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
    Write-Host ""
    
    $response = Read-Host "Voulez-vous arrêter ce processus? (O/N)"
    
    if ($response -eq 'O' -or $response -eq 'o') {
        Write-Host "🛑 Arrêt du processus..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force
        Start-Sleep -Seconds 2
    } else {
        Write-Host "❌ Impossible de démarrer sur le port $port. Le port est déjà utilisé." -ForegroundColor Red
        Write-Host "💡 Conseil: Arrêtez le serveur existant ou utilisez un autre port." -ForegroundColor Cyan
        exit 1
    }
}

# Vérifier que le build existe
if (-not (Test-Path ".next")) {
    Write-Host "❌ Build non trouvé. Lancement du build..." -ForegroundColor Red
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec du build" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Démarrage du serveur sur http://0.0.0.0:3000" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fonctionnalités disponibles:" -ForegroundColor Cyan
Write-Host "  • Tableaux d'affichage (Assemblée, Anciens, Anciens et Assistants)" -ForegroundColor Gray
Write-Host "  • Synchronisation Publisher App" -ForegroundColor Gray
Write-Host "  • Gestion des proclamateurs" -ForegroundColor Gray
Write-Host "  • Programme VCM" -ForegroundColor Gray
Write-Host "  • Rapports de prédication" -ForegroundColor Gray
Write-Host "  • Intelligence Artificielle (Gemini)" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Pour arrêter le serveur: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur en mode standalone
$env:HOSTNAME = "0.0.0.0"
$env:PORT = "3000"
node .next/standalone/server.js
