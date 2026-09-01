/**
 * POST /api/auth/super-admin -> connexion de l'administrateur de la plateforme
 *
 * Compte distinct de celui des assemblees : email + mot de passe plutot qu'un
 * PIN de six chiffres, car cette session controle l'ensemble du parc et les
 * abonnements. La session obtenue n'a pas de `tenantId` : le super admin
 * n'appartient a aucune assemblee.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  attachSessionCookie,
  createSessionToken,
  isSessionConfigured,
} from '@/lib/api-auth';
import { ADMIN_SESSION_TTL_MS } from '@/lib/session-token';
import { RATE_LIMIT_MAX_REQUESTS, checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import {
  isSuperAdminConfigured,
  verifySuperAdmin,
} from '@/lib/tenants/super-admin-account';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isSessionConfigured()) {
    return NextResponse.json(
      {
        error: 'SESSION_SECRET non configure sur le serveur',
        hint: 'Definir SESSION_SECRET (32 caracteres minimum) dans l\'environnement.',
      },
      { status: 503 }
    );
  }

  if (!isSuperAdminConfigured()) {
    return NextResponse.json(
      {
        error: 'Compte super admin non configure',
        hint:
          'Generer le hash avec `npx tsx scripts/hash-password.ts`, puis definir ' +
          'SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD_HASH.',
      },
      { status: 503 }
    );
  }

  const { allowed, resetTime } = await checkRateLimit(
    getRateLimitKey(request, 'auth-super-admin'),
    RATE_LIMIT_MAX_REQUESTS.login
  );
  if (!allowed) {
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Trop de tentatives de connexion', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const email = String(body.email ?? '');
  const password = String(body.password ?? '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  if (!(await verifySuperAdmin(email, password))) {
    return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
  }

  const payload = {
    sub: email.trim().toLowerCase(),
    role: 'super-admin' as const,
    displayName: 'Administrateur plateforme',
    access: 'full' as const,
  };

  const { token, expiresAt } = await createSessionToken(payload, ADMIN_SESSION_TTL_MS);
  const response = NextResponse.json({
    success: true,
    session: { ...payload, expiresAt: expiresAt.toISOString() },
  });
  return attachSessionCookie(response, token, expiresAt);
}
