# Icône "Maison" de l'Application

## 📋 Résumé

Une nouvelle icône personnalisée avec une maison au milieu a été créée et intégrée à l'application "Admin d'Assemblée". L'icône utilise un design moderne avec un gradient bleu et est disponible en plusieurs formats et tailles.

## 📁 Fichiers Créés/Générés

### SVG Original
- `public/icon-house.svg` - Fichier SVG source avec la maison

### Icônes PWA (Web)
- `public/icons/icon-192x192.png` - Pour PWA 
- `public/icons/icon-144x144.png` - Pour Android
- `public/icons/icon-180x180.png` - Pour iOS/Apple
- `public/icons/icon-512x512.png` - Grande taille pour PWA

### Icônes Tauri (Desktop/Système d'exploitation)
- `src-tauri/icons/32x32.png` - Petite icône de la barre des tâches
- `src-tauri/icons/128x128.png` - Icône standard Linux
- `src-tauri/icons/128x128@2x.png` - Icône Retina (256x256)
- `src-tauri/icons/Square*.png` - Icônes Windows pour le Store

### Manifest et Configuration
- `public/manifest.webmanifest` - Manifeste PWA avec références aux icônes
- `src/app/layout.tsx` - Métadonnées d'icônes et tags HTML
- `scripts/generate-house-icon.js` - Script de génération des icônes PNG
- `scripts/generate-windows-icons.js` - Script pour icônes Windows supplémentaires

## 🎨 Caractéristiques de l'Icône

- **Couleurs**: Gradient bleu moderne (de #3B82F6 à #1E40AF)
- **Éléments**: Maison blanche avec:
  - Toit triangulaire
  - Cheminée grise
  - Fenêtres bleu ciel
  - Porte marron
  - Fondation grise
  - Ombre subtile pour profondeur

## 🔧 Scripts Disponibles

Pour régénérer les icônes si vous modifiez le fichier SVG:
```bash
npm run generate:icons
```

Cela exécutera:
1. `node scripts/generate-house-icon.js` - Génère tous les formats PNG
2. `node scripts/generate-windows-icons.js` - Génère les icônes Windows supplémentaires

## 📱 Intégration

L'icône est automatiquement utilisée par:

### Web (PWA)
- Onglet du navigateur (favicon)
- Écran d'accueil mobile (iOS/Android)
- Manifeste PWA

### Desktop (Tauri)
- Barre des tâches Windows
- Dock macOS
- Autres systèmes d'exploitation

### Métadonnées
- Apple Web App (iOS)
- Android Web App
- Theme color (barre de navigation mobile)

## 📝 Configuration dans layout.tsx

Le fichier `src/app/layout.tsx` inclut:
- Références aux icônes dans les métadonnées
- Manifest PWA
- Configuration Apple Web App
- Theme color
- Apple Touch Icon

## 🚀 Prochaines Étapes (Optionnel)

1. Personnaliser les couleurs dans `public/icon-house.svg`
2. Réexécuter `npm run generate:icons` après modifications
3. Les icônes seront automatiquement utilisées par l'application
