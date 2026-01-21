const fs = require('fs');
const path = require('path');

/**
 * Script pour mettre à jour la version de l'APK
 * Usage: node scripts/update-apk-version.js 1.0.1 "Corrections de bugs"
 */

const args = process.argv.slice(2);
const newVersion = args[0];
const releaseNotes = args[1] || 'Mise à jour';

if (!newVersion) {
  console.error('❌ Veuillez fournir un numéro de version');
  console.log('Usage: node scripts/update-apk-version.js 1.0.1 "Notes de version"');
  process.exit(1);
}

// Calculer le buildNumber à partir de la version
const buildNumber = parseInt(newVersion.split('.').join(''));

// Mettre à jour version.json
const versionFile = path.join(__dirname, '../public/app/version.json');
const versionData = {
  version: newVersion,
  buildNumber: buildNumber,
  downloadUrl: `${process.env.PUBLIC_URL || 'https://votre-serveur.com'}/downloads/app-release.apk`,
  releaseNotes: releaseNotes,
  minimumVersion: "1.0.0",
  forceUpdate: false,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
console.log('✅ version.json mis à jour:');
console.log(JSON.stringify(versionData, null, 2));

// Mettre à jour pubspec.yaml
const pubspecFile = path.join(__dirname, '../flutter_app/pubspec.yaml');
let pubspecContent = fs.readFileSync(pubspecFile, 'utf8');

// Remplacer la ligne version
pubspecContent = pubspecContent.replace(
  /^version:.*$/m,
  `version: ${newVersion}+${buildNumber}`
);

fs.writeFileSync(pubspecFile, pubspecContent);
console.log(`✅ pubspec.yaml mis à jour: version ${newVersion}+${buildNumber}`);

console.log('\n📱 Prochaines étapes:');
console.log('1. cd flutter_app');
console.log('2. flutter build apk --release');
console.log('3. Copier l\'APK vers public/downloads/app-release.apk');
console.log('4. Déployer sur votre serveur');
