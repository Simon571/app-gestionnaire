/**
 * Enrolement des telephones : chaque appareil doit avoir sa propre cle,
 * rattachee a son assemblee et revocable seule. C'est ce qui remplace l'identite
 * partagee `mobile-main`, dont la cle est la meme dans tous les APK publies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

/**
 * Le module resout ses chemins depuis `process.cwd()` a l'importation : chaque
 * test travaille dans un repertoire temporaire, avec `resetModules`.
 */
async function freshAuth(cwd: string) {
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  vi.resetModules();
  return import('@/lib/publisher-sync-auth');
}

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devices-'));
  delete process.env.VERCEL;
  delete process.env.PUBLISHER_BOOTSTRAP_DEVICE;
  delete process.env.PUBLISHER_BOOTSTRAP_TENANT;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('registerDevice', () => {
  it('tire une cle differente pour chaque appareil et n en garde qu une empreinte', async () => {
    const auth = await freshAuth(tempDir);

    const first = await auth.registerDevice({ label: 'Téléphone de Jean', tenantId: 'ASSEM-1' });
    const second = await auth.registerDevice({ label: 'Téléphone de Marie', tenantId: 'ASSEM-1' });

    expect(first.apiKey).not.toBe(second.apiKey);
    expect(first.device.id).not.toBe(second.device.id);
    expect(first.apiKey.length).toBeGreaterThanOrEqual(32);

    // La cle en clair ne doit se trouver nulle part dans le registre persiste.
    const listed = await auth.listDevices('ASSEM-1');
    expect(JSON.stringify(listed)).not.toContain(first.apiKey);
    expect(listed.some((device) => 'apiKeyHash' in device)).toBe(false);
  });

  it('rattache l appareil a son assemblee et cloisonne la liste', async () => {
    const auth = await freshAuth(tempDir);
    await auth.registerDevice({ label: 'Chez nous', tenantId: 'ASSEM-1' });
    await auth.registerDevice({ label: 'Ailleurs', tenantId: 'ASSEM-2' });

    const own = await auth.listDevices('ASSEM-1');
    expect(own).toHaveLength(1);
    expect(own[0].label).toBe('Chez nous');
    expect(own[0].tenantId).toBe('ASSEM-1');
  });

  it('refuse un libelle vide', async () => {
    const auth = await freshAuth(tempDir);
    await expect(auth.registerDevice({ label: '   ' })).rejects.toThrow();
  });
});

describe('revokeDevice', () => {
  it('marque l appareil revoque sans supprimer son entree', async () => {
    const auth = await freshAuth(tempDir);
    const { device } = await auth.registerDevice({ label: 'Perdu', tenantId: 'ASSEM-1' });

    expect(await auth.revokeDevice(device.id)).toBe(true);

    const listed = await auth.listDevices('ASSEM-1');
    const found = listed.find((entry) => entry.id === device.id);
    // Conservee : la supprimer ferait reapparaitre une entree d'amorcage de
    // meme identifiant, donc reactiverait la cle.
    expect(found?.status).toBe('revoked');
    expect(found?.revokedAt).toBeTruthy();
  });

  it('renvoie faux pour un appareil inconnu', async () => {
    const auth = await freshAuth(tempDir);
    expect(await auth.revokeDevice('mobile-inexistant')).toBe(false);
  });
});

describe('identite partagee mobile-main', () => {
  it('reste presente par defaut, pour ne pas couper les telephones installes', async () => {
    const auth = await freshAuth(tempDir);
    const listed = await auth.listDevices();
    expect(listed.some((device) => device.id === 'mobile-main')).toBe(true);
  });

  it('disparait quand PUBLISHER_BOOTSTRAP_DEVICE vaut off', async () => {
    process.env.PUBLISHER_BOOTSTRAP_DEVICE = 'off';
    const auth = await freshAuth(tempDir);
    const listed = await auth.listDevices();
    expect(listed.some((device) => device.id === 'mobile-main')).toBe(false);
  });
});
