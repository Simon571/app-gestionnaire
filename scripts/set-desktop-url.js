/**
 * Fixe l'adresse du serveur que l'installateur Windows (MSI) doit ouvrir.
 *
 * Le MSI n'embarque pas l'application : c'est une fenetre qui affiche le site
 * distant. L'adresse est donc ecrite dans src-tauri/tauri.conf.json, un fichier
 * JSON qui ne peut pas lire de variable d'environnement — d'ou ce script.
 *
 *   APP_URL=https://assemblee.exemple.org node scripts/set-desktop-url.js
 *   npm run tauri:build:release
 *
 * Sans APP_URL, le script ne fait rien et rappelle l'adresse actuelle.
 */
const fs = require('fs');
const path = require('path');

const CONFIG = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
const DESKTOP_PATH = '/desktop';

const raw = process.env.APP_URL || process.argv[2] || '';
const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const fenetre = config.app?.windows?.[0];

if (!fenetre) {
  console.error("Erreur : aucune fenetre dans tauri.conf.json (app.windows[0]).");
  process.exit(1);
}

if (!raw.trim()) {
  console.log(`Adresse actuelle du MSI : ${fenetre.url}`);
  console.log('Pour la changer :  APP_URL=https://votre-domaine node scripts/set-desktop-url.js');
  process.exit(0);
}

let base;
try {
  base = new URL(raw.trim());
} catch {
  console.error(`Erreur : « ${raw} » n'est pas une adresse valide (attendu https://...).`);
  process.exit(1);
}

if (base.protocol !== 'https:' && base.hostname !== 'localhost') {
  // Une fenetre en HTTP simple envoie le cookie de session en clair sur le
  // reseau, et le navigateur integre refuse une partie des API.
  console.error('Erreur : utiliser https:// (sauf localhost pour un essai).');
  process.exit(1);
}

const avant = fenetre.url;
fenetre.url = `${base.origin}${DESKTOP_PATH}`;

if (avant === fenetre.url) {
  console.log(`Inchange : ${fenetre.url}`);
  process.exit(0);
}

fs.writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`MSI : ${avant}\n  ->  ${fenetre.url}`);
console.log('Reconstruire ensuite :  npm run tauri:build:release');
