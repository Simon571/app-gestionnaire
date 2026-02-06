# Script de configuration Vercel pour téléchargement MSI
# Usage: .\configure-vercel-download.ps1

Write-Host "🔧 Configuration Vercel - Téléchargement Windows MSI" -ForegroundColor Cyan
Write-Host ""

# Variables
$MSI_URL = "https://github.com/Simon571/app-gestionnaire/releases/latest/download/Gestionnaire-setup.msi"

Write-Host "📋 Variables d'environnement à configurer sur Vercel:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL" -ForegroundColor Green
Write-Host "   Valeur: $MSI_URL"
Write-Host ""
Write-Host "2. NEXT_PUBLIC_WINDOWS_DOWNLOAD_SIZE (optionnel)" -ForegroundColor Green
Write-Host "   Valeur: 150 MB"
Write-Host ""
Write-Host "3. NEXT_PUBLIC_WINDOWS_SIGNED (optionnel)" -ForegroundColor Green
Write-Host "   Valeur: false"
Write-Host ""

Write-Host "🌐 Configuration sur Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://vercel.com/dashboard"
Write-Host "   2. Sélectionnez votre projet"
Write-Host "   3. Settings → Environment Variables"
Write-Host "   4. Ajoutez les variables ci-dessus"
Write-Host "   5. Redéployez votre site"
Write-Host ""

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if ($vercelInstalled) {
    Write-Host "✅ Vercel CLI détecté" -ForegroundColor Green
    Write-Host ""
    
    $response = Read-Host "Voulez-vous configurer automatiquement avec Vercel CLI ? (o/n)"
    
    if ($response -eq "o" -or $response -eq "O") {
        Write-Host ""
        Write-Host "⚙️ Configuration automatique..." -ForegroundColor Yellow
        
        # Configuration des variables
        vercel env add NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL production
        Write-Host $MSI_URL
        
        vercel env add NEXT_PUBLIC_WINDOWS_DOWNLOAD_SIZE production
        Write-Host "150 MB"
        
        vercel env add NEXT_PUBLIC_WINDOWS_SIGNED production
        Write-Host "false"
        
        Write-Host ""
        Write-Host "✅ Configuration terminée !" -ForegroundColor Green
        Write-Host ""
        
        $deploy = Read-Host "Voulez-vous redéployer maintenant ? (o/n)"
        if ($deploy -eq "o" -or $deploy -eq "O") {
            Write-Host "🚀 Déploiement en cours..." -ForegroundColor Cyan
            vercel --prod
        }
    }
} else {
    Write-Host "⚠️ Vercel CLI non installé" -ForegroundColor Yellow
    Write-Host "   Installation: npm i -g vercel"
    Write-Host "   Puis: vercel login"
    Write-Host ""
    Write-Host "   Ou configurez manuellement via le Dashboard"
}

Write-Host ""
Write-Host "📚 Documentation complète: GUIDE-TELECHARGEMENT-MSI.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Configuration prête !" -ForegroundColor Green
