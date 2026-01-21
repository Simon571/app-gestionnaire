

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  PUBLISHER_SYNC_TYPES,
  PublisherSyncJob,
  PublisherSyncType,
} from '@/types/publisher-sync';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';

const typeLabels: Record<PublisherSyncType, string> = {
  programme_week: 'Programme Vie et ministère',
  programme_weekend: 'Programme de week-end',
  predication: 'Réunion pour la prédication',
  discours_publics: 'Discours publics',
  temoignage_public: 'Témoignage public',
  services: 'Services / tâches',
  nettoyage: 'Nettoyage',
  rapports: 'Rapports de service',
  assistance: 'Assistance aux réunions',
  communications: 'Communications',
  taches: 'Tâches diverses',
  territories: 'Territoires',
  emergency_contacts: "Contacts d'urgence",
  user_data: 'Données utilisateur',
};

export default function SendDataPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PublisherSyncJob[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const response = await publisherSyncFetch(
        '/api/publisher-app/queue?direction=desktop_to_mobile&status=pending'
      );
      if (!response.ok) throw new Error('jobs');
      const data = await response.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données à envoyer.');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.filter((job) => job.status === 'pending').forEach((job) => {
      counts[job.type] = (counts[job.type] ?? 0) + 1;
    });
    // Only return types that have pending jobs
    return PUBLISHER_SYNC_TYPES
      .filter((type) => (counts[type] ?? 0) > 0)
      .map((type) => ({
        id: type,
        label: typeLabels[type],
        count: counts[type] ?? 0,
      }));
  }, [jobs]);

  const hasPendingOutgoing = useMemo(
    () => summary.length > 0,
    [summary]
  );

  // Get all pending jobs (for sending all at once)
  const allPendingJobs = useMemo(
    () => jobs.filter((job) => job.status === 'pending'),
    [jobs]
  );

  const triggerSend = async (_withNotification: boolean) => {
    // If no pending jobs, show error
    if (allPendingJobs.length === 0) {
      setError('Aucune donnée en attente.');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      // Mark all pending jobs as 'sent' (ready for mobile to fetch)
      // Flutter will mark them as 'processed' after receiving them
      const ackPromises = allPendingJobs.map((job) =>
        publisherSyncFetch('/api/publisher-app/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            status: 'sent',
          }),
        })
      );

      const results = await Promise.all(ackPromises);
      const allOk = results.every((res) => res.ok);

      if (!allOk) {
        throw new Error('Certains jobs n\'ont pas pu être synchronisés.');
      }

      // Show success message
      toast({
        title: 'Données envoyées',
        description: `${allPendingJobs.length} élément(s) envoyé(s) vers les appareils mobiles.`,
      });

      await loadJobs();
    } catch (err) {
      console.error(err);
      setError('Impossible de synchroniser les données.');
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser les données.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid min-h-[620px] grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-1 flex-col border-2 border-sky-600 shadow-none">
          <CardHeader className="pb-0 flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Données en attente d'envoi
              {hasPendingOutgoing && (
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" aria-label="Données à envoyer" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-4 space-y-3">
            <div className="border border-sky-600" suppressHydrationWarning>
              <div className="grid grid-cols-[1fr_auto] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <span>Type de données</span>
                <span className="text-right">Nombre</span>
              </div>
              {loadingJobs && (
                <div className="px-3 py-4 text-sm text-slate-500">Chargement…</div>
              )}
              {!loadingJobs && summary.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  Aucune donnée en attente d'envoi.
                </div>
              )}
              {!loadingJobs && summary.map((item) => (
                <div
                  key={item.id}
                  className="grid w-full grid-cols-[1fr_auto] items-center border-b border-sky-200 px-3 py-3 bg-yellow-50 last:border-b-0"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-right font-semibold text-sky-700">{item.count}</span>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <div className="mt-auto space-y-2">
          <Button
            className="flex h-12 w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => triggerSend(true)}
            disabled={isSending || !hasPendingOutgoing}
          >
            <Upload className="h-4 w-4" />
            {isSending ? 'Envoi en cours...' : `Envoyer tout (${allPendingJobs.length})`}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Appareils mobiles enregistrés</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex h-[300px] items-center justify-center text-center text-sm text-slate-500">
            <div>
              <p className="mb-2">Aucun appareil mobile enregistré.</p>
              <p className="text-xs text-slate-400">
                Les notifications de synchronisation apparaîtront ici lorsque des appareils mobiles seront connectés.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

