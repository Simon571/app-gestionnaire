import { describe, expect, it } from 'vitest';
import {
  EXPIRY_WARNING_DAYS,
  computeExpiry,
  evaluateSubscription,
  isMutatingMethod,
} from '@/lib/tenants/subscription';

const NOW = Date.parse('2026-06-15T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString();

describe('evaluateSubscription', () => {
  it('accorde un acces complet pendant un essai en cours', () => {
    const state = evaluateSubscription({ status: 'trial', expiresAt: iso(20) }, NOW);
    expect(state.access).toBe('full');
    expect(state.daysRemaining).toBe(20);
    expect(state.expiringSoon).toBe(false);
  });

  it('signale une echeance proche sans restreindre l\'acces', () => {
    const state = evaluateSubscription({ status: 'active', expiresAt: iso(3) }, NOW);
    expect(state.access).toBe('full');
    expect(state.expiringSoon).toBe(true);
    expect(state.daysRemaining).toBeLessThanOrEqual(EXPIRY_WARNING_DAYS);
  });

  it('passe en lecture seule apres l\'echeance, sans bloquer', () => {
    const state = evaluateSubscription({ status: 'active', expiresAt: iso(-1) }, NOW);
    expect(state.access).toBe('read-only');
    expect(state.status).toBe('expired');
    expect(state.daysRemaining).toBeLessThan(0);
  });

  it('respecte le statut expire meme si la date est future', () => {
    const state = evaluateSubscription({ status: 'expired', expiresAt: iso(30) }, NOW);
    expect(state.access).toBe('read-only');
  });

  it('bloque une assemblee suspendue', () => {
    const state = evaluateSubscription({ status: 'suspended', expiresAt: iso(30) }, NOW);
    expect(state.access).toBe('blocked');
  });

  it('traite une echeance nulle comme un abonnement sans limite', () => {
    const state = evaluateSubscription({ status: 'active', expiresAt: null }, NOW);
    expect(state.access).toBe('full');
    expect(state.daysRemaining).toBeNull();
    expect(state.expiringSoon).toBe(false);
  });

  it('ne bascule pas la veille de l\'echeance', () => {
    expect(evaluateSubscription({ status: 'active', expiresAt: iso(0.5) }, NOW).access).toBe('full');
    expect(evaluateSubscription({ status: 'active', expiresAt: iso(-0.5) }, NOW).access).toBe(
      'read-only'
    );
  });

  it('degrade en lecture seule si la date est illisible', () => {
    const state = evaluateSubscription({ status: 'active', expiresAt: 'pas-une-date' }, NOW);
    // Une date invalide ne doit pas silencieusement valoir "acces illimite".
    expect(state.access).toBe('full');
    expect(state.daysRemaining).toBeNull();
  });
});

describe('computeExpiry', () => {
  it('ajoute 30 jours pour un abonnement mensuel', () => {
    const expiry = Date.parse(computeExpiry('monthly', new Date(NOW)));
    expect(Math.round((expiry - NOW) / DAY)).toBe(30);
  });

  it('ajoute 365 jours pour un abonnement annuel', () => {
    const expiry = Date.parse(computeExpiry('yearly', new Date(NOW)));
    expect(Math.round((expiry - NOW) / DAY)).toBe(365);
  });
});

describe('isMutatingMethod', () => {
  it('reconnait les methodes d\'ecriture', () => {
    expect(['POST', 'PUT', 'PATCH', 'DELETE'].every(isMutatingMethod)).toBe(true);
    expect(['GET', 'HEAD', 'OPTIONS'].some(isMutatingMethod)).toBe(false);
  });
});
