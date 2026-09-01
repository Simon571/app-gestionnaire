/**
 * blob-store.ts
 * Abstraction de stockage persistant pour les fichiers JSON de données.
 *
 * - En local (dev / MSI Tauri) : filesystem dans data/
 * - Sur Vercel (serverless)    : Upstash Redis (persistant, gratuit, sans limite)
 *
 * Variables d'environnement requises sur Vercel :
 *   UPSTASH_REDIS_REST_URL   -> https://xxxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN -> AXxx...
 *
 * CLOISONNEMENT MULTI-ASSEMBLEES
 * ------------------------------
 * L'application sert plusieurs assemblees. Les chemins recus des stores
 * (`data/families.json`, …) sont donc prefixes par `tenants/<assemblyId>/`
 * avant d'atteindre le disque ou Redis. La derivation est centralisee ici : les
 * onze stores appelants n'ont pas a connaitre la notion d'assemblee.
 *
 * L'identifiant est lu dans l'en-tete `x-tenant-id`, pose sur la requete par le
 * middleware. Hors contexte de requete HTTP (MSI Tauri, scripts de migration,
 * tests) la lecture echoue : on retombe alors sur le chemin historique non
 * prefixe, ce qui preserve les installations mono-assemblee.
 */
import { promises as fs } from 'fs';
import path from 'path';
import {
  TENANT_HEADER as TENANT_HEADER_NAME,
  safeTenantSegment,
} from '@/lib/tenants/tenant-context';
import { resolveTenantId } from '@/lib/tenants/tenant-scope';

const isVercel = process.env.VERCEL === '1';

// Certains fichiers .env exportes sous Windows commencent par un BOM, qui se
// retrouve collé à la première valeur lue. Ecrit via `fromCharCode` pour que le
// fichier source reste en ASCII pur.
const BOM = String.fromCharCode(0xfeff);

function cleanEnv(s: string | undefined): string {
  const value = s ?? '';
  return (value.startsWith(BOM) ? value.slice(1) : value).trim();
}

function hasRedis(): boolean {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  return url.startsWith('https://') && token.length > 0;
}

export const TENANT_HEADER = TENANT_HEADER_NAME;

/**
 * Assemblee courante, ou `null` hors requete HTTP.
 *
 * La resolution est centralisee dans `tenant-scope` : contexte pose par les
 * routes authentifiees par appareil, sinon en-tete `x-tenant-id` du middleware.
 */
async function currentTenantId(): Promise<string | null> {
  return resolveTenantId();
}

/** Empeche un identifiant d'assemblee de s'echapper de son prefixe. */

async function scopedPaths(
  blobPath: string,
  localPath: string
): Promise<{ blobPath: string; localPath: string }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { blobPath, localPath };

  const segment = safeTenantSegment(tenantId);
  return {
    blobPath: `tenants/${segment}/${blobPath}`,
    // On insere le segment sous data/ plutot qu'avant, pour que l'arborescence
    // locale reste `data/tenants/<id>/families.json`.
    localPath: path.join(
      process.cwd(),
      'data',
      'tenants',
      segment,
      path.relative(path.join(process.cwd(), 'data'), localPath)
    ),
  };
}

/** Convertit un chemin de fichier en cle Redis valide */
function toRedisKey(blobPath: string): string {
  return 'app:' + blobPath.replace(/\\/g, '/').replace(/\//g, ':');
}

async function getRedisClient() {
  const { Redis } = await import('@upstash/redis');
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  return new Redis({ url, token });
}

async function redisGet(key: string): Promise<string | null> {
  const redis = await getRedisClient();
  const value = await redis.get<unknown>(key);
  if (value === null || value === undefined) return null;
  // `@upstash/redis` redeserialise tout seul une valeur qui ressemble a du JSON :
  // les chaines que `redisSet` a ecrites reviennent donc sous forme d'objet ou de
  // tableau. Les appelants attendent le contenu textuel du fichier, et
  // `JSON.parse` d'un objet donne "[object Object]" — c'est ce qui faisait
  // echouer la lecture du registre des assemblees, donc la connexion.
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function redisSet(key: string, value: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(key, value);
}

/**
 * Lecture sans cloisonnement, pour les donnees de plateforme (registre des
 * assemblees) qui sont par nature communes a tous les tenants.
 */
export async function blobReadGlobal(
  blobPath: string,
  localPath: string
): Promise<string | null> {
  if (isVercel && hasRedis()) {
    try {
      return await redisGet(toRedisKey(blobPath));
    } catch (e) {
      console.error('blobReadGlobal Redis error:', (e as Error).message);
      return null;
    }
  }
  try {
    return await fs.readFile(localPath, 'utf8');
  } catch {
    return null;
  }
}

export async function blobWriteGlobal(
  blobPath: string,
  localPath: string,
  content: string
): Promise<void> {
  if (isVercel && hasRedis()) {
    try {
      await redisSet(toRedisKey(blobPath), content);
      return;
    } catch (e) {
      console.error('blobWriteGlobal Redis error:', (e as Error).message);
      throw e;
    }
  }
  if (isVercel) {
    // Le systeme de fichiers est en lecture seule : ecrire ici ne produirait
    // qu'un EROFS opaque. Mieux vaut nommer la cause.
    throw new Error(
      'Stockage indisponible : UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents sur Vercel'
    );
  }
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, content, 'utf8');
}

export async function blobRead(blobPath: string, localPath: string): Promise<string | null> {
  const scoped = await scopedPaths(blobPath, localPath);
  return blobReadGlobal(scoped.blobPath, scoped.localPath);
}

export async function blobWrite(blobPath: string, localPath: string, content: string): Promise<void> {
  const scoped = await scopedPaths(blobPath, localPath);
  return blobWriteGlobal(scoped.blobPath, scoped.localPath, content);
}
