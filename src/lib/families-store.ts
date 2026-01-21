import fs from 'fs';
import path from 'path';

export interface Family {
  id: string;
  name: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FAMILIES_FILE = path.join(DATA_DIR, 'families.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readFamilies(): Promise<Family[]> {
  ensureDataDir();
  try {
    if (!fs.existsSync(FAMILIES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(FAMILIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading families:', error);
    return [];
  }
}

export async function writeFamilies(families: Family[]): Promise<void> {
  ensureDataDir();
  fs.writeFileSync(FAMILIES_FILE, JSON.stringify(families, null, 2));
}

export async function addFamily(family: Family): Promise<void> {
  const families = await readFamilies();
  families.push(family);
  await writeFamilies(families);
}

export async function deleteFamily(familyId: string): Promise<void> {
  const families = await readFamilies();
  const filtered = families.filter(f => f.id !== familyId);
  await writeFamilies(filtered);
}
