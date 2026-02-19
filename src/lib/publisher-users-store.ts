import path from 'path';
import { blobRead, blobWrite } from './blob-store';

const BLOB_PATH = 'data/publisher-users.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'publisher-users.json');

export type PublisherUserRecord = Record<string, unknown>;

export async function readPublisherUsers(): Promise<PublisherUserRecord[]> {
  try {
    const content = await blobRead(BLOB_PATH, LOCAL_PATH);
    if (!content) return [];
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed as PublisherUserRecord[];
  } catch {
    return [];
  }
}

export async function writePublisherUsers(users: PublisherUserRecord[]): Promise<void> {
  await blobWrite(BLOB_PATH, LOCAL_PATH, JSON.stringify(users, null, 2));
}