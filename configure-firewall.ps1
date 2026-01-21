# Configuration du pare-feu Windows pour Next.js Dev Server
# À exécuter en tant qu'administrateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Pare-feu Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERREUR: Ce script doit être exécuté en tant qu'administrateur!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Faites un clic droit sur PowerShell et choisissez 'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✓ Exécution en tant qu'administrateur" -ForegroundColor Green
Write-Host ""

# Supprimer les anciennes règles si elles existent
Write-Host "🧹 Nettoyage des anciennes règles..." -ForegroundColor Magenta
netsh advfirewall firewall delete rule name="Next.js Dev Server" 2>&1 | Out-Null
netsh advfirewall firewall delete rule name="Node.js Server" 2>&1 | Out-Null
Write-Host "✓ Nettoyage terminé" -ForegroundColor Green
Write-Host ""

# Créer la règle pour le port 3000 (Entrée)
Write-Host "🔧 Création de la règle de pare-feu (Port 3000 TCP Entrée)..." -ForegroundColor Magenta
$result = netsh advfirewall firewall add rule name="Next.js Dev Server" dir=in action=allow protocol=TCP localport=3000 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Règle de pare-feu créée avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la création de la règle" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

# Créer la règle pour le port 3000 (Sortie)
Write-Host "🔧 Création de la règle de pare-feu (Port 3000 TCP Sortie)..." -ForegroundColor Magenta
netsh advfirewall firewall add rule name="Next.js Dev Server Outbound" dir=out action=allow protocol=TCP localport=3000 2>&1 | Out-Null
Write-Host "✓ Règle de sortie créée" -ForegroundColor Green
Write-Host ""

# Vérifier les règles créées
Write-Host "📋 Vérification des règles créées:" -ForegroundColor Magenta
netsh advfirewall firewall show rule name="Next.js Dev Server"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Configuration terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les connexions sur le port 3000 sont maintenant autorisées." -ForegroundColor Green
Write-Host "Vous pouvez maintenant utiliser l'application Flutter." -ForegroundColor Green
Write-Host ""
pause
