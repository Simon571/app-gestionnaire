import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { forMobileClients, mobilePinDeliveryEnabled } from '@/lib/publisher-users-privacy';

const originalEnv = { ...process.env };

const users = () => [
  { id: 'p1', firstName: 'Anne', pin: '1234', passwordHash: 'x', _assemblyId: 'ASSEMB-1' },
  { id: 'p2', firstName: 'Bruno', pin: '5678' },
];

beforeEach(() => {
  delete process.env.MOBILE_USERS_INCLUDE_PIN;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('publisher-users-privacy', () => {
  it('conserve le PIN par defaut, pour ne pas couper les APK deja installes', () => {
    expect(mobilePinDeliveryEnabled()).toBe(true);
    const result = forMobileClients(users());
    expect(result[0]['pin']).toBe('1234');
    expect(result[1]['pin']).toBe('5678');
  });

  it('retire le PIN quand MOBILE_USERS_INCLUDE_PIN=off', () => {
    process.env.MOBILE_USERS_INCLUDE_PIN = 'off';
    expect(mobilePinDeliveryEnabled()).toBe(false);
    for (const user of forMobileClients(users())) {
      expect(user).not.toHaveProperty('pin');
    }
  });

  it('retire toujours les hachages de mot de passe, PIN ou pas', () => {
    for (const value of [undefined, 'off']) {
      if (value) process.env.MOBILE_USERS_INCLUDE_PIN = value;
      else delete process.env.MOBILE_USERS_INCLUDE_PIN;
      expect(forMobileClients(users())[0]).not.toHaveProperty('passwordHash');
    }
  });

  it('ne modifie pas la liste d origine', () => {
    process.env.MOBILE_USERS_INCLUDE_PIN = 'off';
    const original = users();
    forMobileClients(original);
    // Les magasins reutilisent ces objets pour reecrire le fichier : les muter
    // ferait disparaitre les PIN des donnees elles-memes.
    expect(original[0]['pin']).toBe('1234');
  });

  it('laisse les autres champs intacts', () => {
    process.env.MOBILE_USERS_INCLUDE_PIN = 'off';
    const result = forMobileClients(users());
    expect(result[0]['firstName']).toBe('Anne');
    expect(result[0]['_assemblyId']).toBe('ASSEMB-1');
  });
});
