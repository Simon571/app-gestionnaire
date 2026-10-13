# �️ Installation d'Admin d'Assemblée - Desktop Uniquement

> ⚠️ **Cette application est conçue pour les ordinateurs de bureau uniquement.**

## 📋 Prérequis

- Node.js 18+ ([Télécharger](https://nodejs.org/))
- npm ou yarn
- Un navigateur moderne (Chrome, Edge, Firefox, Safari)
- 200 MB d'espace disque

## 🚀 Installation Rapide

### Étape 1 : Cloner ou télécharger le projet
```bash
# Clone from git (si vous avez accès)
git clone <repository-url>
cd app-gestionnaire

# OU téléchargez le ZIP et décompressez
```

### Étape 2 : Installer les dépendances
```bash
npm install
```

### Étape 3 : Configuration environment
```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Éditer .env.local avec vos paramètres
nano .env.local  # ou votre éditeur
```

**Configuration de base :**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=<votre-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre-clé-anon>
```

### Étape 4 : Démarrer l'application

**Mode Développement :**
```bash
npm run dev
```
Ouvrez http://localhost:3000 dans votre navigateur

**Mode Production :**
```bash
npm run build
npm run start
```

## 💾 Installation Sur Ordinateur Local

### Option 1 : Raccourci Desktop (Windows)

1. Ouvrez l'application dans Chrome/Edge
2. Trois points (⋮) → "Installer Admin d'Assemblée"
3. Confirmez
4. Un raccourci s'ajoute à votre Desktop

### Option 2 : Ajouter aux Applications (Windows)

1. Ouvrez PowerShell en tant qu'administrateur
2. Exécutez :
```powershell
# Créer un raccourci
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Admin d'Assemblée.lnk")
$Shortcut.TargetPath = "C:\path\to\app-gestionnaire\start.bat"
$Shortcut.Save()
```

### Option 3 : Startup Automatique

Créez un fichier `start.bat` :
```batch
@echo off
cd C:\path\to\app-gestionnaire
npm run dev
start http://localhost:3000
```

Double-cliquez sur le fichier pour lancer l'application.

## � Configuration Desktop

### Lancer au démarrage de Windows

1. Créez `start.bat` (voir ci-dessus)
2. Appuyez sur `Win + R` et tapez : `shell:startup`
3. Copiez le fichier `.bat` dans le dossier Startup
4. L'application démarrera automatiquement avec Windows

### Créer un Raccourci Desk (Windows)

1. Clic droit sur le Desktop
2. Nouveau → Raccourci
3. Entrez : `C:\path\to\app-gestionnaire\start.bat`
4. Nommez-le "Admin d'Assemblée"
5. Cliquez sur Terminer

### macOS - Créer une Application

```bash
# Créer une app macOS
mkdir -p Admin\ d\'Assemblée.app/Contents/{MacOS,Resources}

# Créer le script de lancement
cat > Admin\ d\'Assemblée.app/Contents/MacOS/run << 'EOF'
#!/bin/bash
cd /path/to/app-gestionnaire
npm run dev &
sleep 3
open http://localhost:3000
EOF

chmod +x Admin\ d\'Assemblée.app/Contents/MacOS/run
```

### Linux - Ajouter aux Applications

Créez `/usr/share/applications/admin-assemblee.desktop` :
```ini
[Desktop Entry]
Type=Application
Name=Admin d'Assemblée
Exec=/path/to/app-gestionnaire/start.sh
Icon=application-icon
Categories=Office;
```

## 🚀 Déploiement en Production

### Déployer sur VPS/Serveur

```bash
# 1. Build l'application
npm run build

# 2. Démarrer avec PM2
npm install -g pm2
pm2 start "npm run start" --name "admin-assemblee"
pm2 save
pm2 startup
```

### Docker (Optionnel)

Créez `Dockerfile` :
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./
COPY public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
```

Build :
```bash
docker build -t admin-assemblee .
docker run -p 3000:3000 admin-assemblee
```

## 🔒 Sécurité Desktop

✅ **Bonnes pratiques :**
- Utilisez HTTPS en production
- Activez le firewall Windows/macOS
- Mettez à jour Node.js régulièrement
- Utilisez un VPN si accès à distance

## 📊 Commandes Utiles

```bash
# Développement
npm run dev          # Démarrer dev server
npm run build        # Compiler pour production
npm run start        # Démarrer l'app compilée
npm run lint         # Vérifier le code
npm run type-check   # Vérifier les types TypeScript

# Database
npm run db:push      # Mettre à jour la base de données
npm run db:generate  # Générer les types Prisma
```

## 🐛 Dépannage

### Port 3000 déjà utilisé
```bash
# Utilisez un autre port
PORT=3001 npm run dev
```

### npm install échoue
```bash
# Nettoyez le cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Application ne démarre pas
```bash
# Vérifiez les erreurs
npm run dev -- --verbose
```

## 📝 Notes de Configuration

### Fichier `.env.local` Important
Ne committez JAMAIS ce fichier. Il contient des secrets.

### Base de données
L'application utilise Supabase. Configurez :
- PostgreSQL connection string
- API keys
- Authentification

### Authentification
L'app utilise JWT avec chiffrement AES-256. Voir `SECURITY.md` pour détails.

## 🆘 Support

- Consultez `README.md` pour la documentation complète
- Consultez `SECURITY.md` pour la sécurité
- Consultez `ARCHITECTURE-MULTI-NIVEAUX.md` pour l'architecture

## ✨ Points Clés

✅ **Application Desktop Only** - Conçue pour ordinateurs  
✅ **Pas de Mobile** - Optimisée pour écrans > 1024px  
✅ **Sécurisée** - Chiffrement AES-256 + JWT  
✅ **Offline-Ready** - Cache local pour données critiques  
✅ **Mises à jour faciles** - Git pull + npm run build

