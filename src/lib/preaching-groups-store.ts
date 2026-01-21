import fs from 'fs';
import path from 'path';

export interface PreachingGroup {
  id: string;
  name: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const GROUPS_FILE = path.join(DATA_DIR, 'preaching-groups.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readPreachingGroups(): Promise<PreachingGroup[]> {
  ensureDataDir();
  try {
    if (!fs.existsSync(GROUPS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(GROUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading preaching groups:', error);
    return [];
  }
}

export async function writePreachingGroups(groups: PreachingGroup[]): Promise<void> {
  ensureDataDir();
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
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
