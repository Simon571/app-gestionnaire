# Script pour remplacer tous les fetch('/api/ par apiFetch('api/
# À exécuter dans le répertoire racine du projet

$files = @(
    "src\app\activite-predication\page.tsx",
    "src\app\moi\taches\page.tsx",
    "src\app\personnes\page.tsx",
    "src\app\reports\page.tsx",
    "src\app\responsabilites\page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✏️  Modification: $file"
        
        $content = Get-Content -Path $file -Raw
        
        # 1. Ajouter l'import si absent
        if ($content -notmatch "import.*apiFetch.*from.*@/lib/api-client") {
            # Trouver la dernière ligne d'import
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                $lines = $lines[0..$lastImportIndex] + "import { apiFetch } from '@/lib/api-client';" + $lines[($lastImportIndex+1)..($lines.Length-1)]
                $content = $lines -join "`n"
                Write-Host "   ✅ Import ajouté"
            }
        }
        
        # 2. Remplacer fetch('/api/ par apiFetch('api/
        $originalContent = $content
        $content = $content -replace "fetch\('/api/", "apiFetch('api/"
        $content = $content -replace 'fetch\("/api/', 'apiFetch("api/'
        $content = $content -replace 'fetch\(`/api/', 'apiFetch(`api/'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            $count = ([regex]::Matches($originalContent, "fetch\(['\`"]/api/")).Count
            Write-Host "   ✅ $count appels fetch remplacés"
        } else {
            Write-Host "   ⚠️  Aucune modification nécessaire"
        }
    } else {
        Write-Host "❌ Fichier introuvable: $file"
    }
}

Write-Host "`n🎉 Remplacement terminé! Vérifiez les fichiers modifiés."
