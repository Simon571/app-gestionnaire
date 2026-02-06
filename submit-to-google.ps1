# Script de soumission Google Search Console
# Exécutez ce script après avoir vérifié votre site sur Google Search Console

Write-Host "🔍 Soumission à Google Search Console" -ForegroundColor Cyan
Write-Host ""

$siteUrl = "https://app-gestionnaire.vercel.app"
$sitemapUrl = "$siteUrl/sitemap.xml"

Write-Host "📋 Étapes à suivre :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur Google Search Console :" -ForegroundColor White
Write-Host "   https://search.google.com/search-console" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Ajoutez votre propriété :" -ForegroundColor White
Write-Host "   → Cliquez sur 'Ajouter une propriété'" -ForegroundColor Gray
Write-Host "   → Entrez : $siteUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Vérification (choisissez une méthode) :" -ForegroundColor White
Write-Host "   a) Balise HTML méta - Ajoutez la balise dans src/app/layout.tsx" -ForegroundColor Gray
Write-Host "   b) Fichier HTML - Téléchargez et placez dans public/" -ForegroundColor Gray
Write-Host "   c) Google Analytics (si déjà configuré)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Soumettre le sitemap :" -ForegroundColor White
Write-Host "   → Dans Search Console → Sitemaps" -ForegroundColor Gray
Write-Host "   → Ajoutez : sitemap.xml" -ForegroundColor Gray
Write-Host "   → Cliquez 'Soumettre'" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Demander l'indexation des pages principales :" -ForegroundColor White
Write-Host "   → Search Console → Inspection d'URL" -ForegroundColor Gray
Write-Host "   → Testez ces URLs :" -ForegroundColor Gray
Write-Host "     • $siteUrl/fr" -ForegroundColor DarkGray
Write-Host "     • $siteUrl/en" -ForegroundColor DarkGray
Write-Host "     • $siteUrl/fr/download" -ForegroundColor DarkGray
Write-Host "     • $siteUrl/en/download" -ForegroundColor DarkGray
Write-Host "   → Cliquez 'Demander une indexation' pour chaque URL" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Soumission rapide du sitemap (méthode alternative) :" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ouvrez cette URL dans votre navigateur :" -ForegroundColor White
Write-Host "https://www.google.com/ping?sitemap=$sitemapUrl" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Voulez-vous ouvrir Google Search Console maintenant ? (o/n)"
if ($response -eq "o" -or $response -eq "O") {
    Write-Host ""
    Write-Host "✅ Ouverture de Google Search Console..." -ForegroundColor Green
    Start-Process "https://search.google.com/search-console"
    
    Start-Sleep -Seconds 2
    Write-Host "✅ Ouverture de l'outil de ping sitemap..." -ForegroundColor Green
    Start-Process "https://www.google.com/ping?sitemap=$sitemapUrl"
}

Write-Host ""
Write-Host "📝 Notes importantes :" -ForegroundColor Yellow
Write-Host "   • L'indexation peut prendre 2-7 jours" -ForegroundColor Gray
Write-Host "   • Vérifiez régulièrement dans Search Console" -ForegroundColor Gray
Write-Host "   • Les pages download sont prioritaires pour le SEO" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Guide complet disponible : SEO-GUIDE.md" -ForegroundColor Green
Write-Host ""
