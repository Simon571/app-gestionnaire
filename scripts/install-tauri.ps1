#!/usr/bin/env pwsh
# ============================================
# Script d'Installation Tauri Simplifiée
# Admin d'Assemblée - Application Bureau
# ============================================

Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Admin d'Assemblée - Installation Bureau (Tauri)  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# Vérification des Prérequis
# ============================================

Write-Host "📋 Vérification des prérequis..." -ForegroundColor Yellow
Write-Host ""

# Vérifier Node.js
Write-Host "  • Node.js...", -NoNewline
try {
    $nodeVersion = node --version
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host " ❌ ERREUR" -ForegroundColor Red
    Write-Host "    Téléchargez Node.js depuis : https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Vérifier npm
Write-Host "  • npm...", -NoNewline
try {
    $npmVersion = npm --version
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ v$npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host " ❌ ERREUR" -ForegroundColor Red
    exit 1
}

# Vérifier Rust
Write-Host "  • Rust/Cargo...", -NoNewline
try {
    $rustVersion = rustc --version
    $cargoVersion = cargo --version
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ Installé" -ForegroundColor Green
    } else {
        throw "Rust not found"
    }
} catch {
    Write-Host " ❌ ERREUR" -ForegroundColor Red
    Write-Host "    Exécutez dans PowerShell (admin) :" -ForegroundColor Yellow
    Write-Host "    irm https://rustup.rs -useb | iex" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✅ Tous les prérequis sont installés !" -ForegroundColor Green
Write-Host ""

# ============================================
# Menu d'Options
# ============================================

Write-Host "🎯 Que voulez-vous faire ?" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [1] 🚀 Lancer en mode développement (rapide)"
Write-Host "  [2] 🏗️  Compiler pour production (créer .exe)"
Write-Host "  [3] 🎨 Régénérer les icônes"
Write-Host "  [4] 🧹 Nettoyer et recommencer"
Write-Host ""

$choice = Read-Host "Choisissez (1/2/3/4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Lancement en mode développement..." -ForegroundColor Cyan
        Write-Host "   Une fenêtre application s'ouvrira." -ForegroundColor Gray
        Write-Host ""
        npm run tauri:dev
    }
    
    "2" {
        Write-Host ""
        Write-Host "🏗️  Compilation pour production..." -ForegroundColor Cyan
        Write-Host "   Cela prendra 5-15 minutes la première fois." -ForegroundColor Gray
        Write-Host ""
        
        # Étape 1 : Build Next.js
        Write-Host "⏳ Étape 1/3 : Compilation Next.js..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur lors de la compilation Next.js" -ForegroundColor Red
            exit 1
        }
        
        # Étape 2 : Build Tauri
        Write-Host ""
        Write-Host "⏳ Étape 2/3 : Compilation Tauri (longue, soyez patient)..." -ForegroundColor Yellow
        npm run tauri:build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur lors de la compilation Tauri" -ForegroundColor Red
            exit 1
        }
        
        # Étape 3 : Localiser l'installateur
        Write-Host ""
        Write-Host "✅ Compilation réussie !" -ForegroundColor Green
        Write-Host ""
        
        $installerPath = Get-ChildItem -Path "src-tauri/target/release/bundle/nsis/*.exe" | Select-Object -First 1
        if ($installerPath) {
            Write-Host "📦 Fichier installateur créé :" -ForegroundColor Cyan
            Write-Host "   $($installerPath.FullName)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "🎯 Prochaines étapes :" -ForegroundColor Cyan
            Write-Host "   1. Double-cliquez sur le fichier .exe ci-dessus"
            Write-Host "   2. Suivez l'installation"
            Write-Host "   3. L'application sera installée sur votre bureau"
            Write-Host ""
            
            $launchInstaller = Read-Host "Voulez-vous lancer l'installateur maintenant ? (o/n)"
            if ($launchInstaller -eq "o") {
                & $installerPath.FullName
            }
        } else {
            Write-Host "⚠️  Installateur non trouvé. Vérifiez les logs d'erreur." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🎨 Régénération des icônes..." -ForegroundColor Cyan
        npm run generate:icons
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Icônes régénérées avec succès !" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur lors de la génération des icônes" -ForegroundColor Red
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🧹 Nettoyage du dossier Tauri..." -ForegroundColor Cyan
        
        $confirmClean = Read-Host "Êtes-vous sûr ? (o/n)"
        if ($confirmClean -eq "o") {
            Write-Host "   Suppression de src-tauri/target..."
            Remove-Item -Path "src-tauri/target" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   Suppression de node_modules..."
            Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   Suppression de .next..."
            Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
            
            Write-Host ""
            Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
            Write-Host ""
            Write-Host "📥 Réinstallez les dépendances :" -ForegroundColor Cyan
            Write-Host "   npm install" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "❌ Option invalide" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Terminé !" -ForegroundColor Green
