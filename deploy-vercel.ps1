# Script de déploiement automatique sur Vercel
# Exécutez ce script pour déployer votre site web

Write-Host "🌐 Déploiement Vercel - Gestionnaire d'Assemblée" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI n'est pas installé" -ForegroundColor Yellow
    Write-Host "Installation en cours..." -ForegroundColor Yellow
    npm install -g vercel
}

# Étape 1: Build pour Vercel
Write-Host "📦 Étape 1/2: Build de l'application pour Vercel..." -ForegroundColor Yellow
npm run build:vercel

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}

# Étape 2: Déploiement
Write-Host "🚀 Étape 2/2: Déploiement sur Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Votre site est maintenant en ligne!" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
    exit 1
}
