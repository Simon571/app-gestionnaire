"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';
import type { PublisherSyncType } from '@/types/publisher-sync';

type Props = {
  type: PublisherSyncType;
  getPayload?: () => unknown;
  save?: () => Promise<void> | void;
  disabled?: boolean;
  label?: string;
};

export default function LinkToPublisher({ type, getPayload, save, disabled, label }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (disabled) return;
    setLoading(true);

    try {
      // 1. Save locally if provided
      if (save) {
        await save();
      }

      // 2. Build payload
      const payload = getPayload ? getPayload() : {};

      // 3. Send job to publisher-app
      const res = await publisherSyncFetch('/api/publisher-app/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, notify: true }),
      });

      if (!res.ok) throw new Error('Impossible de créer le job de synchronisation');

      toast({ title: 'Enregistré et envoyé', description: 'Le job a bien été créé pour Publisher App.' });
    } catch (err) {
      console.error('link-to-publisher error', err);
      toast({ title: 'Erreur', description: (err as Error)?.message || 'Envoi impossible', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={disabled || loading} className="bg-sky-600 hover:bg-sky-700 text-white">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
      {label ?? 'Enregistrer & Envoyer vers Publisher App'}
    </Button>
  );
}
