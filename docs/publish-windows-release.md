# Publier l'installateur Windows (rapide)

Petit guide pour publier une release Windows et faire apparaître le bouton **Télécharger** sur la page publique.

Pré-requis
- Compte GitHub with repo maintainer rights
- Windows build environment (voir `build-tauri.ps1`)
- Certificat de signature (recommandé)

Étapes (résumé)
1. Générer l'installateur
   - PowerShell: `.
   build-tauri.ps1 -p windows` (voir script du dépôt)
2. Signer l'exécutable / MSI (recommandé)
   - SignTool or osslsigncode — gardez la clé en sécurité
3. Créer une GitHub Release
   - Tag propre (ex: `v1.2.3`), release notes courtes
   - Joindre les fichiers `.exe` et/ou `.msi`
4. Mettre à jour l'URL publique (option A ou B)
   - Option A (recommandée): définir `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL` dans Vercel / env de production vers l'URL directe de l'asset GitHub
   - Option B: laisser pointer vers la page Releases (par défaut)
5. Vérifier en local / CI
   - `npm run build:vercel` puis `npm run start` (ou prévisualiser sur Vercel)
   - Playwright: `pnpm test --project=chromium tests/seo/download-windows.spec.ts`

Checklist rapide ✅
- [ ] Build `.exe`/`.msi` généré
- [ ] Binaire signé
- [ ] Asset uploadé dans GitHub Release
- [ ] `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL` mis à jour en production
- [ ] E2E Playwright et build CI réussis

Dépannage
- Si Google n'indexe pas la page: vérifier `sitemap.xml` et `metadata` (hreflang)
- Si le fichier ne se télécharge pas: s'assurer que l'asset GitHub est public et que `Content-Disposition` est présent

Notes
- Pour des raisons de SEO, préférez fournir une URL directe vers l'asset (ex: `https://github.com/OWNER/REPO/releases/download/vX.Y.Z/app-setup.exe`) et renseigner `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`.