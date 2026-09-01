/**
 * api-auth.ts
 * Aides d'authentification pour les route handlers (runtime Node).
 *
 * L'application de la politique se fait dans le middleware
 * (`src/lib/api-auth-policy.ts`), qui couvre toutes les routes /api d'un seul
 * point. Ce module fournit ce qui necessite le runtime Node : pose du cookie de
 * session et lecture de la session dans un handler.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  createSessionToken,
  isSessionConfigured,
  verifySessionToken,
} from '@/lib/session-token';
import type { SessionPayload } from '@/lib/session-token';

export { SESSION_COOKIE, createSessionToken, isSessionConfigured };
export type { SessionPayload };

/** Lit et valide la session portee par le cookie de la requete. */
export async function readSession(request: NextRequest): Promise<SessionPayload | null> {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

const cookieOptions = () =>
  ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  });

/** Applique le cookie de session a une reponse. */
export function attachSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

/**
 * Exige une session pour un handler donne. Utile pour les routes qui doivent
 * connaitre l'utilisateur (et pas seulement savoir qu'il est authentifie),
 * independamment de la politique globale du middleware.
 */
export async function requireSession(
  request: NextRequest
): Promise<{ session: SessionPayload } | { response: NextResponse }> {
  const session = await readSession(request);
  if (!session) {
    return {
      response: NextResponse.json({ error: 'Authentification requise' }, { status: 401 }),
    };
  }
  return { session };
}
