const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const staticSrc = path.join(projectRoot, '.next', 'static');
const staticDest = path.join(projectRoot, '.next', 'standalone', '.next', 'static');
const standaloneSrc = path.join(projectRoot, '.next', 'standalone');
const archiveDest = path.join(projectRoot, 'src-tauri', 'next-dist.tar.gz');
const resourcesRoot = path.join(projectRoot, 'src-tauri', 'resources');
const nodeDir = path.join(resourcesRoot, 'node');
const nodeBinaryName = process.platform === 'win32' ? 'node.exe' : 'node';
const nodeDest = path.join(nodeDir, nodeBinaryName);
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

try {
  fs.mkdirSync(resourcesRoot, { recursive: true });
  fs.mkdirSync(nodeDir, { recursive: true });
  fs.copyFileSync(process.execPath, nodeDest);
  console.log(`Binaire Node.js copié vers ${path.relative(projectRoot, nodeDest)}`);
} catch (err) {
  console.warn('Avertissement: impossible de copier le binaire Node.js.', err);
  console.warn('L\'application installée exigera que Node.js soit présent sur la machine cible.');
}
