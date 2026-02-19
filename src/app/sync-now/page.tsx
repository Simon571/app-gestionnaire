'use client';

import { useState } from 'react';

export default function SyncNow() {
  const [status, setStatus] = useState<string>('');
  const [done, setDone] = useState(false);

  async function doSync() {
    setStatus('Lecture du localStorage...');
    try {
      const raw = localStorage.getItem('people');
      if (!raw) { setStatus('❌ Aucune donnée "people" dans ce navigateur.'); return; }

      const people = JSON.parse(raw);
      if (!Array.isArray(people) || people.length === 0) {
        setStatus('❌ La liste est vide dans ce navigateur.'); return;
      }

      const rawSettings = localStorage.getItem('appSettings');
      let assemblyId = 'DEFAULT';
      try {
        if (rawSettings) assemblyId = (JSON.parse(rawSettings) as Record<string, string>)?.assemblyId || 'DEFAULT';
      } catch (_) {}

      setStatus(`📤 Envoi de ${people.length} personnes (assemblyId=${assemblyId})...`);

      const resp = await fetch('/api/publisher-app/users/web-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: people, assemblyId }),
      });

      const json = await resp.json();
      if (resp.ok) {
        setStatus(`✅ Synchronisation réussie ! ${json.count} utilisateurs envoyés au serveur.`);
        setDone(true);
      } else {
        setStatus(`❌ Erreur serveur: ${JSON.stringify(json)}`);
      }
    } catch (e) {
      setStatus(`❌ Erreur: ${String(e)}`);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 500, margin: '80px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Synchronisation vers le serveur</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Cliquez sur le bouton pour envoyer la liste des proclamateurs de ce navigateur vers le serveur Vercel.
        Flutter pourra ensuite se connecter.
      </p>
      <button
        onClick={doSync}
        disabled={done}
        style={{
          background: done ? '#22c55e' : '#2563eb',
          color: 'white', border: 'none', borderRadius: 8,
          padding: '12px 28px', fontSize: 16, cursor: done ? 'default' : 'pointer'
        }}
      >
        {done ? '✅ Synchronisé !' : '🔄 Synchroniser maintenant'}
      </button>

      {status && (
        <p style={{ marginTop: 20, padding: 16, background: '#f3f4f6', borderRadius: 8, wordBreak: 'break-word' }}>
          {status}
        </p>
      )}
    </div>
  );
}
