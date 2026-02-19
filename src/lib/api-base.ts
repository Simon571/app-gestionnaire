/**
 * Retourne l'URL de base pour les appels API.
 *
 * - En mode Vercel (web production, PORTAL_MODE=1) : URL relative '' → les appels
 *   vont vers le même serveur Vercel.
 * - En mode Tauri/MSI (PORTAL_MODE=0 ou non défini) : URL absolue vers le
 *   serveur Vercel de production, car le MSI est un export statique sans serveur local.
 *
 * Utilisation :
 *   import { getApiBase } from '@/lib/api-base';
 *   const resp = await fetch(`${getApiBase()}/api/publisher-app/users/export`);
 */

const PROD_VERCEL_URL = 'https://app-gestionnaire.vercel.app';

export function getApiBase(): string {
  // NEXT_PUBLIC_PORTAL_MODE = '1'  → web production sur Vercel  → URL relative
  // NEXT_PUBLIC_PORTAL_MODE = '0'  → MSI Tauri (static export)  → URL absolue Vercel
  // Non défini (dev local)          → URL relative (localhost)
  if (process.env.NEXT_PUBLIC_PORTAL_MODE === '0') {
    return PROD_VERCEL_URL;
  }
  // Vercel ou dev local : URL relative (appel vers le même serveur)
  return '';
}
