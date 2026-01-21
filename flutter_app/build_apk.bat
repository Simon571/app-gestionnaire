@echo off
echo ============================================
echo Building Flutter APK (Release)
echo ============================================
echo.

cd /d "%~dp0"

echo Cleaning previous build...
flutter clean

echo Getting dependencies...
flutter pub get

echo Building APK...
flutter build apk --release

echo.
echo ============================================
echo Build complete!
echo APK location: build\app\outputs\flutter-apk\app-release.apk
echo ============================================
pause
