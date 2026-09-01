import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SESSION_COOKIE,
  createSessionToken,
  isSessionConfigured,
  timingSafeEqualString,
  verifySessionToken,
} from '@/lib/session-token';
import { evaluateApiRequest, isPublicPath } from '@/lib/api-auth-policy';
import { corsHeaders, isOriginAllowed } from '@/lib/security-config';

const SECRET = 'a'.repeat(48);

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://app-gestionnaire.vercel.app';
  delete process.env.API_ACCESS_TOKEN;
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.API_AUTH_MODE;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

const headers = (init: Record<string, string> = {}) => new Headers(init);

describe('session-token', () => {
  it('signe puis verifie un jeton aller-retour', async () => {
    const { token, expiresAt } = await createSessionToken({
      sub: 'ASSEMB-1',
      role: 'assembly-admin',
      displayName: 'Assemblee test',
    });

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('ASSEMB-1');
    expect(payload?.role).toBe('assembly-admin');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejette un jeton dont la charge utile a ete modifiee', async () => {
    const { token } = await createSessionToken({
      sub: 'ASSEMB-1',
      role: 'publisher',
      displayName: 'Personne',
    });

    const [body, signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({
        sub: 'ASSEMB-1',
        role: 'assembly-admin',
        displayName: 'Personne',
        exp: Date.now() + 60_000,
      })
    ).toString('base64url');

    expect(body).not.toBe(forged);
    expect(await verifySessionToken(`${forged}.${signature}`)).toBeNull();
  });

  it('rejette un jeton signe avec un autre secret', async () => {
    const { token } = await createSessionToken({
      sub: 'ASSEMB-1',
      role: 'elder',
      displayName: 'Ancien',
    });

    process.env.SESSION_SECRET = 'b'.repeat(48);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejette un jeton expire', async () => {
    const { token } = await createSessionToken(
      { sub: 'ASSEMB-1', role: 'publisher', displayName: 'Personne' },
      -1000
    );
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('refuse de signer sans secret suffisamment long', async () => {
    process.env.SESSION_SECRET = 'trop-court';
    expect(isSessionConfigured()).toBe(false);
    await expect(
      createSessionToken({ sub: 'x', role: 'publisher', displayName: 'x' })
    ).rejects.toThrow(/SESSION_SECRET/);
  });

  it('compare deux chaines sans court-circuit sur la longueur', () => {
    expect(timingSafeEqualString('abcdef', 'abcdef')).toBe(true);
    expect(timingSafeEqualString('abcdef', 'abcdeg')).toBe(false);
    expect(timingSafeEqualString('abc', 'abcdef')).toBe(false);
  });
});

describe('security-config', () => {
  it('autorise le site, le MSI Tauri et les previews Vercel', () => {
    expect(isOriginAllowed('https://app-gestionnaire.vercel.app')).toBe(true);
    expect(isOriginAllowed('tauri://localhost')).toBe(true);
    expect(isOriginAllowed('http://tauri.localhost')).toBe(true);
    expect(isOriginAllowed('https://app-gestionnaire-abc123.vercel.app')).toBe(true);
    expect(isOriginAllowed(null)).toBe(true); // client non navigateur
  });

  it('refuse une origine inconnue', () => {
    expect(isOriginAllowed('https://attaquant.example')).toBe(false);
    expect(isOriginAllowed('https://evil.vercel.app.attaquant.example')).toBe(false);
  });

  it('accepte les origines supplementaires declarees en environnement', () => {
    process.env.ALLOWED_ORIGINS = 'https://assemblee.example, https://autre.example';
    expect(isOriginAllowed('https://assemblee.example')).toBe(true);
    expect(isOriginAllowed('https://autre.example')).toBe(true);
  });

  it("n'emet jamais un joker comme origine autorisee", () => {
    const allowed = corsHeaders('https://app-gestionnaire.vercel.app');
    expect(allowed['Access-Control-Allow-Origin']).toBe('https://app-gestionnaire.vercel.app');
    expect(allowed['Access-Control-Allow-Credentials']).toBe('true');

    const refused = corsHeaders('https://attaquant.example');
    expect(refused['Access-Control-Allow-Origin']).toBeUndefined();
    expect(refused['Access-Control-Allow-Credentials']).toBeUndefined();
  });
});

describe('api-auth-policy', () => {
  it('identifie les routes publiques', () => {
    expect(isPublicPath('/api/app/version')).toBe(true);
    expect(isPublicPath('/api/auth/session')).toBe(true);
    expect(isPublicPath('/api/families')).toBe(false);
  });

  it('accepte une session valide', async () => {
    const { token } = await createSessionToken({
      sub: 'ASSEMB-1',
      role: 'assembly-admin',
      displayName: 'Assemblee',
    });

    const decision = await evaluateApiRequest('/api/families', headers(), token);
    expect(decision.allowed).toBe(true);
    expect(decision.subject).toBe('session');
    expect(decision.session?.sub).toBe('ASSEMB-1');
  });

  it('accepte le jeton de service', async () => {
    process.env.API_ACCESS_TOKEN = 'c'.repeat(32);
    const decision = await evaluateApiRequest(
      '/api/families',
      headers({ 'x-api-token': 'c'.repeat(32) }),
      undefined
    );
    expect(decision.allowed).toBe(true);
    expect(decision.subject).toBe('service');
  });

  it('ignore un jeton de service trop court pour etre sur', async () => {
    process.env.API_AUTH_MODE = 'enforce';
    process.env.API_ACCESS_TOKEN = 'court';
    const decision = await evaluateApiRequest(
      '/api/families',
      headers({ 'x-api-token': 'court' }),
      undefined
    );
    expect(decision.allowed).toBe(false);
  });

  it('bloque une requete anonyme en mode enforce', async () => {
    process.env.API_AUTH_MODE = 'enforce';
    const decision = await evaluateApiRequest('/api/families', headers(), undefined);
    expect(decision.allowed).toBe(false);
    expect(decision.subject).toBe('none');
  });

  it('laisse passer une requete anonyme en mode report, en la signalant', async () => {
    process.env.API_AUTH_MODE = 'report';
    const decision = await evaluateApiRequest('/api/families', headers(), undefined);
    expect(decision.allowed).toBe(true);
    expect(decision.warning).toBe('unauthenticated-request-allowed');
  });

  it('delegue uniquement les routes qui verifient la signature d appareil', async () => {
    process.env.API_AUTH_MODE = 'enforce';
    const signed = headers({ 'x-device-id': 'mobile-main', 'x-signature': 'deadbeef' });

    const delegated = await evaluateApiRequest('/api/publisher-app/updates', signed, undefined);
    expect(delegated.allowed).toBe(true);
    expect(delegated.subject).toBe('delegated');

    // Route sans verification cote handler : les memes en-tetes ne doivent pas
    // suffire, sinon n'importe qui les fabrique.
    const notDelegated = await evaluateApiRequest(
      '/api/publisher-app/mobile-users',
      signed,
      undefined
    );
    expect(notDelegated.allowed).toBe(false);
  });

  it('expose le nom du cookie de session attendu', () => {
    expect(SESSION_COOKIE).toBe('gestionnaire_session');
  });
});

describe('api-auth-policy : multi-assemblees', () => {
  const adminToken = (access: 'full' | 'read-only' | 'blocked') =>
    createSessionToken({
      sub: 'ASSEMB-1',
      role: 'assembly-admin',
      displayName: 'Assemblee Une',
      tenantId: 'ASSEMB-1',
      access,
    });

  it('propage l\'assemblee de la session', async () => {
    const { token } = await adminToken('full');
    const decision = await evaluateApiRequest('/api/families', headers(), token, 'GET');
    expect(decision.allowed).toBe(true);
    expect(decision.tenantId).toBe('ASSEMB-1');
  });

  it('autorise la lecture mais refuse l\'ecriture quand l\'abonnement est expire', async () => {
    const { token } = await adminToken('read-only');

    const read = await evaluateApiRequest('/api/families', headers(), token, 'GET');
    expect(read.allowed).toBe(true);

    const write = await evaluateApiRequest('/api/families', headers(), token, 'POST');
    expect(write.allowed).toBe(false);
    expect(write.status).toBe(402);
    expect(write.code).toBe('subscription-expired');
  });

  it('bloque lectures et ecritures pour une assemblee suspendue', async () => {
    const { token } = await adminToken('blocked');

    for (const method of ['GET', 'POST']) {
      const decision = await evaluateApiRequest('/api/families', headers(), token, method);
      expect(decision.allowed).toBe(false);
      expect(decision.status).toBe(403);
      expect(decision.code).toBe('assembly-suspended');
    }
  });

  it('reserve /api/super-admin au role super-admin', async () => {
    const { token: adminSession } = await adminToken('full');
    const refused = await evaluateApiRequest(
      '/api/super-admin/assemblies',
      headers(),
      adminSession,
      'GET'
    );
    // 403 et non 401 : se reconnecter comme admin d'assemblee n'y changerait rien.
    expect(refused.allowed).toBe(false);
    expect(refused.status).toBe(403);

    const { token: superSession } = await createSessionToken({
      sub: 'admin@example.org',
      role: 'super-admin',
      displayName: 'Plateforme',
      access: 'full',
    });
    const granted = await evaluateApiRequest(
      '/api/super-admin/assemblies',
      headers(),
      superSession,
      'GET'
    );
    expect(granted.allowed).toBe(true);
    expect(granted.subject).toBe('super-admin');
  });

  it('refuse l\'administration de la plateforme au jeton de service', async () => {
    process.env.API_ACCESS_TOKEN = 'd'.repeat(32);
    const decision = await evaluateApiRequest(
      '/api/super-admin/assemblies',
      headers({ 'x-api-token': 'd'.repeat(32) }),
      undefined,
      'GET'
    );
    // Un secret de machine partage ne doit pas donner acces au parc entier.
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(401);
  });

  it('exige une authentification sur /api/super-admin meme en mode report', async () => {
    process.env.API_AUTH_MODE = 'report';
    const decision = await evaluateApiRequest(
      '/api/super-admin/assemblies',
      headers(),
      undefined,
      'GET'
    );
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(401);
  });

  it('n\'attribue aucune assemblee au super admin', async () => {
    const { token } = await createSessionToken({
      sub: 'admin@example.org',
      role: 'super-admin',
      displayName: 'Plateforme',
      access: 'full',
    });
    const decision = await evaluateApiRequest('/api/families', headers(), token, 'GET');
    expect(decision.tenantId).toBeUndefined();
  });
});
