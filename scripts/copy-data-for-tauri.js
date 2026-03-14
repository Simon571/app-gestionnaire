const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const dataSource = path.join(projectRoot, 'data');
const dataDestPublic = path.join(projectRoot, 'out', 'public', 'data');
const dataDestRoot = path.join(projectRoot, 'out', 'data');

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
      console.log(`Copied: ${path.relative(projectRoot, srcPath)} → ${path.relative(projectRoot, destPath)}`);
    }
  }
}

if (!fs.existsSync(dataSource)) {
  console.error(`Erreur: le dossier ${dataSource} est introuvable.`);
  process.exit(1);
}

// Copy to out/public/data/
if (!fs.existsSync(path.join(projectRoot, 'out'))) {
  console.error('Erreur: le dossier out/ est introuvable. Avez-vous exécuté "npm run build:tauri" ?');
  process.exit(1);
}

try {
  copyRecursive(dataSource, dataDestPublic);
  console.log(`✅ Données copiées vers: ${path.relative(projectRoot, dataDestPublic)}`);
} catch (err) {
  console.error('Erreur lors de la copie des données:', err);
  process.exit(1);
}
