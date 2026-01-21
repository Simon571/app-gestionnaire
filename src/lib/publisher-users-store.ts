import { promises as fs } from 'fs';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), 'data', 'publisher-users.json');

export type PublisherUserRecord = Record<string, unknown>;

export async function readPublisherUsers(): Promise<PublisherUserRecord[]> {
  try {
    const content = await fs.readFile(USERS_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed as PublisherUserRecord[];
  } catch (error) {
    // Fichier manquant ou invalide => liste vide
    return [];
  }
}

export async function writePublisherUsers(users: PublisherUserRecord[]): Promise<void> {
  const dir = path.dirname(USERS_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}