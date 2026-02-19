import path from 'path';
import { blobRead, blobWrite } from './blob-store';

export interface Family {
  id: string;
  name: string;
}

const BLOB_PATH = 'data/families.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'families.json');

export async function readFamilies(): Promise<Family[]> {
  try {
    const content = await blobRead(BLOB_PATH, LOCAL_PATH);
    if (!content) return [];
    return JSON.parse(content) as Family[];
  } catch {
    return [];
  }
}

export async function writeFamilies(families: Family[]): Promise<void> {
  await blobWrite(BLOB_PATH, LOCAL_PATH, JSON.stringify(families, null, 2));
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
