const fs = require('fs');
const path = require('path');

const serverEntry = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = 'localhost';
const port = 3000;

// Détecter si on est dans un contexte Tauri (ressources empaquetées)
const isTauri = process.env.TAURI_ENV === '1' || __dirname.includes('\\\\resources\\\\');

let app;
if (isTauri) {
  // En mode Tauri, utiliser les fichiers standalone depuis les ressources
  const standaloneDir = path.join(__dirname, 'standalone');
  app = next({ 
    dev, 
    hostname, 
    port,
    dir: standaloneDir,
    conf: {
      distDir: '.next'
    }
  });
} else {
  // En mode développement normal
  app = next({ dev, hostname, port });
}

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});
`;

const outputPath = path.join(__dirname, '..', 'server-entry.js');
fs.writeFileSync(outputPath, serverEntry, 'utf8');
console.log('✅ server-entry.js créé');
