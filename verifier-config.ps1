# Script de vérification de la configuration
# Exécutez ce script pour vérifier que tout est prêt pour le déploiement

Write-Host "🔍 VÉRIFICATION DE LA CONFIGURATION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Vérification 1 : Node.js
Write-Host "📦 Vérification de Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    $version = $nodeVersion -replace 'v', ''
    $majorVersion = [int]($version.Split('.')[0])
    if ($majorVersion -ge 18) {
        Write-Host "   ✅ Node.js $nodeVersion (OK)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Node.js $nodeVersion (version 18+ requise)" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "   ❌ Node.js non installé" -ForegroundColor Red
    $allGood = $false
}

# Vérification 2 : Rust
Write-Host "🦀 Vérification de Rust..." -ForegroundColor Yellow
$cargoVersion = cargo --version 2>$null
if ($cargoVersion) {
    Write-Host "   ✅ $cargoVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Rust/Cargo non installé" -ForegroundColor Red
    $allGood = $false
}

# Vérification 3 : Git
Write-Host "📚 Vérification de Git..." -ForegroundColor Yellow
$gitVersion = git --version 2>$null
if ($gitVersion) {
    Write-Host "   ✅ $gitVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Git non installé" -ForegroundColor Red
    $allGood = $false
}

# Vérification 4 : Dependencies npm
Write-Host "📦 Vérification des dépendances npm..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules présent" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules manquant - exécutez: npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Vérification 5 : Fichiers de configuration
Write-Host "⚙️  Vérification des fichiers de configuration..." -ForegroundColor Yellow
$configFiles = @(
    "next.config.ts",
    "next.config.tauri.ts",
    "src-tauri/tauri.conf.json",
    "package.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $allGood = $false
    }
}

# Vérification 6 : Page de téléchargement
Write-Host "📄 Vérification de la page de téléchargement..." -ForegroundColor Yellow
if (Test-Path "src/app/[locale]/download/page.tsx") {
    $content = Get-Content "src/app/[locale]/download/page.tsx" -Raw
    if ($content -match "VOTRE-USERNAME") {
        Write-Host "   ⚠️  URL GitHub non configurée" -ForegroundColor Yellow
        Write-Host "      Modifiez: src/app/[locale]/download/page.tsx (ligne 130)" -ForegroundColor White
    } else {
        Write-Host "   ✅ Page de téléchargement configurée" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Page de téléchargement manquante" -ForegroundColor Red
    $allGood = $false
}

# Vérification 7 : SEO
Write-Host "🔍 Vérification SEO..." -ForegroundColor Yellow
$seoFiles = @(
    "src/app/robots.ts",
    "src/app/sitemap.ts"
)

foreach ($file in $seoFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "votre-domaine.vercel.app") {
            Write-Host "   ⚠️  $file - URL Vercel à configurer (après déploiement)" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ $file configuré" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $allGood = $false
    }
}

# Vérification 8 : Scripts de build
Write-Host "🔨 Vérification des scripts de build..." -ForegroundColor Yellow
$buildScripts = @(
    "build-tauri.ps1",
    "deploy-vercel.ps1"
)

foreach ($script in $buildScripts) {
    if (Test-Path $script) {
        Write-Host "   ✅ $script" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $script manquant" -ForegroundColor Red
        $allGood = $false
    }
}

# Vérification 9 : Documentation
Write-Host "📚 Vérification de la documentation..." -ForegroundColor Yellow
$docs = @(
    "DEMARRAGE-RAPIDE.md",
    "GUIDE-DEPLOIEMENT-COMPLET.md",
    "CHECKLIST-DEPLOIEMENT.md",
    "TOUT-EST-PRET.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $doc manquant" -ForegroundColor Red
    }
}

# Résumé
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ TOUT EST PRÊT !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "1. Modifier l'URL GitHub dans src/app/[locale]/download/page.tsx" -ForegroundColor White
    Write-Host "2. Exécuter: .\build-tauri.ps1" -ForegroundColor White
    Write-Host "3. Publier sur GitHub Releases" -ForegroundColor White
    Write-Host "4. Exécuter: .\deploy-vercel.ps1" -ForegroundColor White
    Write-Host "5. Mettre à jour les URLs Vercel dans robots.ts et sitemap.ts" -ForegroundColor White
    Write-Host ""
    Write-Host "Consultez TOUT-EST-PRET.md pour les détails" -ForegroundColor Yellow
} else {
    Write-Host "❌ PROBLÈMES DÉTECTÉS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez corriger les erreurs ci-dessus avant de continuer." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions rapides :" -ForegroundColor Cyan
    Write-Host "• Node.js: https://nodejs.org/" -ForegroundColor White
    Write-Host "• Rust: https://www.rust-lang.org/tools/install" -ForegroundColor White
    Write-Host "• Git: https://git-scm.com/" -ForegroundColor White
    Write-Host "• Dependencies: npm install" -ForegroundColor White
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
