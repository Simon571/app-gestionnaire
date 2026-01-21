# Script de déploiement sur Railway pour Windows
# Usage: .\deploy-railway.ps1

Write-Host "🚀 Préparation du déploiement sur Railway..." -ForegroundColor Green
Write-Host ""

# Vérifier que git est clean
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Il y a des changements non commités." -ForegroundColor Yellow
    Write-Host "Veuillez faire un commit avant de déployer."
    exit 1
}

# Vérifier la branche
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    Write-Host "⚠️  Vous n'êtes pas sur la branche 'main' (actuellement sur '$branch')" -ForegroundColor Yellow
    $response = Read-Host "Continuer quand même ? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

Write-Host "✅ Vérification du build local..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build réussi!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Commitez vos changements et faites un 'git push' pour déclencher le déploiement sur Railway."
Write-Host ""
Write-Host "Si le déploiement automatique n'est pas activé :"
Write-Host "  1. Allez sur https://railway.app"
Write-Host "  2. Ouvrez votre projet"
Write-Host "  3. Cliquez sur 'Deploy' ou 'Redeploy'"
Write-Host ""
Write-Host "Consultez RAILWAY-DEPLOYMENT-GUIDE.md pour plus d'informations."
