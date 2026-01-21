# Build APK Script
$flutterAppPath = "c:\Users\Public\Documents\app-gestionnaire\flutter_app"
$logPath = "c:\Users\Public\Documents\app-gestionnaire\flutter_build_apk.log"

Write-Host "Starting Flutter APK build..."
Write-Host "Working directory: $flutterAppPath"

Push-Location $flutterAppPath

try {
    # Ensure Flutter is in PATH
    $env:Path = "C:\flutter\bin;$env:Path"
    
    # Get the latest version of pub packages
    Write-Host "Running: flutter pub get"
    & flutter pub get 2>&1 | Tee-Object -FilePath $logPath -Append
    
    # Clean
    Write-Host "Running: flutter clean"
    & flutter clean 2>&1 | Tee-Object -FilePath $logPath -Append
    
    # Build APK
    Write-Host "Running: flutter build apk --release"
    & flutter build apk --release 2>&1 | Tee-Object -FilePath $logPath -Append
    
    Write-Host "Build complete!"
    Write-Host "APK location: $flutterAppPath\build\app\outputs\flutter-apk\app-release.apk"
    
} catch {
    Write-Host "Error: $_"
} finally {
    Pop-Location
    Write-Host "Log saved to: $logPath"
}
