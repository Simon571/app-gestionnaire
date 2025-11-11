#!/usr/bin/env node
/**
 * Script pour générer les icônes PWA
 * Utilise sharp pour créer des images SVG en PNG
 */

const fs = require('fs');
const path = require('path');

// Créer les icônes SVG de placeholder
const createPlaceholderIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <text x="${size/2}" y="${size/2}" font-size="${size/4}" fill="white" text-anchor="middle" dy=".3em" font-family="Arial">
    AA
  </text>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconDir = path.join(__dirname, '..', 'public', 'icons');

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Générer les icônes
sizes.forEach(size => {
  const svgContent = createPlaceholderIcon(size);
  const fileName = `icon-${size}x${size}.png.svg`;
  const filePath = path.join(iconDir, fileName);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ Créé: ${fileName}`);
});

// Créer les icônes maskable
const maskableSizes = [192, 512];
maskableSizes.forEach(size => {
  const svgContent = createPlaceholderIcon(size);
  const fileName = `maskable-${size}x${size}.png.svg`;
  const filePath = path.join(iconDir, fileName);
  fs.writeFileSync(filePath, svgContent);
  console.log(`✓ Créé: ${fileName}`);
});

console.log('\n⚠️  Les icônes sont actuellement des placeholders SVG.');
console.log('Pour les convertir en PNG, installez sharp:');
console.log('  npm install sharp');
console.log('\nPuis créez les fichiers PNG avec votre propre logo.');
