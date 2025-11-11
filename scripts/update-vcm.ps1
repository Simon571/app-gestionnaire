Param(
  [ValidateSet('fr','en')]
  [string]$Lang = 'fr',
  [switch]$Import
)

$ErrorActionPreference = 'Stop'

Write-Host "[VCM-PS] Mise à jour VCM pour la langue: $Lang"

# 1) Scrape
Write-Host "[VCM-PS] Étape 1/4: Scraping..."
npm run scrape-vcm -- --lang=$Lang

# 2) Normalize
Write-Host "[VCM-PS] Étape 2/4: Normalisation..."
npm run normalize-vcm -- --lang=$Lang

# 3) Validate + Inspect dates
Write-Host "[VCM-PS] Étape 3/4: Validation..."
node scripts/verify-dates.js --lang=$Lang
npx ts-node --project scripts/tsconfig.json scripts/validate-vcm.ts --lang=$Lang

# 4) Optional import to API
if ($Import) {
  Write-Host "[VCM-PS] Étape 4/4: Import vers l'API..."
  npm run import-vcm -- --lang=$Lang
}

Write-Host "[VCM-PS] Terminé ✅"
