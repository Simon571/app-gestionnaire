/**
 * tenant-scope.ts
 * Assemblee courante pour les requetes qui n'ont pas d'en-tete `x-tenant-id`.
 *
 * Le middleware pose `x-tenant-id` a partir du cookie de session, ce qui couvre
 * le web et le MSI. Il ne peut rien poser pour les requetes de l'application
 * mobile : celles-ci s'authentifient par signature d'appareil, verifiable
 * uniquement en runtime Node (registre sur disque / Redis), donc apres le
 * middleware.
 *
 * Ces route handlers resolvent eux-memes l'assemblee, puis executent leur
 * traitement dans `runWithTenant`. `blob-store` consulte ce contexte avant
 * l'en-tete, si bien que les onze stores restent inchanges.
 *
 * `AsyncLocalStorage` propage la valeur a travers les `await` sans variable
 * globale : deux requetes concurrentes ne peuvent pas se voler leur assemblee.
 */
import { AsyncLocalStorage } from 'async_hooks';
import { TENANT_HEADER } from '@/lib/tenants/tenant-context';

const storage = new AsyncLocalStorage<string>();

/** Execute `fn` en attribuant toute lecture/ecriture de donnees a `tenantId`. */
export function runWithTenant<T>(tenantId: string | null | undefined, fn: () => Promise<T>): Promise<T> {
  const trimmed = (tenantId ?? '').trim();
  if (!trimmed) return fn();
  return storage.run(trimmed, fn);
}

/** Assemblee posee par `runWithTenant`, ou `null`. */
export function getScopedTenantId(): string | null {
  return storage.getStore() ?? null;
}

/**
 * Assemblee courante, toutes sources confondues, ou `null` hors requete.
 *
 *  1. `runWithTenant` — routes authentifiees par signature d'appareil ;
 *  2. en-tete `x-tenant-id` — pose par le middleware depuis le cookie.
 *
 * `next/headers` est importe dynamiquement pour que ce module reste chargeable
 * par les scripts Node et par le binaire Tauri, qui n'ont pas de requete.
 */
export async function resolveTenantId(): Promise<string | null> {
  const scoped = getScopedTenantId();
  if (scoped) return scoped;
  try {
    const { headers } = await import('next/headers');
    const store = await headers();
    const value = store.get(TENANT_HEADER)?.trim();
    return value ? value : null;
  } catch {
    return null;
  }
}
