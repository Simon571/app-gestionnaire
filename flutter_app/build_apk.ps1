#!/usr/bin/env pwsh
# Build APK Script

Set-Location -Path "C:\Users\Public\Documents\app-gestionnaire\flutter_app"
Write-Host "Current Directory: $(Get-Location)"
Write-Host "Pubspec Exists: $(Test-Path pubspec.yaml)"
Write-Host ""
Write-Host "Building APK..."
Write-Host ""

flutter build apk --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Build réussi!" -ForegroundColor Green
    Write-Host "APK location: build\app\outputs\flutter-apk\app-release.apk"
    
    $apkPath = "build\app\outputs\flutter-apk\app-release.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "APK size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "✗ Build échoué avec le code d'erreur: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Vérifiez les messages d'erreur ci-dessus pour plus de détails."
    exit $LASTEXITCODE
}
