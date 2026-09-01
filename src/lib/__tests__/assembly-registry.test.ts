import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

/**
 * Le registre resout son chemin de stockage depuis `process.cwd()` au moment de
 * l'importation du module. Chaque test travaille donc dans un repertoire
 * temporaire, avec un `resetModules` pour forcer une nouvelle resolution.
 */
async function freshRegistry(cwd: string) {
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  vi.resetModules();
  return import('@/lib/tenants/assembly-registry');
}

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'registry-'));
  delete process.env.ASSEMBLY_ID;
  delete process.env.ASSEMBLY_PIN;
  delete process.env.ASSEMBLY_NAME;
  delete process.env.VERCEL;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe('amorcage', () => {
  it('cree l\'assemblee decrite par l\'environnement quand le registre est vide', async () => {
    process.env.ASSEMBLY_ID = 'TESTAS-1234';
    process.env.ASSEMBLY_PIN = '424242';
    process.env.ASSEMBLY_NAME = 'Assemblee de test';

    const registry = await freshRegistry(tempDir);
    const assemblies = await registry.listAssemblies();

    expect(assemblies).toHaveLength(1);
    expect(assemblies[0].id).toBe('TESTAS-1234');
    expect(assemblies[0].name).toBe('Assemblee de test');
    expect(assemblies[0].subscription.status).toBe('trial');
    // Le PIN d'amorcage doit etre hashe, jamais conserve en clair.
    const raw = await fs.readFile(
      path.join(tempDir, 'data', 'platform', 'assemblies.json'),
      'utf8'
    );
    expect(raw).not.toContain('424242');
  });

  it('n\'expose ni hash ni sel dans la vue publique', async () => {
    process.env.ASSEMBLY_ID = 'TESTAS-1234';
    process.env.ASSEMBLY_PIN = '424242';
    const registry = await freshRegistry(tempDir);
    const [assembly] = await registry.listAssemblies();
    expect(assembly).not.toHaveProperty('pinHash');
    expect(assembly).not.toHaveProperty('pinSalt');
  });
});

describe('createAssembly', () => {
  it('cree une assemblee et retourne son PIN une seule fois', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly, pin } = await registry.createAssembly({ name: 'Nouvelle Assemblee' });

    expect(pin).toMatch(/^\d{6}$/);
    expect(assembly.id).toMatch(/-[A-Z2-9]{4}$/);
    expect(assembly.state.access).toBe('full');

    const stored = await registry.getAssembly(assembly.id);
    expect(stored?.pinHash).toBeTruthy();
    // Le PIN en clair n'existe plus cote serveur.
    expect(JSON.stringify(stored)).not.toContain(pin);
  });

  it('refuse un nom trop court', async () => {
    const registry = await freshRegistry(tempDir);
    await expect(registry.createAssembly({ name: 'AB' })).rejects.toThrow();
  });

  it('attribue des identifiants distincts', async () => {
    const registry = await freshRegistry(tempDir);
    const first = await registry.createAssembly({ name: 'Assemblee Une' });
    const second = await registry.createAssembly({ name: 'Assemblee Une' });
    expect(first.assembly.id).not.toBe(second.assembly.id);
    expect(await registry.listAssemblies()).toHaveLength(3); // 2 + amorcage
  });
});

describe('verifyAssemblyPin', () => {
  it('accepte le bon couple identifiant / PIN', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly, pin } = await registry.createAssembly({ name: 'Assemblee Verif' });

    const verified = await registry.verifyAssemblyPin(assembly.id, pin);
    expect(verified?.assembly.id).toBe(assembly.id);
    expect(verified?.state.access).toBe('full');
  });

  it('rejette un mauvais PIN et une assemblee inconnue', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly, pin } = await registry.createAssembly({ name: 'Assemblee Verif' });

    expect(await registry.verifyAssemblyPin(assembly.id, '000000')).toBeNull();
    expect(await registry.verifyAssemblyPin('INCONNU-9999', pin)).toBeNull();
  });

  it('invalide l\'ancien PIN apres rotation', async () => {
    const registry = await freshRegistry(tempDir);
    const created = await registry.createAssembly({ name: 'Assemblee Rotation' });
    const rotated = await registry.rotatePin(created.assembly.id);

    expect(rotated?.pin).not.toBe(created.pin);
    expect(await registry.verifyAssemblyPin(created.assembly.id, created.pin)).toBeNull();
    expect(await registry.verifyAssemblyPin(created.assembly.id, rotated!.pin)).not.toBeNull();
  });
});

describe('abonnements', () => {
  it('suspend puis reactive une assemblee', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly, pin } = await registry.createAssembly({ name: 'Assemblee Abo' });

    await registry.setSubscription(assembly.id, { status: 'suspended' });
    expect((await registry.verifyAssemblyPin(assembly.id, pin))?.state.access).toBe('blocked');

    await registry.setSubscription(assembly.id, { status: 'active' });
    expect((await registry.verifyAssemblyPin(assembly.id, pin))?.state.access).toBe('full');
  });

  it('passe en lecture seule quand l\'echeance est depassee', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly, pin } = await registry.createAssembly({ name: 'Assemblee Expiree' });

    await registry.setSubscription(assembly.id, {
      expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
    });
    expect((await registry.verifyAssemblyPin(assembly.id, pin))?.state.access).toBe('read-only');
  });

  it('prolonge depuis l\'echeance existante si elle est future', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly } = await registry.createAssembly({ name: 'Assemblee Renew', plan: 'monthly' });
    const before = Date.parse((await registry.getAssemblySummary(assembly.id))!.subscription.expiresAt!);

    const renewed = await registry.renewSubscription(assembly.id, 'monthly');
    const after = Date.parse(renewed!.subscription.expiresAt!);

    // Un renouvellement anticipe ne doit pas faire perdre les jours restants.
    expect(Math.round((after - before) / 86_400_000)).toBe(30);
    expect(renewed!.subscription.status).toBe('active');
  });

  it('retourne null pour une assemblee inconnue', async () => {
    const registry = await freshRegistry(tempDir);
    expect(await registry.setSubscription('INCONNU-9999', { status: 'active' })).toBeNull();
    expect(await registry.rotatePin('INCONNU-9999')).toBeNull();
    expect(await registry.deleteAssembly('INCONNU-9999')).toBe(false);
  });
});

describe('deleteAssembly', () => {
  it('retire l\'entree du registre', async () => {
    const registry = await freshRegistry(tempDir);
    const { assembly } = await registry.createAssembly({ name: 'Assemblee A Supprimer' });

    expect(await registry.deleteAssembly(assembly.id)).toBe(true);
    expect(await registry.getAssembly(assembly.id)).toBeNull();
  });
});
