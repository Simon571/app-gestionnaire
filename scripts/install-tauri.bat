@echo off
REM ============================================
REM Script d'Installation Tauri - Windows Batch
REM Admin d'Assemblée v0.1.0
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║   Admin d'Assemblée - Installation Bureau (Tauri)  ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM Vérifier Node.js
echo 📋 Vérification des prérequis...
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    echo.
    echo Téléchargez depuis : https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Prérequis OK
echo.

REM Menu
echo 🎯 Que voulez-vous faire ?
echo.
echo   [1] 🚀 Lancer en mode développement
echo   [2] 🏗️  Compiler pour production
echo   [3] 🎨 Régénérer les icônes
echo   [4] 📖 Ouvrir le guide d'installation
echo.

set /p choice="Choisissez (1/2/3/4) : "

if "%choice%"=="1" (
    echo.
    echo 🚀 Lancement en mode développement...
    echo.
    call npm run tauri:dev
    pause
)

if "%choice%"=="2" (
    echo.
    echo 🏗️  Compilation pour production...
    echo    Cela prendra 5-15 minutes la première fois.
    echo.
    
    echo ⏳ Étape 1/3 : Compilation Next.js...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de la compilation Next.js
        pause
        exit /b 1
    )
    
    echo.
    echo ⏳ Étape 2/3 : Compilation Tauri...
    call npm run tauri:build
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de la compilation Tauri
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Compilation réussie !
    echo.
    echo 📦 L'installateur se trouve dans :
    echo    src-tauri\target\release\bundle\nsis\
    echo.
    echo 🎯 Double-cliquez sur le fichier .exe pour installer l'application
    echo.
    pause
)

if "%choice%"=="3" (
    echo.
    echo 🎨 Régénération des icônes...
    echo.
    call npm run generate:icons
    echo.
    pause
)

if "%choice%"=="4" (
    echo.
    echo 📖 Ouverture du guide d'installation...
    echo.
    start TAURI-INSTALLATION-GUIDE.md
)
