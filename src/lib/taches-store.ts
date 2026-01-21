import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const TACHES_FILE = path.join(DATA_DIR, 'taches.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readTaches(): Promise<Tache[]> {
  ensureDataDir();
  try {
    if (!fs.existsSync(TACHES_FILE)) return [];
    const raw = fs.readFileSync(TACHES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Tache[];
  } catch (error) {
    console.error('Error reading taches:', error);
    return [];
  }
}

export async function writeTaches(taches: Tache[]): Promise<void> {
  ensureDataDir();
  fs.writeFileSync(TACHES_FILE, JSON.stringify(taches, null, 2));
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
