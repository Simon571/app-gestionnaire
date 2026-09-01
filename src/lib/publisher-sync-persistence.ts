import { list, put } from '@vercel/blob';

const STATE_PREFIX = 'publisher-sync/state/';
const STATE_CONTENT_TYPE = 'application/json';

/**
 * Lit le dernier etat de synchronisation depuis le Blob Store configure.
 * Les noms aleatoires evitent d'exposer une URL de donnees previsible.
 */
export async function readPublisherSyncState(): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  const result = await list({
    prefix: STATE_PREFIX,
    limit: 100,
  });
  const latest = result.blobs.sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  )[0];

  if (!latest) return null;

  const response = await fetch(latest.downloadUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to read publisher sync state: HTTP ${response.status}`);
  }
  return response.text();
}

/** Ecrit un nouvel instantane persistant de la file de synchronisation. */
export async function writePublisherSyncState(content: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  await put(`${STATE_PREFIX}state.json`, content, {
    access: 'public',
    addRandomSuffix: true,
    contentType: STATE_CONTENT_TYPE,
  });
}
