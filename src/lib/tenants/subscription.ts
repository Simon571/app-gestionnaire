/**
 * subscription.ts
 * Etat d'un abonnement et droits qui en decoulent.
 *
 * Logique pure, sans I/O : utilisable dans le middleware (Edge), dans les route
 * handlers (Node) et dans l'interface cliente.
 */

export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

/** Droit d'acces resultant. `read-only` autorise les lectures uniquement. */
export type AccessLevel = 'full' | 'read-only' | 'blocked';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  /** ISO 8601. */
  startedAt: string;
  /** ISO 8601. `null` = sans echeance (assemblee offerte). */
  expiresAt: string | null;
  maxPublishers: number;
  notes?: string;
}

export interface SubscriptionState {
  access: AccessLevel;
  status: SubscriptionStatus;
  /** Negatif si l'echeance est passee ; `null` si sans echeance. */
  daysRemaining: number | null;
  /** Motif lisible, destine a l'interface et aux reponses d'API. */
  reason: string;
  /** Vrai a moins de 14 jours de l'echeance, pour afficher un rappel. */
  expiringSoon: boolean;
}

export const EXPIRY_WARNING_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_TRIAL_DAYS = 30;
export const PLAN_DURATION_DAYS: Record<SubscriptionPlan, number> = {
  trial: DEFAULT_TRIAL_DAYS,
  monthly: 30,
  yearly: 365,
};

function daysBetween(from: number, to: number): number {
  return Math.ceil((to - from) / DAY_MS);
}

/**
 * Une suspension prime sur tout : c'est une decision manuelle du super admin.
 * L'expiration, elle, degrade en lecture seule pour ne jamais priver une
 * assemblee de ses propres donnees.
 */
export function evaluateSubscription(
  subscription: Pick<Subscription, 'status' | 'expiresAt'>,
  now: number = Date.now()
): SubscriptionState {
  const { status, expiresAt } = subscription;

  if (status === 'suspended') {
    return {
      access: 'blocked',
      status,
      daysRemaining: null,
      reason: 'Assemblee suspendue par l\'administrateur de la plateforme.',
      expiringSoon: false,
    };
  }

  const expiry = expiresAt ? Date.parse(expiresAt) : null;
  const hasValidExpiry = expiry !== null && !Number.isNaN(expiry);
  const daysRemaining = hasValidExpiry ? daysBetween(now, expiry) : null;

  if (status === 'expired' || (hasValidExpiry && now > expiry)) {
    return {
      access: 'read-only',
      status: 'expired',
      daysRemaining,
      reason:
        'Abonnement expire : consultation possible, modifications suspendues ' +
        'jusqu\'au renouvellement.',
      expiringSoon: false,
    };
  }

  return {
    access: 'full',
    status,
    daysRemaining,
    reason: status === 'trial' ? 'Periode d\'essai en cours.' : 'Abonnement actif.',
    expiringSoon: daysRemaining !== null && daysRemaining <= EXPIRY_WARNING_DAYS,
  };
}

/** Echeance d'un renouvellement, a partir de maintenant ou de la date en cours. */
export function computeExpiry(
  plan: SubscriptionPlan,
  from: Date = new Date()
): string {
  const expiry = new Date(from.getTime() + PLAN_DURATION_DAYS[plan] * DAY_MS);
  return expiry.toISOString();
}

export function isMutatingMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}
