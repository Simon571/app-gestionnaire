/**
 * POST   /api/auth/session  -> valide les identifiants et pose le cookie de session
 * GET    /api/auth/session  -> retourne la session courante (ou 401)
 * DELETE /api/auth/session  -> deconnexion
 *
 * Cette route remplace la verification d'identifiants qui etait faite dans le
 * navigateur (src/app/connexion/page.tsx). Les identifiants d'administrateur
 * d'assemblee etaient jusqu'ici ecrits en clair dans un composant client, donc
 * livres dans le bundle JavaScript public.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  attachSessionCookie,
  clearSessionCookie,
  createSessionToken,
  isSessionConfigured,
  readSession,
  type SessionPayload,
} from '@/lib/api-auth';
import { ADMIN_SESSION_TTL_MS, SESSION_TTL_MS } from '@/lib/session-token';
import { RATE_LIMIT_MAX_REQUESTS, checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import { readPublisherUsersState } from '@/lib/publisher-users-persistence';
import type { PublisherUser } from '@/lib/publisher-user-data';
import { getAssembly, verifyAssemblyPin } from '@/lib/tenants/assembly-registry';
import { StorageUnavailableError } from '@/lib/blob-store';
import { evaluateSubscription, type SubscriptionState } from '@/lib/tenants/subscription';

export const dynamic = 'force-dynamic';

/**
 * Les identifiants d'assemblee viennent desormais du registre
 * (`src/lib/tenants/assembly-registry.ts`), pas de l'environnement :
 * l'application sert plusieurs assemblees. ASSEMBLY_ID / ASSEMBLY_PIN ne
 * servent plus qu'a amorcer le registre au premier demarrage.
 */

/** Comparaison a temps constant de deux chaines de longueurs quelconques. */
function constantTimeEquals(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

async function findPublisherUser(
  personId: string,
  tenantId: string
): Promise<PublisherUser | null> {
  try {
    const raw = await readPublisherUsersState(tenantId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { users?: PublisherUser[] } | PublisherUser[];
    const users = Array.isArray(parsed) ? parsed : parsed.users ?? [];
    return users.find((user) => user.id === personId) ?? null;
  } catch (error) {
    console.error('auth/session: lecture des utilisateurs impossible', error);
    return null;
  }
}

const invalidCredentials = () =>
  NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });

/**
 * Role de session d'un proclamateur, deduit de sa fonction.
 *
 * Les deux orthographes coexistent dans les donnees selon l'origine de la fiche
 * (saisie web ou import plus ancien).
 */
function roleForPublisher(user: PublisherUser): SessionPayload['role'] {
  const fn = (user.spiritual?.function ?? '').toLowerCase();
  if (fn === 'elder' || fn === 'ancien') return 'elder';
  if (fn === 'servant' || fn === 'assistant') return 'servant';
  return 'publisher';
}

/**
 * Une panne du stockage persistant ne doit pas sortir en 500 sans corps : c'est
 * indiscernable d'un bug applicatif. Le registre des assemblees vit dans Redis,
 * donc une base Upstash supprimee ou injoignable empeche toute connexion — il
 * faut le dire.
 */
export async function POST(request: NextRequest) {
  try {
    return await handlePost(request);
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      console.error('auth/session: stockage injoignable', error.message);
      return NextResponse.json(
        {
          error:
            "Stockage indisponible : le registre des assemblees n'est pas lisible. Verifier UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN.",
          code: 'storage-unavailable',
        },
        { status: 503, headers: { 'Retry-After': '30' } }
      );
    }
    throw error;
  }
}

async function handlePost(request: NextRequest) {
  if (!isSessionConfigured()) {
    return NextResponse.json(
      {
        error: 'SESSION_SECRET non configure sur le serveur',
        hint: 'Definir SESSION_SECRET (32 caracteres minimum) dans l\'environnement.',
      },
      { status: 503 }
    );
  }

  // Limite anti-force brute, partagee entre instances via Redis quand il est
  // configure. La cle est l'IP : le PIN fait six chiffres, donc le debit est la
  // seule protection reelle.
  const { allowed, resetTime } = await checkRateLimit(
    getRateLimitKey(request, 'auth-session'),
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

  const mode = body.mode === 'person' ? 'person' : 'assembly';
  let payload: Omit<SessionPayload, 'exp'>;
  let state: SubscriptionState;
  let ttl: number;

  if (mode === 'assembly') {
    const assemblyId = String(body.assemblyId ?? '');
    const assemblyPin = String(body.assemblyPin ?? '');
    if (!assemblyId || !assemblyPin) return invalidCredentials();

    const verified = await verifyAssemblyPin(assemblyId, assemblyPin);
    if (!verified) return invalidCredentials();

    state = verified.state;
    if (state.access === 'blocked') {
      return NextResponse.json(
        { error: state.reason, code: 'assembly-suspended' },
        { status: 403 }
      );
    }

    payload = {
      sub: verified.assembly.id,
      role: 'assembly-admin',
      displayName: verified.assembly.name,
      tenantId: verified.assembly.id,
      access: state.access,
    };
    ttl = ADMIN_SESSION_TTL_MS;
  } else {
    const personId = String(body.personId ?? '');
    const pin = String(body.pin ?? '');
    // L'assemblee est desormais obligatoire : sans elle il est impossible de
    // savoir dans quel jeu de donnees chercher la personne, et deux assemblees
    // peuvent avoir des identifiants de personne identiques.
    const assemblyId = String(body.assemblyId ?? '');
    if (!personId || !pin || !assemblyId) return invalidCredentials();

    const assembly = await getAssembly(assemblyId);
    if (!assembly) return invalidCredentials();

    state = evaluateSubscription(assembly.subscription);
    if (state.access === 'blocked') {
      return NextResponse.json(
        { error: state.reason, code: 'assembly-suspended' },
        { status: 403 }
      );
    }

    const user = await findPublisherUser(personId, assembly.id);
    if (!user?.pin) {
      // Aucun PIN cote serveur : impossible d'authentifier cette personne. Les
      // PIN doivent etre synchronises via /api/publisher-app/users.
      return NextResponse.json(
        { error: 'Compte sans PIN enregistre sur le serveur' },
        { status: 409 }
      );
    }
    if (!constantTimeEquals(pin, user.pin)) return invalidCredentials();

    payload = {
      sub: user.id,
      // Le role vient de la fonction inscrite sur la fiche : un ancien qui se
      // connecte par l'onglet « Individu » doit conserver ses droits, sinon la
      // separation des roles le degraderait en simple proclamateur.
      role: roleForPublisher(user),
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      tenantId: assembly.id,
      access: state.access,
    };
    ttl = SESSION_TTL_MS;
  }

  const { token, expiresAt } = await createSessionToken(payload, ttl);
  const response = NextResponse.json({
    success: true,
    session: { ...payload, expiresAt: expiresAt.toISOString() },
    subscription: state,
  });
  return attachSessionCookie(response, token, expiresAt);
}

export async function GET(request: NextRequest) {
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Aucune session' }, { status: 401 });
  }

  // L'etat d'abonnement est relu dans le registre plutot que repris du jeton :
  // une suspension ou un renouvellement survenu depuis la connexion doit etre
  // visible sans attendre l'expiration du cookie.
  let subscription: SubscriptionState | null = null;
  if (session.tenantId) {
    const assembly = await getAssembly(session.tenantId);
    subscription = assembly ? evaluateSubscription(assembly.subscription) : null;
  }

  return NextResponse.json({ session, subscription });
}

export async function DELETE() {
  return clearSessionCookie(NextResponse.json({ success: true }));
}
