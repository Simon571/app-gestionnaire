import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applyCors, handlePreflight, securityHeaders } from '@/middleware-security';
import { isOriginAllowed } from '@/lib/security-config';
import { RATE_LIMIT_MAX_REQUESTS, checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import { SESSION_COOKIE, evaluateApiRequest } from '@/lib/api-auth-policy';
import { TENANT_HEADER } from '@/lib/tenants/tenant-context';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['fr', 'en'],

  // Used when no locale matches
  defaultLocale: 'fr',

  // Le préfixe de locale est toujours présent (/fr/... ou /en/...)
  localePrefix: 'always',
});

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Les pages du site vitrine sont les seules à passer par next-intl. Les modules
 * de l'application (/personnes, /assembly, /programme…) vivent hors de
 * [locale] et doivent router directement, sans réécriture de locale.
 */
function isLocalizedPath(pathname: string): boolean {
  return pathname === '/' || /^\/(fr|en)(\/|$)/.test(pathname);
}

/**
 * Garde-fou global sur /api : origine, debit, puis authentification. Applique
 * la politique a toutes les routes d'un seul point, ce qui evite qu'une route
 * ajoutee plus tard soit oubliee.
 */
async function guardApiRequest(request: NextRequest): Promise<NextResponse> {
  const origin = request.headers.get('origin');

  // Une écriture provenant d'une origine inconnue est refusée. Les clients non
  // navigateur (MSI, app Flutter, scripts) n'envoient pas d'en-tête Origin et
  // ne sont donc pas affectés ; leur authentification est vérifiée ensuite.
  if (MUTATING_METHODS.has(request.method) && !isOriginAllowed(origin)) {
    return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 });
  }

  const limit = MUTATING_METHODS.has(request.method)
    ? RATE_LIMIT_MAX_REQUESTS.mutation
    : RATE_LIMIT_MAX_REQUESTS.apiCall;

  const { allowed, remaining, resetTime } = await checkRateLimit(
    getRateLimitKey(request, `api:${request.method}`),
    limit
  );

  if (!allowed) {
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Trop de requêtes', retryAfter },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  const decision = await evaluateApiRequest(
    request.nextUrl.pathname,
    request.headers,
    request.cookies.get(SESSION_COOKIE)?.value,
    request.method
  );

  if (!decision.allowed) {
    const status = decision.status ?? 401;
    // Message choisi sur le code plutot que sur le statut : deux refus en 403
    // n'ont pas la meme cause, et l'utilisateur doit savoir laquelle.
    const messages: Record<string, string> = {
      'authentication-required': 'Authentification requise',
      'subscription-expired': 'Abonnement expire : modifications suspendues',
      'assembly-suspended': 'Assemblee suspendue',
      'publisher-read-only':
        'Modification reservee aux anciens et assistants de l’assemblee',
      forbidden: 'Acces refuse',
    };
    return NextResponse.json(
      {
        error: (decision.code && messages[decision.code]) || 'Acces refuse',
        code: decision.code,
      },
      { status }
    );
  }

  // Le tenant est pose sur la *requete* : les route handlers (runtime Node) le
  // lisent via `headers()`, et `blob-store` s'en sert pour cloisonner les
  // donnees. Un en-tete `x-tenant-id` fourni par le client est ecrase, sinon il
  // suffirait de l'envoyer soi-meme pour lire les donnees d'une autre assemblee.
  const forwarded = new Headers(request.headers);
  forwarded.delete(TENANT_HEADER);
  if (decision.tenantId) {
    forwarded.set(TENANT_HEADER, decision.tenantId);
  }

  const response = NextResponse.next({ request: { headers: forwarded } });
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  response.headers.set('X-Auth-Subject', decision.subject);

  if (decision.warning) {
    // Rend le mode de transition visible dans les logs d'acces et les outils de
    // developpement, pour ne pas l'oublier en place.
    response.headers.set('X-Auth-Warning', decision.warning);
    console.warn(
      `API_AUTH_MODE=report : requete non authentifiee autorisee ` +
        `(${request.method} ${request.nextUrl.pathname})`
    );
  }

  return response;
}

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return handlePreflight(request);
  }

  if (pathname.startsWith('/api/')) {
    return securityHeaders(applyCors(await guardApiRequest(request), request));
  }

  const response = isLocalizedPath(pathname)
    ? (intlMiddleware(request) as NextResponse)
    : NextResponse.next();

  return securityHeaders(response);
}

export const config = {
  /*
   * On intercepte tout sauf les assets statiques, afin que les en-têtes de
   * sécurité couvrent l'ensemble des pages et des routes API. Le routage de
   * locale reste, lui, restreint à `isLocalizedPath`.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|downloads/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest|txt|xml|msi|apk)$).*)',
  ],
};
