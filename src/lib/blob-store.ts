/**
 * blob-store.ts
 * Abstraction de stockage persistant pour les fichiers JSON de données.
 *
 * - En local (dev / MSI Tauri) : filesystem dans data/
 * - Sur Vercel (serverless)    : Upstash Redis (persistant, gratuit, sans limite)
 *
 * Variables d'environnement requises sur Vercel :
 *   UPSTASH_REDIS_REST_URL   → https://xxxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN → AXxx...
 */
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';
const hasRedis =
  typeof process.env.UPSTASH_REDIS_REST_URL === 'string' &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN === 'string' &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

function toRedisKey(blobPath: string): string {
  return 'app:' + blobPath.replace(/\\/g, '/').replace(/\//g, ':');
}

async function redisGet(key: string): Promise<string | null> {
  const { Redis } = await import('@upstash/redis');
  const redis = Redis.fromEnv();
  const value = await redis.get<string>(key);
  return value ?? null;
}

async function redisSet(key: string, value: string): Promise<void> {
  const { Redis } = await import('@upstash/redis');
  const redis = Redis.fromEnv();
  await redis.set(key, value);
}

export async function blobRead(blobPath: string, localPath: string): Promise<string | null> {
  if (isVercel && hasRedis) {
    try {
      return await redisGet(toRedisKey(blobPath));
    } catch (e) {
      console.error('blobRead Redis error:', (e as Error).message);
      return null;
    }
  }
  try {
    return await fs.readFile(localPath, 'utf8');
  } catch {
    return null;
  }
}

export async function blobWrite(blobPath: string, localPath: string, content: string): Promise<void> {
  if (isVercel && hasRedis) {
    try {
      await redisSet(toRedisKey(blobPath), content);
      return;
    } catch (e) {
      console.error('blobWrite Redis error:', (e as Error).message);
      throw e;
    }
  }
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, content, 'utf8');
}
