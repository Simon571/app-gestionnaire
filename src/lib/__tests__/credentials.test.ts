import { describe, expect, it } from 'vitest';
import {
  PBKDF2_ITERATIONS,
  generateAssemblyId,
  generatePin,
  hashSecret,
  parseSecret,
  serializeSecret,
  verifySecret,
} from '@/lib/tenants/credentials';

describe('hashSecret / verifySecret', () => {
  it('valide le bon secret', async () => {
    const hashed = await hashSecret('correct horse battery staple');
    expect(await verifySecret('correct horse battery staple', hashed)).toBe(true);
  });

  it('rejette un mauvais secret', async () => {
    const hashed = await hashSecret('136573');
    expect(await verifySecret('136574', hashed)).toBe(false);
  });

  it('produit deux hash differents pour le meme secret', async () => {
    const a = await hashSecret('123456');
    const b = await hashSecret('123456');
    // Sel aleatoire : deux assemblees avec le meme PIN ne sont pas reperables
    // en comparant les hash stockes.
    expect(a.hash).not.toBe(b.hash);
    expect(a.salt).not.toBe(b.salt);
  });

  it('rejette un enregistrement incomplet sans lever', async () => {
    expect(await verifySecret('123456', null)).toBe(false);
    expect(await verifySecret('123456', { hash: 'abc' })).toBe(false);
    expect(await verifySecret('123456', { salt: 'abc' })).toBe(false);
  });
});

describe('serializeSecret / parseSecret', () => {
  it('fait l\'aller-retour', async () => {
    const hashed = await hashSecret('un mot de passe assez long');
    const parsed = parseSecret(serializeSecret(hashed));
    expect(parsed).toEqual(hashed);
    expect(await verifySecret('un mot de passe assez long', parsed!)).toBe(true);
  });

  it('refuse un format inconnu ou un cout abaisse', () => {
    expect(parseSecret(undefined)).toBeNull();
    expect(parseSecret('')).toBeNull();
    expect(parseSecret('bcrypt$10$sel$hash')).toBeNull();
    // Un cout venu de l'exterieur permettrait de demander une derivation a
    // 1 iteration, donc triviale a forcer.
    expect(parseSecret('pbkdf2$1$sel$hash')).toBeNull();
    expect(parseSecret(`pbkdf2$${PBKDF2_ITERATIONS}$sel$hash`)).toEqual({
      salt: 'sel',
      hash: 'hash',
    });
  });
});

describe('generatePin', () => {
  it('produit six chiffres', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generatePin()).toMatch(/^\d{6}$/);
    }
  });
});

describe('generateAssemblyId', () => {
  it('derive un prefixe lisible du nom', () => {
    expect(generateAssemblyId('Kinshasa Yolo Est')).toMatch(/^KINSHA-[A-Z2-9]{4}$/);
  });

  it('retombe sur un prefixe par defaut sans lettres exploitables', () => {
    expect(generateAssemblyId('12345')).toMatch(/^ASSEMB-[A-Z2-9]{4}$/);
  });

  it('ne se repete pas', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateAssemblyId('Test')));
    expect(ids.size).toBeGreaterThan(45);
  });
});
