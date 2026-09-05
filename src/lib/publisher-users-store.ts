import path from 'path';
import { blobRead, blobWrite } from './blob-store';
import {
  readPublisherUsersState,
  writePublisherUsersState,
} from './publisher-users-persistence';

const BLOB_PATH = 'data/publisher-users.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'publisher-users.json');

export type PublisherUserRecord = Record<string, unknown>;

const isVercel = process.env.VERCEL === '1';
const hasRedisStorage = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
const hasVercelBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

const parseUsers = (content: string | null): PublisherUserRecord[] => {
  if (!content) return [];
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed as PublisherUserRecord[] : [];
};

export async function readPublisherUsers(): Promise<PublisherUserRecord[]> {
  try {
    // Redis est la source de verite quand il est configure. Vercel Blob ne sert
    // de repli que s'il est *en panne*, jamais quand il repond « rien ici » :
    // `readPublisherUsersState` appelle `list()` sur le magasin Blob, ce que le
    // forfait Hobby compte comme une « advanced operation » et n'en accorde que
    // 2 000 par mois. Sur une base Redis encore vide, l'ancien code en
    // declenchait une a chaque lecture — de quoi bloquer le magasin, et c'est
    // ce qui est arrive. La recuperation des donnees restees dans Blob se fait
    // explicitement, par `npm run recover:blob`.
    if (isVercel && hasRedisStorage()) {
      try {
        return parseUsers(await blobRead(BLOB_PATH, LOCAL_PATH));
      } catch (redisError) {
        console.warn('Unable to read Publisher users from Redis', redisError);
        if (hasVercelBlob()) {
          return parseUsers(await readPublisherUsersState());
        }
        return [];
      }
    }
    if (isVercel && hasVercelBlob()) {
      return parseUsers(await readPublisherUsersState());
    }
    return parseUsers(await blobRead(BLOB_PATH, LOCAL_PATH));
  } catch (error) {
    console.error('Unable to read Publisher users', error);
    return [];
  }
}

export async function writePublisherUsers(users: PublisherUserRecord[]): Promise<void> {
  const content = JSON.stringify(users, null, 2);
  if (isVercel && hasRedisStorage()) {
    try {
      await blobWrite(BLOB_PATH, LOCAL_PATH, content);
      return;
    } catch (redisError) {
      if (!hasVercelBlob()) throw redisError;
      console.warn('Unable to write Publisher users to Redis, using Vercel Blob', redisError);
      await writePublisherUsersState(content);
      return;
    }
  }
  if (isVercel && hasVercelBlob()) {
    await writePublisherUsersState(content);
    return;
  }
  if (isVercel) {
    throw new Error('Aucun stockage persistant Publisher Users configuré');
  }
  await blobWrite(BLOB_PATH, LOCAL_PATH, content);
}