'use client';

/**
 * Bandeau d'etat de l'abonnement.
 *
 * Affiche pourquoi les modifications sont refusees (402 renvoye par le
 * middleware) ou rappelle une echeance proche. Reste discret quand l'abonnement
 * est actif et loin de son terme.
 */
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { getApiBase } from '@/lib/api-base';
import type { SubscriptionState } from '@/lib/tenants/subscription';

export function SubscriptionBanner() {
  const [state, setState] = useState<SubscriptionState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${getApiBase()}/api/auth/session`, {
          credentials: 'include',
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setState(data.subscription ?? null);
      } catch {
        // Un bandeau informatif ne doit jamais faire echouer la page.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) return null;

  if (state.access === 'read-only') {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Abonnement expire — lecture seule</AlertTitle>
        <AlertDescription>
          {state.reason} Vos donnees sont conservees intactes ; contactez
          l&apos;administrateur de la plateforme pour renouveler.
        </AlertDescription>
      </Alert>
    );
  }

  if (state.expiringSoon && state.daysRemaining !== null) {
    return (
      <Alert className="mb-4 border-amber-300 bg-amber-50">
        <Clock className="h-4 w-4" />
        <AlertTitle>
          Abonnement a renouveler dans {state.daysRemaining} jour
          {state.daysRemaining > 1 ? 's' : ''}
        </AlertTitle>
        <AlertDescription>
          Passe cette date, l&apos;application restera consultable mais les modifications
          seront suspendues.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
