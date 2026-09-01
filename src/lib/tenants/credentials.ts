/**
 * credentials.ts
 * Derivation et verification de secrets (mot de passe super admin, PIN
 * d'assemblee).
 *
 * PBKDF2-SHA256 via l'API Web Crypto, comme `session-token.ts` : le meme code
 * fonctionne en runtime Edge et Node. Aucun secret n'est stocke en clair.
 */

const encoder = new TextEncoder();

/** Cout de derivation. Volontairement eleve : un PIN ne fait que 6 chiffres. */
export const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

function fromHex(value: string): Uint8Array<ArrayBuffer> {
  const clean = value.trim();
  const bytes = new Uint8Array(new ArrayBuffer(Math.floor(clean.length / 2)));
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

async function derive(secret: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_BITS
  );
  return toHex(new Uint8Array(bits));
}

export interface HashedSecret {
  hash: string;
  salt: string;
}

export async function hashSecret(secret: string): Promise<HashedSecret> {
  const salt = randomBytes(SALT_BYTES);
  return { hash: await derive(secret, salt), salt: toHex(salt) };
}

/**
 * Compare en temps constant. Un `===` sur les hash fuirait la longueur du
 * prefixe correct, ce qui reste exploitable meme sur un condensat.
 */
export async function verifySecret(
  secret: string,
  stored: Partial<HashedSecret> | null | undefined
): Promise<boolean> {
  if (!stored?.hash || !stored.salt) return false;
  const candidate = await derive(secret, fromHex(stored.salt));
  return timingSafeEqualHex(candidate, stored.hash);
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Format serialise `pbkdf2$<iterations>$<salt>$<hash>`, utilise pour
 * SUPER_ADMIN_PASSWORD_HASH afin qu'une seule variable d'environnement suffise.
 */
export function serializeSecret(hashed: HashedSecret): string {
  return `pbkdf2$${PBKDF2_ITERATIONS}$${hashed.salt}$${hashed.hash}`;
}

export function parseSecret(serialized: string | undefined): HashedSecret | null {
  const parts = (serialized || '').trim().split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return null;
  const [, iterations, salt, hash] = parts;
  // Le cout est fige : accepter une valeur venue de l'exterieur permettrait de
  // demander une derivation a 1 iteration.
  if (Number(iterations) !== PBKDF2_ITERATIONS || !salt || !hash) return null;
  return { salt, hash };
}

/** PIN numerique tire d'une source cryptographique, pas de `Math.random`. */
export function generatePin(length = 6): string {
  const digits = randomBytes(length);
  let pin = '';
  for (const byte of digits) pin += String(byte % 10);
  return pin;
}

/** Identifiant d'assemblee lisible, du type `ASSEMB-4F2K`. */
export function generateAssemblyId(name: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix =
    name
      .normalize('NFD')
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 6)
      .toUpperCase() || 'ASSEMB';
  const bytes = randomBytes(4);
  let suffix = '';
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `${prefix}-${suffix}`;
}
