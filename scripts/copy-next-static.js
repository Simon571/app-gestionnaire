const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(projectRoot, '.next', 'standalone', '.next', 'static');
const standaloneSrc = path.join(projectRoot, '.next', 'standalone');

// Nouveau: créer dist-tauri pour Tauri
const distTauriDir = path.join(projectRoot, 'dist-tauri');
const distTauriStandalone = path.join(distTauriDir, 'standalone');
const serverEntryPath = path.join(projectRoot, 'server-entry.js');

const archiveDest = path.join(projectRoot, 'next-dist.tar.gz');
const nodeSrc = process.execPath;
const nodeDest = path.join(projectRoot, 'node.exe');
const { spawnSync } = require('child_process');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(staticSrc)) {
  console.error('Erreur: le dossier .next/static est introuvable. Avez-vous exécuté "next build" ?');
  process.exit(1);
}

fs.rmSync(staticDest, { recursive: true, force: true });
copyRecursive(staticSrc, staticDest);

console.log(`Static Next.js copié vers ${path.relative(projectRoot, staticDest)}`);

if (!fs.existsSync(standaloneSrc)) {
  console.error('Erreur: le dossier .next/standalone est introuvable. Avez-vous exécuté "next build" ?');
  process.exit(1);
}

fs.rmSync(archiveDest, { force: true });

const tarBinary = process.platform === 'win32' ? 'tar' : 'tar';
const tarArgs = ['-czf', archiveDest, '-C', standaloneSrc, '.'];
const tarResult = spawnSync(tarBinary, tarArgs, { stdio: 'inherit' });

if (tarResult.status !== 0) {
  console.error('Erreur: impossible de créer l\'archive tar.gz du bundle Next.js. Vérifiez que la commande "tar" est disponible.');
  process.exit(tarResult.status ?? 1);
}

console.log(`Archive Next.js créée: ${path.relative(projectRoot, archiveDest)}`);

// Créer dist-tauri avec le serveur et les fichiers standalone
console.log('\n📦 Préparation de dist-tauri...');
fs.rmSync(distTauriDir, { recursive: true, force: true });
fs.mkdirSync(distTauriDir, { recursive: true });

// Copier le standalone complet
console.log('Copie du standalone...');
copyRecursive(standaloneSrc, distTauriStandalone);

// Créer le fichier server.js directement
console.log('Création de server.js...');
const serverJs = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = process.env.HOSTNAME || '127.0.0.1';
const port = parseInt(process.env.PORT, 10) || 1420;

console.log('Démarrage du serveur Next.js...');
console.log('Répertoire:', __dirname);

const app = next({ 
  dev, 
  hostname, 
  port,
  dir: __dirname,
  conf: {
    distDir: '.next'
  }
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Erreur:', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err) => {
        console.error('Erreur serveur:', err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(\`✅ Serveur prêt sur http://\${hostname}:\${port}\`);
      });
  })
  .catch((err) => {
    console.error('Erreur préparation Next.js:', err);
    process.exit(1);
  });
`;

fs.writeFileSync(path.join(distTauriStandalone, 'server.js'), serverJs, 'utf8');
console.log(`✅ server.js créé dans dist-tauri/standalone/`);

// Créer l'archive tar.gz pour Tauri
console.log('\nCréation de l\'archive tar.gz...');
const tarArgs2 = ['-czf', archiveDest, '-C', distTauriStandalone, '.'];
const tarResult2 = spawnSync(tarBinary, tarArgs2, { stdio: 'inherit' });

if (tarResult2.status !== 0) {
  console.error('❌ Erreur: impossible de créer l\'archive tar.gz.');
  process.exit(tarResult2.status ?? 1);
}
console.log(`✅ Archive créée: ${path.relative(projectRoot, archiveDest)}`);

// Copier node.exe au root du projet (pour Tauri resources)
try {
  fs.copyFileSync(nodeSrc, nodeDest);
  console.log(`✅ Binaire Node.js copié: ${path.relative(projectRoot, nodeDest)}`);
} catch (err) {
  console.warn('⚠️ Avertissement: impossible de copier le binaire Node.js.', err);
}

console.log('\n✅ Build Tauri prêt!\n');
