import { headers } from 'next/headers';
import Head from 'next/head';
import styles from '@/styles/ServerInfo.module.css';

export default async function ServerInfo() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const serverUrl = `http://${host}`;
  const serverIp = host.split(':')[0];

  return (
    <div className={styles.container}>
      <Head>
        <title>Configuration du serveur - Gestionnaire</title>
      </Head>
      
      <main className={styles.main}>
        <h1>🔧 Configuration du serveur</h1>
        <p className={styles.subtitle}>
          Pour connecter l'application mobile, utilisez l'une de ces méthodes :
        </p>

        <div className={styles.methods}>
          <div className={styles.method}>
            <h2>📱 Méthode 1 : Scanner le QR Code</h2>
            <div className={styles.qrContainer}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(serverUrl)}`}
                alt="QR Code pour l'application mobile"
                className={styles.qrCode}
              />
            </div>
            <p className={styles.help}>Scannez ce code avec l'app mobile</p>
          </div>

          <div className={styles.method}>
            <h2>✏️ Méthode 2 : Saisir l'adresse manuellement</h2>
            <div className={styles.infoBox}>
              <p><strong>Adresse du serveur :</strong></p>
              <code className={styles.code}>{serverUrl}</code>
              <p><strong>IP du serveur :</strong></p>
              <code className={styles.code}>{serverIp}:3000</code>
            </div>
            <div className={styles.steps}>
              <h3>Instructions pour l'app mobile :</h3>
              <ol>
                <li>Ouvrez l'application mobile</li>
                <li>Allez dans <strong>Menu → Paramètres serveur</strong></li>
                <li>Entrez l'adresse : <code>{serverIp}:3000</code></li>
                <li>Sauvegardez et redémarrez l'app</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>✅ Une fois configuré, les données se synchroniseront automatiquement !</p>
        </div>
      </main>
    </div>
  );
}
