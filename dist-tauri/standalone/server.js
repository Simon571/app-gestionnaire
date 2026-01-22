const { createServer } = require('http');
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
        console.log(`✅ Serveur prêt sur http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error('Erreur préparation Next.js:', err);
    process.exit(1);
  });
