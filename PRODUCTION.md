# Guide de Production - App Gestionnaire

## 🚀 Démarrage en Production

### Prérequis
- Node.js 18+ installé
- Variables d'environnement configurées (.env.production)

### Lancement

```powershell
# Démarrer le serveur en mode production
npm start
```

Le serveur démarrera sur `http://0.0.0.0:3000`

## 📱 Application Flutter

L'APK production est disponible dans:
```
flutter_app/build/app/outputs/flutter-apk/app-release.apk
```

### Installation sur Android
1. Transférer l'APK sur l'appareil
2. Activer "Sources inconnues" dans les paramètres
3. Installer l'APK

## ⚙️ Variables d'Environnement

Les variables suivantes sont requises dans `.env.production`:

```env
GEMINI_API_KEY=your_api_key_here
VCM_IMPORT_SECRET=your_secret_here
NEXT_PUBLIC_ENABLE_AI=1
NODE_ENV=production
```

## 🔧 Configuration

- **Port**: 3000 (par défaut)
- **Mode**: Production
- **Build**: Standalone
- **Optimisations**: Activées

## 📊 Fonctionnalités Activées

✅ Tableaux d'affichage (Assemblée, Anciens, Anciens et Assistants)
✅ Synchronisation Publisher App (Flutter)
✅ Gestion des proclamateurs
✅ Programme VCM
✅ Rapports de prédication
✅ Groupes de prédication
✅ Notifications bulletin board
✅ Visualisation documents (PDF, images)
✅ Intelligence Artificielle (Gemini)

## 🛡️ Sécurité

- Authentification sécurisée
- Chiffrement des données sensibles
- Headers de sécurité configurés
- CORS configuré pour production

## 📝 Logs

Les logs sont disponibles dans la console du serveur.

## 🔄 Mise à Jour

Pour mettre à jour l'application:

```powershell
# 1. Récupérer les dernières modifications
git pull

# 2. Installer les dépendances
npm install

# 3. Rebuild
npm run build

# 4. Redémarrer le serveur
npm start
```

## 🏗️ Build Flutter

Pour reconstruire l'APK Flutter:

```powershell
cd flutter_app
flutter clean
flutter pub get
flutter build apk --release
```

## ⚡ Performance

- Mode production optimisé
- Tree-shaking activé
- Images optimisées
- Bundle JavaScript minifié
- Standalone deployment

## 📞 Support

Pour toute question ou problème, vérifier les logs du serveur et de l'application mobile.
