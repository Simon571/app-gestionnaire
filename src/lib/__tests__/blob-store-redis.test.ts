import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression : `@upstash/redis` redeserialise les valeurs qui ressemblent a du
 * JSON. Une chaine ecrite par `blobWriteGlobal` revenait donc en objet, et
 * `JSON.parse` d'un objet fait echouer la lecture du registre des assemblees —
 * ce qui renvoyait un 500 sur POST /api/auth/session en production.
 */

const store = new Map<string, unknown>();

vi.mock('@upstash/redis', () => ({
  Redis: class {
    async get(key: string) {
      // Simule une base Upstash supprimee : `fetch failed`, comme en production.
      if (store.has('__throw__')) throw new Error('fetch failed');
      return store.has(key) ? store.get(key) : null;
    }
    async set(key: string, value: unknown) {
      store.set(key, value);
    }
  },
}));

const loadStore = async () => {
  vi.resetModules();
  return import('@/lib/blob-store');
};

beforeEach(() => {
  store.clear();
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://exemple.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'jeton-de-test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('blob-store sur Redis', () => {
  it('rend une chaine analysable meme quand Redis renvoie un objet', async () => {
    const { blobReadGlobal } = await loadStore();
    store.set('app:platform:assemblies.json', { version: 1, assemblies: [] });

    const raw = await blobReadGlobal('platform/assemblies.json', 'ignore');

    expect(typeof raw).toBe('string');
    expect(JSON.parse(raw as string)).toEqual({ version: 1, assemblies: [] });
  });

  it('fait un aller-retour ecriture puis lecture', async () => {
    const { blobReadGlobal, blobWriteGlobal } = await loadStore();
    const content = JSON.stringify({ assemblies: [{ id: 'ASSEMB-1' }] });

    await blobWriteGlobal('platform/assemblies.json', 'ignore', content);
    const raw = await blobReadGlobal('platform/assemblies.json', 'ignore');

    expect(JSON.parse(raw as string).assemblies[0].id).toBe('ASSEMB-1');
  });

  it('renvoie null pour une cle absente', async () => {
    const { blobReadGlobal } = await loadStore();
    expect(await blobReadGlobal('platform/inconnu.json', 'ignore')).toBeNull();
  });

  it("nomme la cause quand Redis n'est pas configure sur Vercel", async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { blobWriteGlobal, StorageUnavailableError } = await loadStore();

    await expect(
      blobWriteGlobal('platform/assemblies.json', 'ignore', '{}')
    ).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it('signale une panne de Redis au lieu de la faire passer pour un fichier vide', async () => {
    const { blobReadGlobal, StorageUnavailableError } = await loadStore();
    store.set('__throw__', true);

    await expect(
      blobReadGlobal('platform/assemblies.json', 'ignore')
    ).rejects.toBeInstanceOf(StorageUnavailableError);
  });
});
