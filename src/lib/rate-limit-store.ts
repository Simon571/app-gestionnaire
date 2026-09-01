/**
 * rate-limit-store.ts
 * Compteur de rate limiting partage entre toutes les instances.
 *
 * - Sur Vercel avec Upstash configure : compteurs dans Redis (fenetre fixe via
 *   INCR + EXPIRE). C'est le seul mode reellement efficace en serverless, ou
 *   chaque invocation peut demarrer un processus neuf.
 * - Sinon (dev local, MSI Tauri, ou Upstash absent) : repli en memoire.
 *   Suffisant pour un serveur unique, inoperant sur plusieurs instances.
 *
 * Compatible Edge runtime (utilise l'API REST d'Upstash, pas de socket TCP).
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  /** true si le compteur est partage (Redis), false si local au processus. */
  shared: boolean;
}

const BOM = String.fromCharCode(0xfeff);

/** Retire un BOM eventuel en tete de valeur d'environnement. */
function cleanEnv(s: string | undefined): string {
  const value = s ?? '';
  return (value.startsWith(BOM) ? value.slice(1) : value).trim();
}

function redisConfig(): { url: string; token: string } | null {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url.startsWith('https://') || !token) return null;
  return { url, token };
}

export function isSharedRateLimitAvailable(): boolean {
  return redisConfig() !== null;
}

// ---------------------------------------------------------------------------
// Repli en memoire
// ---------------------------------------------------------------------------

interface MemoryEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, MemoryEntry>();

/** Purge opportuniste pour eviter une croissance illimitee de la Map. */
function pruneMemoryStore(now: number): void {
  if (memoryStore.size < 5000) return;
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetTime) memoryStore.delete(key);
  }
}

function bumpMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneMemoryStore(now);

  const current = memoryStore.get(key);
  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs;
    memoryStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime, shared: false };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime,
    shared: false,
  };
}

// ---------------------------------------------------------------------------
// Compteur Redis (fenetre fixe)
// ---------------------------------------------------------------------------

/**
 * Execute INCR puis EXPIRE en une seule requete pipeline. La cle est bornee a
 * la fenetre courante, donc l'expiration suffit a la remise a zero.
 */
async function bumpRedis(
  config: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const windowIndex = Math.floor(Date.now() / windowMs);
  const redisKey = `ratelimit:${key}:${windowIndex}`;
  const resetTime = (windowIndex + 1) * windowMs;

  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(windowSeconds)],
    ]),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Upstash HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: number; error?: string }>;
  const incr = payload?.[0];
  if (!incr || typeof incr.result !== 'number') {
    throw new Error(incr?.error ?? 'Reponse Upstash inattendue');
  }

  const count = incr.result;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetTime,
    shared: true,
  };
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Incremente le compteur associe a `key` et indique si la requete passe.
 *
 * En cas d'indisponibilite de Redis on retombe sur le compteur memoire plutot
 * que de rejeter la requete : un incident Upstash ne doit pas rendre l'API
 * inaccessible.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const config = redisConfig();
  if (!config) {
    return bumpMemory(key, limit, windowMs);
  }

  try {
    return await bumpRedis(config, key, limit, windowMs);
  } catch (error) {
    console.error(
      'rate-limit-store: Redis indisponible, repli memoire:',
      (error as Error).message
    );
    return bumpMemory(key, limit, windowMs);
  }
}
