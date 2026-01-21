# Script pour nettoyer le cache de l'application Flutter
# Cela force le rechargement des données depuis les assets

Write-Host "`n=== Nettoyage du cache Flutter ===" -ForegroundColor Cyan

# Supprimer le dossier build
$buildPath = "$PSScriptRoot\build"
if (Test-Path $buildPath) {
    Remove-Item -Path $buildPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Dossier build supprimé" -ForegroundColor Green
} else {
    Write-Host "⊗ Dossier build n'existe pas" -ForegroundColor Yellow
}

# Note: SharedPreferences est stocké dans l'OS, pas dans le dossier du projet
# Pour Windows, c'est dans le registre ou dans AppData
# Le seul moyen de le nettoyer est de désinstaller/réinstaller l'app ou d'ajouter un bouton "Recharger données"

Write-Host "`n📝 Note importante:" -ForegroundColor Yellow
Write-Host "   SharedPreferences est stocké par le système d'exploitation." -ForegroundColor White
Write-Host "   Pour forcer un rechargement complet des données:" -ForegroundColor White
Write-Host "   1. Fermez l'application si elle est ouverte" -ForegroundColor White
Write-Host "   2. Sur Windows: Désinstallez l'application" -ForegroundColor White
Write-Host "   3. Exécutez: flutter run -d windows" -ForegroundColor White
Write-Host ""
Write-Host "   OU utilisez le bouton 'Réinitialiser les données' dans l'application" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Build nettoyé!" -ForegroundColor Green
Write-Host ""
