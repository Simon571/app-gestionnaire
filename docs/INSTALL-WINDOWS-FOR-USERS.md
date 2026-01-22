Titre: Installer l'application (Windows) — guide simple

But : aider un utilisateur non technique à installer l'application et vérifier que tout fonctionne.

Étapes (très simples)
1) Télécharger
   - Cliquez sur le bouton « Télécharger » depuis la page "Windows" (ou sur le lien fourni par le maintienuer).
   - Vous obtiendrez un fichier `.msi` (recommandé) ou `.exe`.

2) Exécution du programme d'installation
   - Double‑cliquez le fichier `.msi` téléchargé.
   - Si Windows affiche un avertissement de sécurité :
     - Cliquez sur « Plus d'infos » → puis « Exécuter quand même » (seulement si vous faites confiance à l'éditeur).

3) Lancement et vérification
   - Ouvrez le menu Démarrer et tapez « Gestionnaire d'Assemblée » et lancez l'application.
   - L'application doit s'ouvrir et afficher l'interface (identique au mode dev).

4) Vérifier la somme de contrôle (optionnel, pour sécurité)
   - Ouvrez PowerShell et exécutez :
     Get-FileHash $HOME\Downloads\nom-fichier.msi -Algorithm SHA256
   - Comparez la valeur affichée avec la SHA‑256 fournie sur la page de téléchargement.

5) Que faire si Windows affiche un avertissement
   - Vérifiez que vous avez téléchargé depuis la page officielle (URL du dépôt GitHub du projet).
   - Si l'éditeur n'est pas reconnu et que vous ne voulez pas risquer : ne pas installer et contactez le mainteneur.

Support
- Si vous avez besoin d'aide, envoyez une capture d'écran du message Windows et la version du fichier (nom-fichier.msi). Le mainteneur pourra vous répondre et fournir une version signée pour la publication finale.

Conseil final pour non-techs
- Pour un usage courant : installez le MSI, lancez l'app, et gardez une sauvegarde de vos données. Pour une distribution publique « one‑click » sans avertissement, la version doit être signée numériquement (le mainteneur s'en chargera avant publication finale).