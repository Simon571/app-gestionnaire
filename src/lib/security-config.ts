/**
 * security-config.ts
 * Configuration de securite partagee entre le middleware (Edge runtime) et les
 * route handlers (Node runtime). Ne doit donc dependre d'aucun module Node.
 */

const DEFAULT_SITE_URL = 'https://app-gestionnaire.vercel.app';

/**
 * Origines de confiance. Le MSI Tauri sert son interface depuis un schema
 * interne (`tauri://localhost` sur macOS/Linux, `http://tauri.localhost` sur
 * Windows) et appelle l'API Vercel en cross-origin : ces origines doivent donc
 * rester autorisees, sinon l'application de bureau cesse de fonctionner.
 */
function defaultAllowedOrigins(): string[] {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  return [
    siteUrl,
    'tauri://localhost',
    'http://tauri.localhost',
    'https://tauri.localhost',
    'http://localhost:3000',
    'http://localhost:9002',
  ];
}

/**
 * Liste blanche effective. `ALLOWED_ORIGINS` (liste separee par des virgules)
 * permet d'ajouter les domaines de preview Vercel ou un domaine personnalise
 * sans rebuild du code.
 */
export function getAllowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return [...new Set([...defaultAllowedOrigins(), ...extra])];
}

/**
 * Les deploiements de preview Vercel ont une URL differente a chaque commit.
 * On les accepte via un motif plutot que de tenir une liste impossible a jour.
 */
function isVercelPreviewOrigin(origin: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // requete same-origin ou client non-navigateur
  if (getAllowedOrigins().includes(origin.replace(/\/$/, ''))) return true;
  return isVercelPreviewOrigin(origin);
}

/**
 * En-tetes CORS pour une origine donnee. On renvoie l'origine exacte et non
 * `*` : c'est indispensable pour pouvoir utiliser `credentials: 'include'`, que
 * le caractere generique interdit.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Api-Key, X-Api-Token, X-Device-Id, X-Timestamp, X-Signature',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Content-Security-Policy.
 *
 * `unsafe-inline` / `unsafe-eval` sur script-src restent necessaires : Next.js
 * injecte des scripts inline (hydratation, JSON-LD de layout.tsx) et le mode
 * developpement evalue du code pour le HMR. Les retirer demanderait de passer
 * aux nonces via un middleware dedie.
 */
function contentSecurityPolicy(): string {
  const connectSources = [
    "'self'",
    'https://*.supabase.co',
    'https://*.upstash.io',
    'https://generativelanguage.googleapis.com',
    'https://github.com',
    'https://*.githubusercontent.com',
    (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, ''),
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(' ')}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * En-tetes de securite appliques a toutes les reponses.
 *
 * Note : on n'impose volontairement pas de `Cache-Control: no-store` global.
 * Cela desactiverait la mise en cache des assets statiques et des pages
 * prerendues, au prix d'une degradation nette des performances. Les routes qui
 * exposent des donnees personnelles posent deja leurs propres en-tetes de
 * cache.
 */
export function securityHeaderEntries(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Security-Policy': contentSecurityPolicy(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };

  if (process.env.NODE_ENV === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}
