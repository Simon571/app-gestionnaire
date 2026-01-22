# 🚀 GUIDE DE CONFIGURATION VERCEL

## ✅ Déploiement Terminé!

Votre application est déployée sur: **https://app-gestionnaire.vercel.app**

---

## 📝 ÉTAPE 1: Configurer les Variables d'Environnement

### 1.1 Aller sur le Dashboard Vercel

1. Ouvrez: https://vercel.com/nzamba-simons-projects/app-gestionnaire
2. Cliquez sur **Settings** (dans le menu du haut)
3. Dans le menu latéral, cliquez sur **Environment Variables**

### 1.2 Ajouter les Variables Suivantes

Cliquez sur **Add New** pour chaque variable:

#### Variable 1: NEXT_PUBLIC_SITE_URL
```
Key: NEXT_PUBLIC_SITE_URL
Value: https://app-gestionnaire.vercel.app
Environment: Production, Preview, Development (cochez les 3)
```

#### Variable 2: NEXT_PUBLIC_API_URL
```
Key: NEXT_PUBLIC_API_URL
Value: https://app-gestionnaire.vercel.app
Environment: Production, Preview, Development (cochez les 3)
```

#### Variable 3: NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL (à ajouter plus tard)
```
Key: NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL
Value: [Lien GitHub Release MSI - à remplir après avoir créé la release]
Environment: Production, Preview, Development
```

### 1.3 Sauvegarder

Après avoir ajouté toutes les variables, cliquez sur **Save**

---

## 🔄 ÉTAPE 2: Redéployer l'Application

Une fois les variables ajoutées, il faut redéployer pour qu'elles soient prises en compte:

### Option A: Depuis le Dashboard Vercel (Recommandé)
1. Allez sur **Deployments**
2. Cliquez sur le déploiement le plus récent
3. Cliquez sur **⋯** (trois points) en haut à droite
4. Sélectionnez **Redeploy**
5. Confirmez

### Option B: Depuis le Terminal
```powershell
cd C:\Users\Public\Documents\app-gestionnaire
vercel --prod
```

⏱️ **Attendez 2-3 minutes** que le redéploiement se termine.

---

## 🧪 ÉTAPE 3: Tester l'Application

### 3.1 Tester le Site Web

1. Ouvrez: https://app-gestionnaire.vercel.app
2. Vérifiez que la page d'accueil s'affiche correctement
3. Testez la connexion (si vous avez des credentials)

### 3.2 Tester la Page de Téléchargement

1. Allez sur: https://app-gestionnaire.vercel.app/fr/download
2. Vérifiez que la page s'affiche
3. **Note**: Le bouton de téléchargement Windows n'apparaîtra qu'après avoir créé la GitHub Release (Étape 4)

---

## 📦 ÉTAPE 4: Créer la GitHub Release

### 4.1 Calculer le SHA-256 du MSI

```powershell
$msi = Get-Item "C:\Users\Public\Documents\app-gestionnaire\src-tauri\target\release\bundle\msi\Gestionnaire d'Assemblée_1.0.0_x64_en-US.msi"
$hash = (Get-FileHash $msi.FullName -Algorithm SHA256).Hash
Write-Host "SHA-256: $hash"
```

**Copiez ce hash**, vous en aurez besoin!

### 4.2 Créer la Release sur GitHub

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Releases** (dans le menu latéral)
3. Cliquez sur **Draft a new release**

**Remplissez:**

- **Tag**: `v1.0.0`
- **Title**: `Version 1.0.0 - Application Windows`
- **Description**:
```markdown
## 📥 Télécharger l'Application Windows

### Installation Rapide
1. Téléchargez le fichier `.msi` ci-dessous
2. Double-cliquez pour installer
3. Lancez depuis le Menu Démarrer

### ⚠️ Avertissement Windows
Windows affichera "Application non reconnue" car elle n'est pas signée.
- Cliquez sur **"Plus d'infos"**
- Puis **"Exécuter quand même"**

### 🔒 Vérification SHA-256
```
COLLEZ_LE_HASH_ICI
```

### 📱 Synchronisation Mobile
L'application se connecte automatiquement au serveur cloud pour la synchronisation mobile.

### 🌐 Application Web
Accédez aussi à l'application web: https://app-gestionnaire.vercel.app
```

4. **Attachez le fichier MSI**:
   - Cliquez sur "Attach binaries by dropping them here or selecting them"
   - Sélectionnez: `src-tauri\target\release\bundle\msi\Gestionnaire d'Assemblée_1.0.0_x64_en-US.msi`

5. **Publiez**: Cliquez sur **Publish release**

### 4.3 Copier le Lien Direct du MSI

1. Une fois la release publiée, faites **clic-droit sur le fichier MSI**
2. Sélectionnez **"Copier l'adresse du lien"**
3. Le lien ressemble à:
   ```
   https://github.com/VOTRE-USERNAME/app-gestionnaire/releases/download/v1.0.0/Gestionnaire.dAssemblee_1.0.0_x64_en-US.msi
   ```

---

## 🔗 ÉTAPE 5: Ajouter l'URL de Téléchargement sur Vercel

### 5.1 Retour sur Vercel

1. Retournez sur: https://vercel.com/nzamba-simons-projects/app-gestionnaire
2. **Settings** → **Environment Variables**
3. Ajoutez la variable:

```
Key: NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL
Value: [COLLEZ LE LIEN DU MSI COPIÉ À L'ÉTAPE 4.3]
Environment: Production, Preview, Development
```

### 5.2 Redéployer à Nouveau

Redéployez l'application (voir Étape 2) pour que le bouton de téléchargement apparaisse.

---

## ✅ ÉTAPE 6: Test Final Complet

### 6.1 Tester le Téléchargement depuis le Site

1. Allez sur: https://app-gestionnaire.vercel.app/fr/download
2. **Le bouton "Télécharger pour Windows" devrait maintenant être visible**
3. Cliquez dessus
4. Le MSI devrait se télécharger depuis GitHub

### 6.2 Tester l'Installation

1. Ouvrez le MSI téléchargé
2. Windows va afficher un avertissement → **"Plus d'infos"** → **"Exécuter quand même"**
3. Suivez l'assistant d'installation
4. Lancez l'application depuis le Menu Démarrer

### 6.3 Vérifier la Connexion API

Dans l'application desktop:
1. Ouvrez les **DevTools** (F12)
2. Allez dans l'onglet **Network**
3. Effectuez une action (ex: charger des données)
4. **VÉRIFIEZ**: Les requêtes doivent aller vers `https://app-gestionnaire.vercel.app/api/...`
5. Si oui → ✅ Tout fonctionne!

---

## 📊 RÉCAPITULATIF DES URLs

- 🌐 **Site Web**: https://app-gestionnaire.vercel.app
- 📥 **Page Download**: https://app-gestionnaire.vercel.app/fr/download
- 🔍 **Dashboard Vercel**: https://vercel.com/nzamba-simons-projects/app-gestionnaire
- 🐙 **GitHub Releases**: https://github.com/VOTRE-USERNAME/app-gestionnaire/releases

---

## 🆘 DÉPANNAGE

### Le bouton de téléchargement n'apparaît pas
- Vérifiez que `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL` est configuré sur Vercel
- Vérifiez que vous avez redéployé après avoir ajouté la variable
- Videz le cache du navigateur (Ctrl+Shift+R)

### L'application Windows ne se connecte pas
- Vérifiez que Vercel est bien déployé
- Ouvrez les DevTools (F12) et vérifiez les erreurs dans la Console
- Vérifiez que les URLs dans les requêtes pointent vers Vercel

### Erreur 404 sur le téléchargement
- Vérifiez que le lien GitHub Release est correct
- Assurez-vous que la release est publique (pas en brouillon)

---

## 🎉 FÉLICITATIONS!

Votre application est maintenant:
- ✅ Déployée sur Vercel
- ✅ Téléchargeable via GitHub Releases
- ✅ Accessible à tous les utilisateurs
- ✅ Synchronisation mobile opérationnelle

**Partagez le lien**: https://app-gestionnaire.vercel.app 🚀
