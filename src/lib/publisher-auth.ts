/**
 * publisher-auth.ts
 * Verification centralisee de l'identite d'un proclamateur (PIN a 4 chiffres).
 *
 * Ces controles etaient dupliques dans quatre route handlers, chacun avec sa
 * propre comparaison `===` et sa propre definition de « ancien ou assistant ».
 * Les regrouper evite qu'une correction n'en oublie une.
 *
 * LIMITE ASSUMEE
 * --------------
 * Le PIN est stocke en clair dans `publisher-users.json`, et transmis a
 * l'application mobile par `/api/publisher-app/auto-sync`, parce que celle-ci
 * verifie l'identite hors ligne, sans reseau. Le hacher cote serveur
 * n'apporterait rien tant que le client detient la valeur en clair : il faudrait
 * d'abord publier une version de l'app qui stocke un hash. La comparaison est
 * donc rendue insensible au temps ici, mais le stockage reste a migrer.
 */
import crypto from 'crypto';

export type PublisherRecord = Record<string, unknown>;

/** Comparaison a temps constant de deux chaines de longueurs quelconques. */
export function constantTimeEquals(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function findPublisher(
  users: PublisherRecord[],
  userId: string
): PublisherRecord | null {
  if (!userId) return null;
  return users.find((user) => String(user['id'] ?? '') === userId) ?? null;
}

/** Vrai si `pin` correspond au PIN enregistre pour cet utilisateur. */
export function verifyPublisherPin(
  user: PublisherRecord | null | undefined,
  pin: string | undefined
): boolean {
  const stored = String(user?.['pin'] ?? '');
  if (!user || !stored || !pin) return false;
  return constantTimeEquals(pin, stored);
}

/**
 * Fonctions autorisees a agir au nom d'un autre proclamateur.
 *
 * Les deux orthographes coexistent dans les donnees selon que la fiche vient du
 * web (`elder`) ou d'un import plus ancien (`ancien`).
 */
const ADMIN_FUNCTIONS = new Set(['elder', 'ancien', 'servant', 'assistant']);

export function publisherFunction(user: PublisherRecord | null | undefined): string {
  const spiritual = user?.['spiritual'] as Record<string, unknown> | undefined;
  return String(spiritual?.['function'] ?? user?.['function'] ?? '').toLowerCase();
}

export function isAssemblyServant(user: PublisherRecord | null | undefined): boolean {
  return ADMIN_FUNCTIONS.has(publisherFunction(user));
}

export function publisherDisplayName(
  user: PublisherRecord | null | undefined,
  fallback: string
): string {
  const parts = [user?.['firstName'], user?.['lastName']]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean);
  return (
    String(user?.['displayName'] ?? '').trim() || parts.join(' ') || fallback
  );
}

export interface AdminOverride {
  actorId: string;
  actorPin: string;
}

/**
 * Valide un envoi effectue par un ancien ou un assistant pour le compte d'un
 * proclamateur. Retourne l'acteur, ou `null` si le PIN est faux ou si la
 * fonction ne le permet pas.
 */
export function verifyAdminOverride(
  users: PublisherRecord[],
  override: AdminOverride | undefined
): PublisherRecord | null {
  if (!override) return null;
  const actor = findPublisher(users, override.actorId);
  if (!verifyPublisherPin(actor, override.actorPin)) return null;
  if (!isAssemblyServant(actor)) return null;
  return actor;
}
