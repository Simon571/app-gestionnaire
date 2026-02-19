# Script de build automatique pour Tauri
# Ce script prépare l'application pour la production Windows

Write-Host "🚀 Build Tauri - Gestionnaire d'Assemblée" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Nettoyage
Write-Host "📦 Étape 1/5: Nettoyage des fichiers de build précédents..." -ForegroundColor Yellow
Remove-Item -Path "out" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path ".next" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "src-tauri\target\release" -Recurse -ErrorAction SilentlyContinue

# Étape 2: Installation des dépendances
Write-Host "📦 Étape 2/5: Vérification des dépendances..." -ForegroundColor Yellow
npm install

# Étape 3: Build Next.js en mode export
Write-Host "⚙️  Étape 3/5: Build de l'interface (Next.js export)..." -ForegroundColor Yellow

# Patch temporaire: routes force-dynamic → force-static pour le build statique Tauri
# (sur Vercel, elles sont force-dynamic pour lire les fichiers JSON en temps réel)
$routesToPatch = @(
  "src\app\api\publisher-app\users\web-sync\route.ts",
  "src\app\api\publisher-app\users\export\route.ts",
  "src\app\api\families\route.ts",
  "src\app\api\preaching-groups\route.ts"
)
$originalContents = @{}
foreach ($route in $routesToPatch) {
  $original = Get-Content $route -Raw
  $originalContents[$route] = $original
  $patched = $original -replace "export const dynamic = 'force-dynamic'", "export const dynamic = 'force-static'"
  Set-Content $route $patched
  Write-Host "  → Paché: $route" -ForegroundColor Gray
}

$env:NEXT_CONFIG = "next.config.tauri.ts"
$env:NEXT_PUBLIC_PORTAL_MODE = "0"
npm run build:tauri
$buildResult = $LASTEXITCODE

# Restaurer les routes à force-dynamic (état Vercel)
foreach ($route in $routesToPatch) {
  Set-Content $route $originalContents[$route]
  Write-Host "  → Restauré: $route" -ForegroundColor Gray
}
Write-Host "  → Routes restaurées (force-dynamic pour Vercel)" -ForegroundColor Gray

# Vérification du build Next.js
if ($buildResult -ne 0) {
    Write-Host "❌ Erreur lors du build Next.js" -ForegroundColor Red
    exit 1
}

# Étape 5: Build Tauri
Write-Host "🔨 Étape 5/5: Build de l'application Windows..." -ForegroundColor Yellow
npx tauri build --bundles msi

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build terminé avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Fichiers d'installation créés dans:" -ForegroundColor Cyan
    Write-Host "   src-tauri\target\release\bundle\" -ForegroundColor White
    Write-Host ""
    Write-Host "Formats disponibles:" -ForegroundColor Cyan
    Write-Host "   • .msi (Windows Installer)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du build Tauri" -ForegroundColor Red
    exit 1
}
