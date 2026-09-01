/**
 * api-auth-policy.ts
 * Politique d'acces aux routes /api, appliquee par le middleware.
 *
 * Ce module doit rester compatible Edge runtime : pas de `node:crypto`, pas de
 * `fs`. La verification de session utilise `session-token` (Web Crypto).
 */

import { SESSION_COOKIE, verifySessionToken, timingSafeEqualString } from '@/lib/session-token';
import type { SessionPayload } from '@/lib/session-token';
import { isMutatingMethod } from '@/lib/tenants/subscription';

export type AuthMode = 'enforce' | 'report';

export function getAuthMode(): AuthMode {
  return process.env.API_AUTH_MODE === 'enforce' ? 'enforce' : 'report';
}

/** Prefixe reserve a l'administration de la plateforme. */
const SUPER_ADMIN_PREFIX = '/api/super-admin';

/**
 * Routes volontairement ouvertes. Elles n'exposent aucune donnee personnelle :
 * metadonnees de version, liens de telechargement publics, et les routes de
 * connexion elles-memes (protegees par leur propre rate limit).
 */
const PUBLIC_PATHS = [
  '/api/app/version',
  '/api/auth/session',
  '/api/auth/super-admin',
  '/api/auth/login',
  '/api/download/android',
  '/api/download/windows',
  '/api/server-info',
];

/**
 * Routes dont l'authentification est assuree par le handler lui-meme, via la
 * signature d'appareil publisher-sync (HMAC + registre d'appareils). Ce
 * mecanisme lit le registre sur le systeme de fichiers et ne peut donc pas
 * s'executer dans le middleware : on delegue.
 *
 * La liste est explicite et non un prefixe : chacune de ces routes appelle
 * `handlePublisherSyncRequest` ou `authenticateDevice`. Y ajouter une route qui
 * ne verifie rien la rendrait accessible a quiconque envoie les en-tetes
 * `x-device-id` et `x-signature`, meme invalides.
 */
const DEVICE_AUTH_PATHS = [
  '/api/publisher-app/ack',
  '/api/publisher-app/activity',
  '/api/publisher-app/import',
  '/api/publisher-app/incoming',
  '/api/publisher-app/notifications',
  '/api/publisher-app/queue',
  '/api/publisher-app/send',
  '/api/publisher-app/updates',
  '/api/publisher-app/users/export',
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname === `${path}/`
  );
}

/**
 * Routes qu'un proclamateur peut modifier : celles qui ne touchent que ses
 * propres donnees.
 *
 * Tout le reste (familles, personnes, responsabilites, taches, assistance,
 * attributions Vie et ministere, administration de la Publisher App) releve des
 * anciens. Le role est porte par le cookie, donc masquer un bouton dans
 * l'interface ne suffit pas : la regle est appliquee ici.
 *
 * La lecture reste ouverte a l'ensemble de l'assemblee : l'application mobile a
 * besoin du programme, des groupes et de l'annuaire pour fonctionner.
 */
const PUBLISHER_WRITABLE_PATHS = [
  '/api/publisher-app/activity',
  '/api/publisher-app/mobile-reports',
  '/api/publisher-app/emergency-contacts',
  '/api/publisher-app/ack',
  '/api/publisher-app/incoming',
  '/api/taches',
];

export function isPublisherWritablePath(pathname: string): boolean {
  return PUBLISHER_WRITABLE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function delegatesToDeviceAuth(pathname: string): boolean {
  return DEVICE_AUTH_PATHS.some(
    (path) => pathname === path || pathname === `${path}/`
  );
}

/** Verifie le jeton de service partage, s'il est configure. */
export function matchServiceToken(headers: Headers): boolean {
  const expected = (process.env.API_ACCESS_TOKEN || '').trim();
  if (expected.length < 16) return false;

  const provided =
    headers.get('x-api-token') ??
    headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';

  return provided.length > 0 && timingSafeEqualString(provided, expected);
}

export interface PolicyDecision {
  /** true si la requete peut poursuivre. */
  allowed: boolean;
  /** Code HTTP a renvoyer quand `allowed` est faux. */
  status?: 401 | 402 | 403;
  /** Code machine, destine au client pour afficher le bon message. */
  code?:
    | 'authentication-required'
    | 'subscription-expired'
    | 'assembly-suspended'
    | 'forbidden'
    | 'publisher-read-only';
  /** Nature de l'identite reconnue, ou 'none'. */
  subject: 'service' | 'session' | 'delegated' | 'public' | 'super-admin' | 'none';
  session?: SessionPayload;
  /** Assemblee a propager aux route handlers via `x-tenant-id`. */
  tenantId?: string;
  /** Renseigne quand une requete non authentifiee passe grace au mode 'report'. */
  warning?: string;
}

const deny = (
  status: 401 | 402 | 403,
  code: NonNullable<PolicyDecision['code']>
): PolicyDecision => ({ allowed: false, status, code, subject: 'none' });

/**
 * Decide du sort d'une requete /api.
 *
 * En mode 'report', une requete non authentifiee est autorisee mais signalee.
 * C'est un mode de transition destine a ne pas interrompre le MSI et l'APK deja
 * distribues ; il laisse les donnees accessibles et doit etre quitte des que
 * les clients savent s'authentifier.
 *
 * Les restrictions liees a l'abonnement, elles, s'appliquent dans les deux
 * modes : elles concernent une session authentifiee, il n'y a donc aucun client
 * historique a menager.
 */
export async function evaluateApiRequest(
  pathname: string,
  headers: Headers,
  cookieValue: string | undefined,
  method = 'GET'
): Promise<PolicyDecision> {
  const isSuperAdminRoute =
    pathname === SUPER_ADMIN_PREFIX || pathname.startsWith(`${SUPER_ADMIN_PREFIX}/`);

  if (isPublicPath(pathname)) {
    return { allowed: true, subject: 'public' };
  }

  // Le jeton de service est un secret de machine, sans notion d'assemblee : il
  // ne doit pas ouvrir l'administration de la plateforme.
  if (matchServiceToken(headers) && !isSuperAdminRoute) {
    return { allowed: true, subject: 'service' };
  }

  const session = await verifySessionToken(cookieValue);

  if (session) {
    if (session.role === 'super-admin') {
      return { allowed: true, subject: 'super-admin', session };
    }

    if (isSuperAdminRoute) {
      // Session valide mais role insuffisant : 403 et non 401, se reconnecter
      // n'y changerait rien.
      return deny(403, 'forbidden');
    }

    if (session.access === 'blocked') {
      return deny(403, 'assembly-suspended');
    }

    if (session.access === 'read-only' && isMutatingMethod(method)) {
      return deny(402, 'subscription-expired');
    }

    // Separation des roles a l'interieur d'une assemblee : un proclamateur lit,
    // mais ne modifie que ses propres donnees.
    if (
      session.role === 'publisher' &&
      isMutatingMethod(method) &&
      !isPublisherWritablePath(pathname)
    ) {
      return deny(403, 'publisher-read-only');
    }

    return { allowed: true, subject: 'session', session, tenantId: session.tenantId };
  }

  if (isSuperAdminRoute) {
    return deny(401, 'authentication-required');
  }

  // La signature d'appareil ne peut etre verifiee qu'en runtime Node : on laisse
  // passer pour que le handler tranche. Les routes concernees doivent imposer
  // `authenticateDevice`.
  if (delegatesToDeviceAuth(pathname) && headers.get('x-device-id') && headers.get('x-signature')) {
    return { allowed: true, subject: 'delegated' };
  }

  if (getAuthMode() === 'enforce') {
    return deny(401, 'authentication-required');
  }

  return {
    allowed: true,
    subject: 'none',
    warning: 'unauthenticated-request-allowed',
  };
}

export { SESSION_COOKIE };
