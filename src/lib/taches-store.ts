import { blobRead, blobWrite } from './blob-store';

export type TacheStatus = 'todo' | 'in_progress' | 'done';

export interface Tache {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO date (YYYY-MM-DD) or any string already used by UI
  assignedToPersonIds: string[];
  assignedByPersonId?: string;
  status?: TacheStatus;
  createdAt?: string;
  updatedAt?: string;

  /**
   * Legacy compatibility: older UI / payloads may still send names.
   * We keep it optional so we can migrate safely.
   */
  assignedTo?: string | string[];
}

const TACHES_BLOB_PATH = 'data/taches.json';
const TACHES_LOCAL_PATH = (() => {
  try {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'taches.json');
  } catch {
    return 'data/taches.json';
  }
})();

export async function readTaches(): Promise<Tache[]> {
  try {
    const content = await blobRead(TACHES_BLOB_PATH, TACHES_LOCAL_PATH);
    if (!content) return [];
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed as Tache[];
  } catch (error) {
    console.error('Error reading taches:', error);
    return [];
  }
}

export async function writeTaches(taches: Tache[]): Promise<void> {
  await blobWrite(TACHES_BLOB_PATH, TACHES_LOCAL_PATH, JSON.stringify(taches, null, 2));
}

export async function addTache(tache: Tache): Promise<void> {
  const taches = await readTaches();
  taches.push(tache);
  await writeTaches(taches);
}

export async function deleteTache(tacheId: string): Promise<void> {
  const taches = await readTaches();
  const filtered = taches.filter((t) => t.id !== tacheId);
  await writeTaches(filtered);
}
