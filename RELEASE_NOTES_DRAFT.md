Release draft — v0.1.0-rc1 (pré-production)

Résumé
- Build: Tauri standalone (Windows)
- Artefacts: `app.exe` (unsigned), `Gestionnaire d'Assemblée_1.0.0_x64_en-US.msi` (unsigned)
- Objectif: tests utilisateurs (installation, UX, compatibilité)

Notes importantes
- Installateurs non signés (SmartScreen peut afficher un avertissement). Ne pas installer sur des machines de production sensibles sans vérification.
- SHA‑256 et taille fournis dans la page de téléchargement pour vérification.

Checklist pour testeurs (non technique)
- Télécharger le fichier `.msi` depuis la Release draft
- Double‑cliquer pour installer
- Ouvrir l'application depuis le menu Démarrer
- Confirmer que l'interface ressemble à la version `npm run tauri:dev`
- Envoyer capture d'écran + output de `Get-FileHash <chemin> -Algorithm SHA256` si problème

Checklist pour l'équipe (tech)
- [ ] Vérifier build MSI sur Windows 10/11 (VM)
- [ ] Exécuter Playwright smoke test (tests/seo/download-windows.spec.ts)
- [ ] Fournir PFX pour signature si OK → CI signera automatiquement
- [ ] Publier Release finale signée et définir `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`

URL utile (à remplacer après publication finale)
- Lien attendu vers l'asset (exemple) :
  `https://github.com/Simon571/app-gestionnaire/releases/download/v0.1.0-rc1/Gestionnaire_d_Assemblee_1.0.0_x64_en-US.msi`

Message court à envoyer aux testeurs
> Bonjour — la version de test v0.1.0-rc1 est disponible en téléchargement. Installez le fichier `.msi`, lancez l'application et vérifiez que l'interface et les fonctionnalités de base fonctionnent. Signalez toute anomalie (capture d'écran + SHA‑256). Merci !
