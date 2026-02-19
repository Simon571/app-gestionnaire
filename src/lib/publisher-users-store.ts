import { promises as fs } from 'fs';
import path from 'path';

// Sur Vercel, le filesystem est read-only (sauf /tmp).
// On écrit dans /tmp et on lit /tmp en priorité.
// Fallback : fichier du déploiement (data/publisher-users.json) pour la lecture initiale.
const TMP_PATH = path.join('/tmp', 'publisher-users.json');
const DEPLOY_PATH = path.join(process.cwd(), 'data', 'publisher-users.json');

// Sur Windows (dev local / MSI), /tmp n'existe pas → on utilise le fichier local
const isVercel = process.env.VERCEL === '1';
const WRITE_PATH = isVercel ? TMP_PATH : DEPLOY_PATH;

export type PublisherUserRecord = Record<string, unknown>;

export async function readPublisherUsers(): Promise<PublisherUserRecord[]> {
  // 1. Lire depuis /tmp (données écrites à chaud sur Vercel)
  if (isVercel) {
    try {
      const content = await fs.readFile(TMP_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as PublisherUserRecord[];
    } catch (_) { /* pas encore écrit dans /tmp */ }
  }

  // 2. Fallback : fichier du déploiement
  try {
    const content = await fs.readFile(DEPLOY_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed as PublisherUserRecord[];
  } catch (_) {
    return [];
  }
}

export async function writePublisherUsers(users: PublisherUserRecord[]): Promise<void> {
  const dir = path.dirname(WRITE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(WRITE_PATH, JSON.stringify(users, null, 2), 'utf8');
}