import fs from 'fs';
import path from 'path';

export interface PreachingGroup {
  id: string;
  name: string;
}

const isVercel = process.env.VERCEL === '1';
const DEPLOY_FILE = path.join(process.cwd(), 'data', 'preaching-groups.json');
const TMP_FILE = '/tmp/preaching-groups.json';
const WRITE_FILE = isVercel ? TMP_FILE : DEPLOY_FILE;

export async function readPreachingGroups(): Promise<PreachingGroup[]> {
  // Sur Vercel : lire /tmp en priorité (données écrites à chaud)
  if (isVercel) {
    try {
      if (fs.existsSync(TMP_FILE)) {
        const data = fs.readFileSync(TMP_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* pas encore dans /tmp */ }
  }
  // Fallback : fichier du déploiement
  try {
    if (!fs.existsSync(DEPLOY_FILE)) return [];
    const data = fs.readFileSync(DEPLOY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading preaching groups:', error);
    return [];
  }
}

export async function writePreachingGroups(groups: PreachingGroup[]): Promise<void> {
  try {
    fs.writeFileSync(WRITE_FILE, JSON.stringify(groups, null, 2));
  } catch (error) {
    console.error('Error writing preaching groups:', error);
    throw error;
  }
}

export async function addPreachingGroup(group: PreachingGroup): Promise<void> {
  const groups = await readPreachingGroups();
  groups.push(group);
  await writePreachingGroups(groups);
}

export async function deletePreachingGroup(groupId: string): Promise<void> {
  const groups = await readPreachingGroups();
  const filtered = groups.filter(g => g.id !== groupId);
  await writePreachingGroups(filtered);
}
