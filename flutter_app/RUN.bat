@echo off
REM Script pour lancer l'application Flutter
REM Usage: Double-cliquez sur ce fichier ou exécutez: RUN.bat

echo.
echo ========================================
echo   Application Flutter Mobile
echo ========================================
echo.

REM Ajouter Flutter au PATH
set PATH=C:\flutter\bin;%PATH%

REM Vérifier que Flutter est installé
flutter --version
if errorlevel 1 (
    echo.
    echo ERREUR: Flutter n'est pas installé!
    echo Veuillez installer Flutter d'abord.
    pause
    exit /b 1
)

echo.
echo Localisation: %CD%
echo.

REM 1. Nettoyer
echo 1/3 - Nettoyage...
flutter clean
if errorlevel 1 goto error

echo.
echo 2/3 - Installation des dependances...
flutter pub get
if errorlevel 1 goto error

echo.
echo 3/3 - Lancement de l'application...
flutter run
if errorlevel 1 goto error

echo.
echo SUCCESS! Application lancee!
echo.
pause
exit /b 0

:error
echo.
echo ERREUR lors de l'execution!
echo.
pause
exit /b 1
