import fs from 'fs';
import path from 'path';

export interface Family {
  id: string;
  name: string;
}

const isVercel = process.env.VERCEL === '1';
const DEPLOY_FILE = path.join(process.cwd(), 'data', 'families.json');
const TMP_FILE = '/tmp/families.json';
const WRITE_FILE = isVercel ? TMP_FILE : DEPLOY_FILE;

export async function readFamilies(): Promise<Family[]> {
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
    console.error('Error reading families:', error);
    return [];
  }
}

export async function writeFamilies(families: Family[]): Promise<void> {
  try {
    fs.writeFileSync(WRITE_FILE, JSON.stringify(families, null, 2));
  } catch (error) {
    console.error('Error writing families:', error);
    throw error;
  }
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
