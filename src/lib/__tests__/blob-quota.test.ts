import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression : consommation du quota « advanced operations » de Vercel Blob.
 *
 * Trois magasins se rabattaient sur Vercel Blob des que Redis repondait « rien
 * ici » — l'etat normal d'une base neuve — au lieu du seul cas ou Redis est en
 * panne. Chaque lecture declenchait alors un `list()`, compte comme une
 * « advanced operation » : le forfait Hobby n'en accorde que 2 000 par mois, et
 * le magasin de production a fini bloque.
 *
 * Ces tests verifient les deux moitiees de la regle : Blob n'est pas consulte
 * quand Redis repond, et il l'est toujours quand Redis echoue.
 */

const redisStore = new Map<string, unknown>();
let redisThrows = false;
let listCalls = 0;

vi.mock('@upstash/redis', () => ({
  Redis: class {
    async get(key: string) {
      if (redisThrows) throw new Error('fetch failed');
      return redisStore.has(key) ? redisStore.get(key) : null;
    }
    async set(key: string, value: unknown) {
      if (redisThrows) throw new Error('fetch failed');
      redisStore.set(key, value);
    }
  },
}));

vi.mock('@vercel/blob', () => ({
  list: async () => {
    listCalls += 1;
    return { blobs: [], hasMore: false };
  },
  put: async () => ({ url: 'https://exemple.test/blob.json' }),
}));

beforeEach(() => {
  redisStore.clear();
  redisThrows = false;
  listCalls = 0;
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://exemple.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'jeton-de-test');
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'jeton-blob-de-test');
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('lecture sur une base Redis vide', () => {
  it('ne consulte pas Vercel Blob pour les utilisateurs Publisher', async () => {
    const { readPublisherUsers } = await import('@/lib/publisher-users-store');

    expect(await readPublisherUsers()).toEqual([]);
    expect(listCalls).toBe(0);
  });

  it('ne consulte pas Vercel Blob pour la file de synchronisation', async () => {
    const { PublisherSyncStore } = await import('@/lib/publisher-sync-store');

    expect(await PublisherSyncStore.listJobs()).toEqual([]);
    expect(listCalls).toBe(0);
  });

  it("ne consulte pas Vercel Blob pour les rapports d'activite", async () => {
    const { listPreachingReports, listMonthSubmissions } = await import(
      '@/lib/publisher-preaching-store'
    );

    expect(await listPreachingReports()).toEqual([]);
    expect(await listMonthSubmissions()).toEqual([]);
    expect(listCalls).toBe(0);
  });
});

describe('lecture quand Redis est en panne', () => {
  it('se rabat sur Vercel Blob pour les utilisateurs Publisher', async () => {
    const { readPublisherUsers } = await import('@/lib/publisher-users-store');
    redisThrows = true;

    expect(await readPublisherUsers()).toEqual([]);
    expect(listCalls).toBe(1);
  });

  it('se rabat sur Vercel Blob pour la file de synchronisation', async () => {
    const { PublisherSyncStore } = await import('@/lib/publisher-sync-store');
    redisThrows = true;

    expect(await PublisherSyncStore.listJobs()).toEqual([]);
    expect(listCalls).toBe(1);
  });

  it("se rabat sur Vercel Blob pour les rapports d'activite", async () => {
    const { listPreachingReports } = await import('@/lib/publisher-preaching-store');
    redisThrows = true;

    expect(await listPreachingReports()).toEqual([]);
    expect(listCalls).toBe(1);
  });
});

describe('lecture-modification-ecriture', () => {
  it("n'efface pas les rapports existants quand le stockage est injoignable", async () => {
    const { upsertPreachingReport } = await import('@/lib/publisher-preaching-store');
    const { StorageUnavailableError } = await import('@/lib/blob-store');
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    redisThrows = true;

    // Sans cette remontee d'erreur, la lecture renvoyait une liste vide et
    // l'ecriture qui suit remplacait tous les rapports par le seul nouveau.
    await expect(
      upsertPreachingReport({ userId: 'p1', month: '2026-09', didPreach: true })
    ).rejects.toBeInstanceOf(StorageUnavailableError);
  });
});
