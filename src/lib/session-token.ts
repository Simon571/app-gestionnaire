/**
 * session-token.ts
 * Signature et verification du cookie de session.
 *
 * Implemente avec l'API Web Crypto (`globalThis.crypto.subtle`) et non
 * `node:crypto`, afin d'etre utilisable a la fois dans le middleware (Edge
 * runtime) et dans les route handlers (Node runtime). C'est ce qui permet
 * d'appliquer l'authentification en un point unique.
 */

export interface SessionPayload {
  /** Identifiant du sujet : personId ou assemblyId. */
  sub: string;
  /** Role applicatif, aligne sur les fonctions existantes de l'app. */
  role: 'super-admin' | 'assembly-admin' | 'elder' | 'servant' | 'publisher';
  displayName: string;
  /** Expiration en millisecondes depuis l'epoch. */
  exp: number;
  /**
   * Assemblee a laquelle la session est rattachee. Absent pour le super admin,
   * qui n'appartient a aucune assemblee et administre la plateforme.
   */
  tenantId?: string;
  /**
   * Droits decoulant de l'abonnement au moment de la connexion. Embarque dans
   * le jeton signe pour que le middleware (Edge) puisse trancher sans lire le
   * registre, qui exige le runtime Node. Les route handlers re-verifient le
   * registre sur les mutations : c'est lui qui fait foi.
   */
  access?: 'full' | 'read-only' | 'blocked';
}

export const SESSION_COOKIE = 'gestionnaire_session';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
/**
 * Duree plus courte pour les sessions d'administration : l'etat d'abonnement
 * embarque dans le jeton n'est rafraichi qu'a la connexion, une suspension ne
 * doit donc pas rester sans effet trop longtemps.
 */
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 h

const encoder = new TextEncoder();

/**
 * Le secret doit venir de l'environnement. Sans secret suffisamment long on
 * refuse de signer : se replier sur une valeur par defaut reviendrait a n'avoir
 * aucune authentification tout en pretendant le contraire.
 */
function getSecret(): string | null {
  const secret = (process.env.SESSION_SECRET || '').trim();
  return secret.length >= 32 ? secret : null;
}

export function isSessionConfigured(): boolean {
  return getSecret() !== null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  // Allocation explicite sur un ArrayBuffer : `crypto.subtle` exige un
  // BufferSource, que `new Uint8Array(length)` ne garantit pas au niveau des
  // types (il pourrait etre adosse a un SharedArrayBuffer).
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(body: string, secret: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    encoder.encode(body)
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>,
  ttlMs: number = SESSION_TTL_MS
): Promise<{ token: string; expiresAt: Date }> {
  const secret = getSecret();
  if (!secret) throw new Error('SESSION_SECRET manquant ou trop court (32 caracteres minimum)');

  const exp = Date.now() + ttlMs;
  const body = toBase64Url(
    encoder.encode(JSON.stringify({ ...payload, exp } satisfies SessionPayload))
  );
  return { token: `${body}.${await sign(body, secret)}`, expiresAt: new Date(exp) };
}

/**
 * Verifie la signature puis l'expiration. `crypto.subtle.verify` compare en
 * temps constant, ce qui evite d'exposer la signature attendue par le temps de
 * reponse.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  const secret = getSecret();
  if (!token || !secret) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload;

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Comparaison a temps constant de deux secrets textuels. Necessaire pour le
 * jeton de service, ou une comparaison naive (`===`) fuit la longueur du
 * prefixe correct.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  // La longueur elle-meme n'est pas secrete, mais on evite un court-circuit sur
  // le contenu en accumulant les differences.
  let diff = bytesA.length ^ bytesB.length;
  const max = Math.max(bytesA.length, bytesB.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}
