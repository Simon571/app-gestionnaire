# 🏠 Gestionnaire d'Assemblée

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/VOTRE-USERNAME/app-gestionnaire/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://github.com/VOTRE-USERNAME/app-gestionnaire/releases)

Une application de gestion complète pour les assemblées de Témoins de Jéhovah. Développée avec Next.js et Tauri pour offrir des performances natives sur Windows.

## ✨ Fonctionnalités

- 📅 **Planification VCM** - Gestion automatisée des réunions Vie et Ministère
- 📊 **Rapports de prédication** - Suivi et analyse des activités de prédication
- 🗺️ **Gestion des territoires** - Organisation et attribution des territoires
- 👥 **Gestion des proclamateurs** - Base de données complète
- 📈 **Tableaux de bord** - Visualisation des statistiques et tendances
- 🔒 **Sécurité locale** - Toutes les données restent sur votre ordinateur

## 🚀 Démarrage rapide

### Pour les utilisateurs

**[📥 Télécharger l'application Windows](https://github.com/VOTRE-USERNAME/app-gestionnaire/releases/latest)**

Ou visitez notre site : **[votre-domaine.vercel.app/fr/download](https://votre-domaine.vercel.app/fr/download)**

### Pour les développeurs

#### Prérequis

- Node.js 18+
- Rust (pour Tauri)
- Git

#### Installation

```powershell
# Cloner le repository
git clone https://github.com/VOTRE-USERNAME/app-gestionnaire.git
cd app-gestionnaire

# Installer les dépendances
npm install

# Lancer en mode développement
npm run tauri:dev
```

## 📖 Documentation

- **[🚀 DEMARRAGE-RAPIDE.md](DEMARRAGE-RAPIDE.md)** - Testez en 5 minutes
- **[📘 GUIDE-DEPLOIEMENT-COMPLET.md](GUIDE-DEPLOIEMENT-COMPLET.md)** - Guide détaillé de déploiement
- **[✅ CHECKLIST-DEPLOIEMENT.md](CHECKLIST-DEPLOIEMENT.md)** - Liste de vérification

## 🛠️ Technologies utilisées

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Desktop**: Tauri 2.0
- **Hébergement**: Vercel (site web) + GitHub Releases (application)

## 📦 Scripts disponibles

### Développement

```powershell
npm run dev           # Lancer Next.js en mode dev
npm run tauri:dev     # Lancer l'application Tauri en dev
```

### Production

```powershell
npm run build:tauri   # Build Next.js pour Tauri (export statique)
npm run build:vercel  # Build Next.js pour Vercel
npm run tauri:build   # Build complet de l'application Windows
```

### Scripts automatiques

```powershell
.\build-tauri.ps1     # Build automatique de l'application Windows
.\deploy-vercel.ps1   # Déploiement automatique sur Vercel
```

## 🏗️ Architecture

```
app-gestionnaire/
├── src/                      # Code source Next.js
│   ├── app/                  # Pages et routes Next.js
│   │   ├── [locale]/        # Pages internationalisées
│   │   │   └── download/    # Page de téléchargement
│   │   ├── robots.ts        # Configuration robots.txt
│   │   └── sitemap.ts       # Génération sitemap
│   ├── components/          # Composants React
│   └── lib/                 # Utilitaires
├── src-tauri/               # Code source Tauri
│   ├── src/                 # Code Rust
│   ├── icons/               # Icônes de l'application
│   └── tauri.conf.json      # Configuration Tauri
├── public/                  # Assets statiques
├── next.config.ts           # Config Next.js (Vercel)
├── next.config.tauri.ts     # Config Next.js (Tauri)
└── package.json             # Dépendances et scripts
```

## 🔄 Workflow de déploiement

### 1. Build de l'application Windows

```powershell
.\build-tauri.ps1
```

Fichiers générés dans `src-tauri/target/release/bundle/`

### 2. Publier sur GitHub Releases

```powershell
git tag v1.0.0
git push origin v1.0.0
```

Puis créer une release sur GitHub avec les fichiers `.msi` et `.exe`

### 3. Déployer le site web sur Vercel

```powershell
.\deploy-vercel.ps1
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- [Next.js](https://nextjs.org/) - Framework React
- [Tauri](https://tauri.app/) - Framework d'applications desktop
- [shadcn/ui](https://ui.shadcn.com/) - Composants UI
- [Vercel](https://vercel.com/) - Hébergement web

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/VOTRE-USERNAME/app-gestionnaire/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/VOTRE-USERNAME/app-gestionnaire/discussions)

## ⭐ Star History

Si ce projet vous aide, pensez à lui donner une étoile ⭐

---

**Développé avec ❤️ pour la communauté des Témoins de Jéhovah**
