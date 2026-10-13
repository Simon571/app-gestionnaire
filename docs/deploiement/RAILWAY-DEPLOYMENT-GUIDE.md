# Guide de Déploiement sur Railway

## 📋 Prérequis

- Compte Railway (https://railway.app)
- Git configuré et repository GitHub
- Application pushée sur GitHub

## 🚀 Étapes de Déploiement

### 1. Préparer votre repository GitHub

Assurez-vous que votre code est pushé sur GitHub :

```bash
git add .
git commit -m "Prêt pour le déploiement sur Railway"
git push origin main
```

### 2. Créer un compte et connecter Railway

1. Allez sur https://railway.app
2. Cliquez sur "Sign up"
3. Connectez-vous avec GitHub (recommandé)
4. Autorisez Railway à accéder à vos repositories

### 3. Créer un nouveau projet sur Railway

1. Dans le dashboard Railway, cliquez sur "+ New Project"
2. Sélectionnez "Deploy from GitHub"
3. Choisissez votre repository `app-gestionnaire`
4. Railway va automatiquement détecter qu'il s'agit d'une application Next.js

### 4. Configurer les variables d'environnement

Railway devrait créer automatiquement un service Node.js. Cliquez sur le service et allez dans "Variables" :

**Variables essentielles à configurer :**

```
NODE_ENV=production
```

**Si vous utilisez Supabase (Firebase/Auth) :**
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Si vous utilisez Firebase :**
```
NEXT_PUBLIC_FIREBASE_API_KEY=votre_clé
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

**Pour les APIs internes :**
```
API_SECRET_KEY=votre_clé_secrète
NEXT_PUBLIC_API_URL=https://votre-app.railway.app
```

### 5. Vérifier la configuration du build

Railway devrait détecter automatiquement :
- **Start command** : `npm start`
- **Build command** : `npm run build`

Si ce n'est pas configuré, allez dans "Settings" du service :

1. Cherchez "Build Command"
   - Définissez à : `npm run build`

2. Cherchez "Start Command"
   - Définissez à : `npm start`

### 6. Déployer l'application

1. Cliquez sur le bouton "Deploy"
2. Railway va automatiquement :
   - Cloner votre repo
   - Installer les dépendances (`npm install`)
   - Builder l'app (`npm run build`)
   - Lancer l'app (`npm start`)

3. Attendez que le déploiement soit terminé

### 7. Configurer le domaine

1. Dans votre service Railway, allez dans "Settings"
2. Cherchez "Domains"
3. Cliquez sur "+ Generate Domain"
4. Railroad va créer un domaine `.railway.app` automatiquement

**Pour utiliser un domaine personnalisé :**
1. Cliquez sur "+ Add Custom Domain"
2. Entrez votre domaine (ex: `app.mon-domaine.com`)
3. Configurez les DNS de votre registraire vers Railway
4. Railway fournira les instructions spécifiques

### 8. Monitoring et Logs

- Allez dans l'onglet "Logs" pour voir les logs de votre application
- Vérifiez que l'application démarre correctement
- Cherchez les erreurs liées aux variables d'environnement ou aux dépendances

---

## 🔧 Dépannage Courant

### L'app ne démarre pas
- ✅ Vérifiez les logs (onglet "Logs")
- ✅ Vérifiez que toutes les variables d'environnement sont définies
- ✅ Vérifiez que le build command est correct

### Build échoue
- ✅ Vérifiez qu'il n'y a pas d'erreurs TypeScript
- ✅ Assurez-vous que `npm run build` fonctionne localement
- ✅ Vérifiez que toutes les dépendances sont dans `package.json`

### Connection timeout
- ✅ Railway peut être lent lors du premier déploiement
- ✅ Attendez 2-3 minutes
- ✅ Vérifiez que l'app n'est pas en boucle infinie

### Port not available
- ✅ Railway assigne automatiquement un port via la variable `PORT`
- ✅ Next.js démarre par défaut sur le port défini par Railway

---

## 📊 Après le Déploiement

### Activer les mises à jour automatiques

1. Dans votre service Railway
2. Allez dans "Settings"
3. Cherchez "Automatic Deployments"
4. Activez "Deploy on push to main"

Maintenant, chaque `git push` vers `main` déploiera automatiquement votre app !

### Ajouter une base de données

Si vous avez besoin d'une base de données :

1. Dans votre projet Railway
2. Cliquez sur "+ Add Service"
3. Choisissez :
   - PostgreSQL (recommandé)
   - MySQL
   - MongoDB

Railway auto-lieras les variables d'environnement !

### Surveiller les coûts

- Railway facture à l'usage (très économique au démarrage)
- Vous avez ~5$ de crédit gratuit par mois
- Consultez l'onglet "Billing" pour voir votre consommation

---

## 🎯 Configuration Optimale pour votre App

Votre `next.config.ts` a déjà `output: 'standalone'`, ce qui est parfait pour Railway !

Aucune configuration supplémentaire n'est nécessaire.

---

## 📞 Support & Ressources

- Documentation Railway : https://docs.railway.app
- Documentation Next.js : https://nextjs.org/docs
- Support Railway : https://discord.com/invite/railway

---

## ✅ Checklist de Déploiement

- [ ] Repository pushé sur GitHub
- [ ] Compte Railway créé et lié à GitHub
- [ ] Nouveau projet créé et connecté
- [ ] Variables d'environnement configurées
- [ ] Build et start commands vérifiées
- [ ] Déploiement lancé avec succès
- [ ] Tests de l'app en production
- [ ] Domaine configuré (optionnel)
- [ ] Logs vérifiés (pas d'erreurs critiques)
- [ ] Auto-déploiement activé

---

## 🚀 Prochaines Étapes

Une fois le déploiement réussi :
1. Testez toutes les fonctionnalités critiques
2. Configurez les certificats SSL (Railway les génère automatiquement)
3. Mettez en place du monitoring
4. Planifiez les sauvegardes si vous utilisez une BD
