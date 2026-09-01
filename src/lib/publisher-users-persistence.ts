 import { list, put } from '@vercel/blob';
import { safeTenantSegment } from '@/lib/tenants/tenant-context';
import { resolveTenantId } from '@/lib/tenants/tenant-scope';

const USERS_PREFIX = 'publisher-users/state/';

/**
 * Prefixe de stockage de l'assemblee demandee. Sans `tenantId` on retombe sur
 * le prefixe historique, ce qui preserve les donnees deja ecrites avant le
 * passage en multi-assemblees.
 */
function prefixFor(tenantId?: string | null): string {
  return tenantId
    ? `tenants/${safeTenantSegment(tenantId)}/${USERS_PREFIX}`
    : USERS_PREFIX;
}

/**
 * Assemblee a utiliser : celle demandee explicitement par l'appelant, sinon
 * celle de la requete en cours.
 *
 * Ce module contourne `blob-store` (il parle directement a Vercel Blob), il ne
 * beneficie donc pas du cloisonnement centralise et doit resoudre l'assemblee
 * lui-meme. L'oublier ferait lire a chaque assemblee la liste de proclamateurs
 * de la premiere.
 */
async function effectiveTenant(explicit?: string | null): Promise<string | null> {
  if (explicit !== undefined && explicit !== null) return explicit;
  return resolveTenantId();
}

/** Read the latest Publisher users snapshot from the project Blob Store. */
export async function readPublisherUsersState(
  tenantId?: string | null
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  const result = await list({
    prefix: prefixFor(await effectiveTenant(tenantId)),
    limit: 100,
  });
  const latest = result.blobs.sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  )[0];

  if (!latest) return null;

  const response = await fetch(latest.downloadUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to read Publisher users: HTTP ${response.status}`);
  }

  return response.text();
}

/** Persist a new Publisher users snapshot without changing other data stores. */
export async function writePublisherUsersState(
  content: string,
  tenantId?: string | null
): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  await put(`${prefixFor(await effectiveTenant(tenantId))}users.json`, content, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/json',
  });
}
