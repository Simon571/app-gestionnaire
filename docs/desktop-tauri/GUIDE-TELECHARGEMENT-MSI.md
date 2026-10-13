# Configuration du Téléchargement Windows sur Vercel

## ✅ Problème résolu

La page de téléchargement essayait d'accéder à `/Gestionnaire-setup.msi` localement, mais les fichiers MSI sont exclus du déploiement Vercel (`.vercelignore`).

## 🔧 Solution mise en place

### 1. Route API de redirection
Créé `/api/download/windows` qui redirige vers GitHub Releases :
- Utilise la variable d'environnement `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`
- Par défaut : `https://github.com/Simon571/app-gestionnaire/releases/latest/download/Gestionnaire-setup.msi`
- Permet le suivi des téléchargements et la flexibilité

### 2. Composants mis à jour
- `download-portal.tsx` : Utilise `/api/download/windows`
- `download-button.tsx` : Utilise la même configuration
- Les deux composants sont maintenant alignés

### 3. Variables d'environnement

Ajoutez dans **Vercel Dashboard → Settings → Environment Variables** :

```env
# URL directe du fichier MSI sur GitHub Releases
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL=https://github.com/Simon571/app-gestionnaire/releases/latest/download/Gestionnaire-setup.msi

# Métadonnées (optionnel)
NEXT_PUBLIC_WINDOWS_DOWNLOAD_SIZE=150 MB
NEXT_PUBLIC_WINDOWS_SIGNED=false
```

## 📝 Configuration GitHub Release

### Option A : Utiliser `/latest/download/`
```
https://github.com/Simon571/app-gestionnaire/releases/latest/download/Gestionnaire-setup.msi
```
✅ Avantage : Toujours le dernier fichier
⚠️ Important : Le nom du fichier doit être constant (`Gestionnaire-setup.msi`)

### Option B : Version spécifique
```
https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.0/Gestionnaire-setup.msi
```
✅ Avantage : Version fixe, prévisible

## 🚀 Déploiement

1. **Poussez les changements sur GitHub**
   ```powershell
   git add .
   git commit -m "Fix: Téléchargement MSI via GitHub Releases"
   git push
   ```

2. **Configurez Vercel** (Dashboard)
   - Ajoutez la variable `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`
   - Redéployez le site

3. **Créez un GitHub Release** avec votre fichier MSI
   - Le fichier doit s'appeler `Gestionnaire-setup.msi`
   - Ou modifiez l'URL dans les variables d'environnement

## 🧪 Test

Après déploiement :
1. Visitez `https://votre-site.vercel.app/fr/download`
2. Cliquez sur "Télécharger pour Windows"
3. Devrait rediriger vers GitHub et télécharger le MSI

## 🔗 URLs importantes

- Page de téléchargement : `/fr/download` ou `/en/download`
- API de redirection : `/api/download/windows`
- GitHub Releases : `https://github.com/Simon571/app-gestionnaire/releases`

## 📦 Structure

```
src/
├── app/
│   ├── [locale]/download/
│   │   └── page.tsx         → Page de téléchargement
│   └── api/download/windows/
│       └── route.ts         → API de redirection (NOUVEAU)
└── components/marketing/
    ├── download-portal.tsx  → Interface principale (MIS À JOUR)
    └── download-button.tsx  → Bouton de téléchargement (MIS À JOUR)
```

## ⚠️ Points d'attention

1. **Nom du fichier MSI** : Doit être constant si vous utilisez `/latest/download/`
2. **GitHub Release** : Doit être public pour permettre le téléchargement
3. **Variables Vercel** : Doivent être définies pour `Production`, `Preview` et `Development`

## 🎯 Prochaines étapes

- [ ] Créer un GitHub Release avec le fichier MSI
- [ ] Configurer les variables d'environnement sur Vercel
- [ ] Tester le téléchargement après redéploiement
- [ ] (Optionnel) Configurer les métadonnées (taille, SHA256)
