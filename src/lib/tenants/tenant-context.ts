/**
 * tenant-context.ts
 * Nom de l'en-tete qui porte l'assemblee courante.
 *
 * Isole dans son propre module, sans aucune dependance, pour que le middleware
 * (Edge runtime) puisse l'importer sans tirer `blob-store`, qui depend de `fs`.
 */

export const TENANT_HEADER = 'x-tenant-id';

/** Empeche un identifiant d'assemblee de s'echapper de son prefixe de stockage. */
export function safeTenantSegment(tenantId: string): string {
  return tenantId.replace(/[^A-Za-z0-9._-]/g, '_');
}
