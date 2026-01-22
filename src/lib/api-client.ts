/**
 * API Client pour Tauri Desktop
 * 
 * Dans l'app Tauri, les appels API doivent pointer vers le backend Vercel
 * au lieu de chemins relatifs (qui pointaient vers tauri://localhost).
 */

/**
 * Construit l'URL complète pour un appel API
 * 
 * - En développement: utilise localhost:3000
 * - En production Tauri: utilise NEXT_PUBLIC_API_URL (Vercel)
 * - En production Web (Vercel): utilise chemins relatifs
 */
export function getApiUrl(path: string): string {
  // Enlever le slash initial si présent
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Si on est dans Tauri (détecté par window.__TAURI__)
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${apiUrl}/${cleanPath}`;
  }
  
  // Sinon, utiliser chemin relatif (pour le web sur Vercel)
  return `/${cleanPath}`;
}

/**
 * Wrapper autour de fetch qui utilise automatiquement l'URL correcte
 */
export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, init);
}
