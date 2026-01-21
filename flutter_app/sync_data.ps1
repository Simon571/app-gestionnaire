# Script de synchronisation des données vers Flutter
# Ce script copie les fichiers de données à jour vers l'application Flutter

$sourceDir = "$PSScriptRoot\..\data"
$destDir = "$PSScriptRoot\assets\data"

Write-Host "`n=== Synchronisation des données Flutter ===" -ForegroundColor Cyan

# Liste des fichiers à synchroniser
$files = @(
    'publisher-users.json',
    'families.json',
    'attendance.json',
    'preaching-groups.json',
    'publisher-preaching.json'
)

$copiedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    $source = Join-Path $sourceDir $file
    $dest = Join-Path $destDir $file
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Force
        Write-Host "✓ Copié: $file" -ForegroundColor Green
        $copiedCount++
    } else {
        Write-Host "⊗ Ignoré (source manquante): $file" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host "`n=== Mapping des IDs de groupes ===" -ForegroundColor Cyan

# Appliquer les mappings d'IDs de groupes
$publisherUsersPath = Join-Path $destDir 'publisher-users.json'
if (Test-Path $publisherUsersPath) {
    $content = Get-Content $publisherUsersPath -Raw -Encoding UTF8
    
    $replacements = @{
        'group-1762075710921' = 'group-1764631730179'  # Groupe 1
        'group-1762075718330' = 'group-1764631738466'  # Groupe 2
        'group-1762075746776' = 'group-1764631744941'  # Groupe 3
        'group-1762075754432' = 'group-1762075782725'  # Groupe 4
        'group-1762075760487' = 'group-1764631760309'  # Groupe 5
        'group-1762075800148' = 'group-1764631772096'  # Groupe 6
    }
    
    $totalReplacements = 0
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        $count = ($content | Select-String $old -AllMatches).Matches.Count
        if ($count -gt 0) {
            $content = $content -replace $old, $new
            $totalReplacements += $count
        }
    }
    
    if ($totalReplacements -gt 0) {
        $content | Set-Content $publisherUsersPath -Encoding UTF8 -NoNewline
        Write-Host "✓ Appliqué $totalReplacements remplacement(s) d'IDs de groupes" -ForegroundColor Green
    } else {
        Write-Host "✓ Aucun remplacement nécessaire (IDs déjà à jour)" -ForegroundColor Gray
    }
}

Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
Write-Host "Fichiers copiés: $copiedCount" -ForegroundColor White
Write-Host "Fichiers ignorés: $skippedCount" -ForegroundColor White

Write-Host "`n✓ Synchronisation terminée!" -ForegroundColor Green
Write-Host "`nPour appliquer les changements, exécutez:" -ForegroundColor Yellow
Write-Host "  flutter clean" -ForegroundColor White
Write-Host "  flutter run -d windows" -ForegroundColor White
Write-Host ""
