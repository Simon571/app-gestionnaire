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

/**
 * Routes d'administration fermees **quel que soit** `API_AUTH_MODE`.
 *
 * Le mode 'report' existe pour ne pas couper le MSI et l'APK deja distribues, qui
 * ne s'authentifient pas encore. Mais il laisse ouvertes des routes qui ecrivent
 * les donnees de l'assemblee — annuaire, familles, taches, assistance,
 * attributions, reparations de fichiers — alors qu'aucun client publie ne les
 * appelle : elles ne servent qu'au tableau de bord, qui a un cookie de session.
 *
 * Les fermer maintenant ne fait donc perdre aucun usage legitime, et rend
 * effectif tout le cloisonnement par assemblee sans attendre une nouvelle
 * version des clients.
 *
 * La fermeture ne vise que les **methodes mutantes**. Les lectures restent
 * regies par `API_AUTH_MODE` : l'application mobile lit le programme et
 * l'annuaire, et une lecture mal fermee couperait un usage reel, alors qu'une
 * ecriture non authentifiee n'a jamais d'usage legitime.
 *
 * CONSEQUENCE A CONNAITRE : un poste MSI qui n'ouvrait jamais la page de
 * connexion devra s'y connecter avant de modifier quoi que ce soit. C'est le
 * prix de la fermeture ; pour la differer, `API_ADMIN_ENFORCE=off`.
 */
const ADMIN_ONLY_PATHS = [
  '/api/assign-groups',
  '/api/attendance',
  '/api/backup',
  '/api/export-people-to-publisher',
  '/api/families',
  '/api/gdpr',
  '/api/internal',
  '/api/preaching-groups',
  '/api/publisher-app/actionable-jobs',
  '/api/publisher-app/auto-sync',
  '/api/publisher-app/cleanup-jobs',
  '/api/publisher-app/create-sync-job',
  '/api/publisher-app/mobile-devices',
  '/api/publisher-app/mobile-users',
  '/api/publisher-app/users/web-sync',
  '/api/repair-publisher-users',
  '/api/responsibilities',
  '/api/sync-activity',
  '/api/sync-publisher-users-to-people',
  '/api/taches',
  '/api/update-workbook',
  '/api/vcm',
];

/** Vrai si la fermeture immediate des routes d'administration est active. */
function adminEnforcementEnabled(): boolean {
  return (process.env.API_ADMIN_ENFORCE || '').trim().toLowerCase() !== 'off';
}

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
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

  // Ecriture sur une route d'administration : refusee meme en mode 'report'.
  // Aucun client publie ne l'appelle, et une ecriture anonyme dans les donnees
  // d'une assemblee ne peut etre legitime.
  if (
    adminEnforcementEnabled() &&
    isAdminOnlyPath(pathname) &&
    isMutatingMethod(method)
  ) {
    return deny(401, 'authentication-required');
  }

  return {
    allowed: true,
    subject: 'none',
    warning: 'unauthenticated-request-allowed',
  };
}

export { SESSION_COOKIE };
