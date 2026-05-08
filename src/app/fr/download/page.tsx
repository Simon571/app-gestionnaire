import Head from 'next/head';
import styles from '@/styles/Download.module.css';

export default function Download() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Téléchargements - Gestionnaire d'Assemblée</title>
      </Head>
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📥 Téléchargements</h1>
          <p className={styles.subtitle}>
            Téléchargez l'application pour Windows et Android
          </p>
        </div>

        <div className={styles.cards}>
          <div className={styles.card}>
            <div className={styles.icon}>🖥️</div>
            <h2>Application Windows (MSI)</h2>
            <p className={styles.version}>Version 1.0.3</p>
            <p className={styles.description}>
              Pour Windows 10/11 - Installation automatique avec serveur intégré
            </p>
            <div className={styles.features}>
              <span className={styles.feature}>✅ Serveur automatique</span>
              <span className={styles.feature}>✅ Synchronisation locale</span>
              <span className={styles.feature}>✅ Mode hors-ligne</span>
            </div>
            <a 
              href="https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.3/Gestionnaire.d.Assemblee_1.0.3_x64_en-US.msi"
              className={styles.downloadBtn}
              download
            >
              📥 Télécharger MSI (64-bit)
            </a>
            <p className={styles.note}>Taille : ~150 MB • Inclut Node.js et le serveur</p>
          </div>

          <div className={styles.card}>
            <div className={styles.icon}>📱</div>
            <h2>Application Android (APK)</h2>
            <p className={styles.version}>Version 1.0.3</p>
            <p className={styles.description}>
              Pour Android 8.0 et supérieur - Se connecte au serveur Windows
            </p>
            <div className={styles.features}>
              <span className={styles.feature}>✅ Connexion au serveur local</span>
              <span className={styles.feature}>✅ Synchronisation automatique</span>
              <span className={styles.feature}>✅ Mode hors-ligne</span>
            </div>
            <a 
              href="https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.3/app-release.apk"
              className={styles.downloadBtn}
              download
            >
              📥 Télécharger APK
            </a>
            <p className={styles.note}>Taille : ~50 MB • Nécessite l'activation des sources inconnues</p>
          </div>
        </div>

        <div className={styles.instructions}>
          <h2>🚀 Instructions d'installation</h2>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div>
              <h3>Installer l'application Windows (MSI)</h3>
              <p>Téléchargez et installez l'MSI sur l'ordinateur qui servira de serveur. Au premier lancement, le serveur Next.js démarre automatiquement.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div>
              <h3>Noter l'adresse IP affichée</h3>
              <p>L'application Windows affichera son adresse IP. Notez-la (ex: 192.168.1.50:3000).</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div>
              <h3>Installer l'APK sur les téléphones</h3>
              <p>Téléchargez et installez l'APK sur les téléphones des proclamateurs. Dans les paramètres, entrez l'adresse IP du serveur Windows.</p>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <div>
              <h3>La synchronisation est prête !</h3>
              <p>Les données se synchronisent automatiquement entre l'application Windows et les téléphones via le réseau local.</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>✅ Aucune connaissance technique requise - Tout est automatique !</p>
          <a href="/fr" className={styles.backLink}>← Retour à l'accueil</a>
        </div>
        </main>
    </div>
  );
}
