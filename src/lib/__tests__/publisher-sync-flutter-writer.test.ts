import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// We'll import the writer dynamically after setting process.env so the module
// reads the override at load time (the module captures the env var at import).
let writeJobToFlutterAssets: any;

const TEMP_BASE = path.join(os.tmpdir(), `flutter-writer-tests-${Date.now()}`);

let tmpDir: string;

beforeEach(async () => {
  tmpDir = path.join(TEMP_BASE, `${Math.random().toString(36).slice(2, 8)}`);
  process.env.PUBLISHER_FLUTTER_ASSETS_DIR = tmpDir;
  // Import the module after setting the env var so it picks up the override
  // at module initialization time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  writeJobToFlutterAssets = (await import('../publisher-sync-flutter-writer')).default;
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe('publisher-sync-flutter-writer', () => {
  it('writes communications as { updatedAt, items }', async () => {
    const job = {
      type: 'communications',
      payload: { communications: [{ id: 'c1', body: 'hello' }] },
    } as any;

    await writeJobToFlutterAssets(job);

    const file = path.join(tmpDir, 'communications.json');
    const raw = await fs.readFile(file, 'utf-8');
    const obj = JSON.parse(raw);

    expect(typeof obj.updatedAt).toBe('string');
    expect(Array.isArray(obj.items)).toBe(true);
    expect(obj.items[0].id).toBe('c1');
  });

  it('merges programme_week by weekStart and replaces same-week entries', async () => {
    // Start by creating an initial programme_week via the writer itself so it
    // owns the file path and we avoid cross-process races when running tests
    const initial = { weeks: [{ weekStart: '2025-01-01', items: ['a'] }] };
    await writeJobToFlutterAssets({ type: 'programme_week', payload: initial } as any);
    // Sanity: ensure the file exists and show contents
    await fs.readdir(tmpDir);

    // Add a second week
    const addWeekJob = { type: 'programme_week', payload: { weeks: [{ weekStart: '2025-01-08', items: ['b'] }] } } as any;
    await writeJobToFlutterAssets(addWeekJob);

    let content = JSON.parse(await fs.readFile(path.join(tmpDir, 'programme_week.json'), 'utf-8'));
    expect(Array.isArray(content.weeks)).toBe(true);
    expect(content.weeks.length).toBe(2);

    // Replace the first week
    const replaceJob = { type: 'programme_week', payload: { weekStart: '2025-01-01', items: ['c'] } } as any;
    await writeJobToFlutterAssets(replaceJob);

    content = JSON.parse(await fs.readFile(path.join(tmpDir, 'programme_week.json'), 'utf-8'));
    const first = content.weeks.find((w: any) => w.weekStart === '2025-01-01');
    expect(first.items[0]).toBe('c');
  });

  it('writes territories payload as a plain JSON file', async () => {
    const payload = { territories: [{ id: 't1', name: 'Zone A' }] };
    await writeJobToFlutterAssets({ type: 'territories', payload } as any);

    const file = path.join(tmpDir, 'territories.json');
    const raw = await fs.readFile(file, 'utf-8');
    const obj = JSON.parse(raw);

    expect(obj.territories[0].id).toBe('t1');
    expect(obj.territories[0].name).toBe('Zone A');
  });

  it('integration: POST /api/publisher-app/send -> writer writes file', async () => {
    const tmpBase2 = path.join(os.tmpdir(), `flutter-writer-integ-${Date.now()}`);
    const tmpDir2 = path.join(tmpBase2, `${Math.random().toString(36).slice(2, 8)}`);
    process.env.PUBLISHER_FLUTTER_ASSETS_DIR = tmpDir2;
    await fs.rm(tmpDir2, { recursive: true, force: true });
    await fs.mkdir(tmpDir2, { recursive: true });

    // Mock PublisherSyncStore.addJob to return a predictable job and avoid DB touches
    const jobReturned = {
      id: 'job-integ-1',
      type: 'territories',
      direction: 'desktop_to_mobile',
      payload: { territories: [{ id: 't2', name: 'Zone B' }] },
      status: 'pending',
      initiator: 'test',
      deviceTarget: null,
      notify: false,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    // Mock the store and auth modules before importing the route
    // Use Vitest mocking helpers available globally as `vi`
    // Use doMock so the factory can reference the runtime-local jobReturned
    vi.doMock('../publisher-sync-store', () => ({
      PublisherSyncStore: { addJob: async () => jobReturned },
    }));
    // Import the testable handler directly after mocking the store
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { handlePublisherSend } = await import('../publisher-send-handler');

    // Call the handler directly with a fake context (request + device)
    const fakeRequest = { json: async () => ({ type: 'territories', payload: jobReturned.payload }) } as any;
    const device = { id: 'd1', label: 'test-device' } as any;
    await handlePublisherSend({ request: fakeRequest, device });

    // The handler triggers the writer in a fire-and-forget promise. Wait for
    // the file to exist (small timeout) before reading it.
    const outFile = path.join(tmpDir2, 'territories.json');
    const waitForFile = async (p: string, timeout = 1000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          await fs.access(p);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      throw new Error(`timeout waiting for file ${p}`);
    };

    await waitForFile(outFile);
    const resultRaw = await fs.readFile(outFile, 'utf-8');
    const resultObj = JSON.parse(resultRaw);
    expect(resultObj.territories[0].id).toBe('t2');

    // restore mocks and cleanup
    vi.restoreAllMocks();
    await fs.rm(tmpDir2, { recursive: true, force: true });
  });
});
