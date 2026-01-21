# CHANGELOG

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2026-01-18

### ✨ Ajouté

#### Application Desktop
- Application Windows native avec Tauri 2.0
- Interface identique entre mode dev et production
- Installation via fichiers `.msi` et `.exe`
- Stockage local des données (pas de cloud requis)

#### Site Web
- Page de téléchargement SEO-optimisée
- Bouton de téléchargement intelligent avec détection Windows
- Redirection automatique vers GitHub Releases
- Design responsive (desktop, tablet, mobile)

#### Fonctionnalités
- Gestion complète de l'assemblée
- Planification VCM automatisée
- Rapports de prédication
- Gestion des territoires
- Tableaux de bord avec statistiques
- Support multilingue (français, anglais)

#### SEO & Performance
- Meta tags Open Graph complets
- Sitemap XML généré automatiquement
- Fichier robots.txt configuré
- Images optimisées
- Performance > 90 sur PageSpeed Insights

#### Documentation
- Guide de démarrage rapide (5 minutes)
- Guide de déploiement complet
- Checklist de déploiement
- README de production
- Scripts automatisés (build-tauri.ps1, deploy-vercel.ps1)

#### Configuration
- Configuration Tauri optimisée
- Configuration Next.js double (Tauri + Vercel)
- Scripts npm pour tous les cas d'usage
- .gitignore complet

### 🔧 Technique

- Next.js 15.3.3 avec App Router
- React 18.3.1
- TypeScript 5.9.2
- Tauri 2.7.1
- Tailwind CSS 3.4.1
- shadcn/ui avec Radix UI
- next-intl pour l'internationalisation

### 🚀 Déploiement

- Vercel pour l'hébergement web
- GitHub Releases pour la distribution Windows
- Build automatisé avec scripts PowerShell

---

## [Unreleased]

### 🔮 Prévu pour les prochaines versions

- Support macOS et Linux
- Mode sombre/clair
- Export PDF des rapports
- Synchronisation cloud optionnelle
- Application mobile (Flutter)
- Notifications de mise à jour automatique
- Sauvegarde automatique

---

## Types de changements

- `✨ Ajouté` : nouvelles fonctionnalités
- `🔧 Modifié` : changements aux fonctionnalités existantes
- `🐛 Corrigé` : corrections de bugs
- `🗑️ Supprimé` : fonctionnalités retirées
- `🔒 Sécurité` : corrections de vulnérabilités
- `📝 Documentation` : changements uniquement dans la documentation
- `🚀 Performance` : améliorations de performance

---

**[1.0.0]**: https://github.com/VOTRE-USERNAME/app-gestionnaire/releases/tag/v1.0.0
