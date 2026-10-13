// Chargeur du serveur standalone Next.js pour le gestionnaire.
//
// Pourquoi ce fichier ? Le standalone `server.js` ne lit pas `.env` lui-meme,
// et le charger via bash (`export $(cat .env)`) CORROMPT les valeurs contenant
// des '$' (PBKDF2) : bash les interprete comme des variables ($2, $f, ...).
// Ce chargeur lit .env ligne a ligne en Node, sans aucune expansion, puis
// demarre server.js. Les valeurs arrivent intactes.
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const envPath = path.join(root, '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Retire les guillemets d'encadrement s'il y en a.
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    process.env[key] = value;
  }
}

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.NEXT_TELEMETRY_DISABLED = '1';

require(path.join(root, '.next', 'standalone', 'server.js'));