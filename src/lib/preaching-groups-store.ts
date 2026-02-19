import path from 'path';
import { blobRead, blobWrite } from './blob-store';

export interface PreachingGroup {
  id: string;
  name: string;
}

const BLOB_PATH = 'data/preaching-groups.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'preaching-groups.json');

export async function readPreachingGroups(): Promise<PreachingGroup[]> {
  try {
    const content = await blobRead(BLOB_PATH, LOCAL_PATH);
    if (!content) return [];
    return JSON.parse(content) as PreachingGroup[];
  } catch {
    return [];
  }
}

export async function writePreachingGroups(groups: PreachingGroup[]): Promise<void> {
  await blobWrite(BLOB_PATH, LOCAL_PATH, JSON.stringify(groups, null, 2));
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
