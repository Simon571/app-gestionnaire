'use client';

import { useEffect, useState } from 'react';
import styles from '@/styles/ServerBanner.module.css';

export default function ServerBanner() {
  const [serverInfo, setServerInfo] = useState<{
    ip: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const res = await fetch('/api/server-info');
        if (res.ok) {
          const data = await res.json();
          setServerInfo(data);
        }
      } catch (e) {
        // Server info not available
      }
    };

    // Only show in production/local mode
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'tauri:') {
      fetchServerInfo();
    }
  }, []);

  if (!serverInfo) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.icon}>🖥️</span>
          <div>
            <strong>Serveur local actif</strong>
            <p className={styles.details}>
              IP: <code>{serverInfo.ip}:3000</code> | 
              QR Code: <code>{serverInfo.url}</code>
            </p>
          </div>
        </div>
        <div className={styles.qr}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(serverInfo.url)}`}
            alt="QR Code"
            className={styles.qrImage}
          />
        </div>
      </div>
    </div>
  );
}
