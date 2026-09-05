/**
 * Retourne l'URL de base pour les appels API.
 *
 * - Web (Vercel ou serveur propre) : URL relative '' → les appels vont vers le
 *   meme serveur que la page.
 * - MSI Tauri (NEXT_PUBLIC_PORTAL_MODE=0) : URL absolue, car l'installateur
 *   Windows est un export statique sans serveur local — il faut lui dire ou
 *   joindre l'application.
 *
 * L'adresse absolue vient de l'environnement, pas du code : c'est ce qui permet
 * de changer d'hebergeur (Vercel → serveur propre) sans modifier de fichier
 * source. Elle est figee au moment du build, comme toute variable
 * `NEXT_PUBLIC_*`, donc changer d'adresse impose de reconstruire le MSI.
 *
 * Utilisation :
 *   import { getApiBase } from '@/lib/api-base';
 *   const resp = await fetch(`${getApiBase()}/api/publisher-app/users/export`);
 */

/** Adresse de secours, utilisee seulement si rien n'est configure. */
const FALLBACK_URL = 'https://app-gestionnaire.vercel.app';

/**
 * Adresse absolue de l'application, pour les clients qui n'ont pas de serveur a
 * eux (MSI Tauri, page de synchronisation manuelle).
 */
export function getAbsoluteAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL || '';
  return (configured || FALLBACK_URL).replace(/\/$/, '');
}

export function getApiBase(): string {
  // NEXT_PUBLIC_PORTAL_MODE = '1'  → web         → URL relative
  // NEXT_PUBLIC_PORTAL_MODE = '0'  → MSI Tauri   → URL absolue
  // Non defini                     → dev local   → URL relative (localhost)
  if (process.env.NEXT_PUBLIC_PORTAL_MODE === '0') {
    return getAbsoluteAppUrl();
  }
  return '';
}
