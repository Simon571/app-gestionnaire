'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, Download, Square, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  PublisherSyncJob,
  PublisherSyncNotification,
  PublisherSyncType,
} from '@/types/publisher-sync';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';

type FilterType = PublisherSyncType | 'all';

interface IncomingDataItem {
  id: string;
  type: PublisherSyncType;
  description: string;
  person: string;
  details: Array<{ label: string; value: string }>;
}

const typeLabels: Record<PublisherSyncType, { label: string; destination: string }> = {
  programme_week: {
    label: 'Programme Vie et ministère',
    destination: 'Programme hebdomadaire',
  },
  programme_weekend: {
    label: 'Programme de week-end',
    destination: 'Programme du week-end',
  },
  predication: {
    label: 'Réunion pour la prédication',
    destination: 'Rapports de prédication',
  },
  discours_publics: {
    label: 'Discours publics',
    destination: 'Programme des discours publics',
  },
  temoignage_public: {
    label: 'Témoignage public',
    destination: 'Planification témoignage public',
  },
  services: {
    label: 'Services / tâches',
    destination: 'Organisation des services',
  },
  nettoyage: {
    label: 'Nettoyage',
    destination: 'Organisation du nettoyage',
  },
  rapports: {
    label: 'Rapports de service',
    destination: 'Rapports de service',
  },
  assistance: {
    label: 'Assistance aux réunions',
    destination: 'Historique d’assistance',
  },
  communications: {
    label: 'Communications',
    destination: 'Centre de messages',
  },
  taches: {
    label: 'Tâches diverses',
    destination: 'Tableau de bord tâches',
  },
  territories: {
    label: 'Territoires',
    destination: 'Gestion des territoires',
  },
  emergency_contacts: {
    label: "Contacts d'urgence",
    destination: 'Fiche personne',
  },
  user_data: {
    label: 'Données utilisateur',
    destination: 'Profil utilisateur',
  },
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return `${value.length} élément${value.length > 1 ? 's' : ''}`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[objet]';
    }
  }
  return String(value);
};

const extractDetails = (payload: unknown): Array<{ label: string; value: string }> => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload ? [{ label: 'Contenu', value: formatValue(payload) }] : [];
  }

  return Object.entries(payload)
    .slice(0, 6)
    .map(([label, value]) => ({ label, value: formatValue(value) }));
};

const pickDescription = (job: PublisherSyncJob): string => {
  const payload = job.payload as Record<string, unknown> | undefined;
  const candidateKeys = ['titre', 'title', 'description', 'resume', 'summary', 'week'];
  if (payload) {
    for (const key of candidateKeys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }
  const fallback = typeLabels[job.type]?.label ?? job.type;
  return `${fallback} • ${new Date(job.createdAt).toLocaleDateString('fr-FR')}`;
};

const pickPerson = (job: PublisherSyncJob): string => {
  const payload = job.payload as Record<string, unknown> | undefined;
  const candidateKeys = ['person', 'publisher', 'responsable', 'contact', 'editeur'];
  if (payload) {
    for (const key of candidateKeys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }
  if (job.initiator && job.initiator.trim().length > 0) {
    return job.initiator;
  }
  return '—';
};

const mapJobToIncomingItem = (job: PublisherSyncJob): IncomingDataItem => ({
  id: job.id,
  type: job.type,
  description: pickDescription(job),
  person: pickPerson(job),
  details: [
    { label: 'Type', value: typeLabels[job.type]?.label ?? job.type },
    { label: 'Créé le', value: new Date(job.createdAt).toLocaleString('fr-FR') },
    { label: 'Mise à jour', value: new Date(job.updatedAt).toLocaleString('fr-FR') },
    ...extractDetails(job.payload),
  ],
});

export default function ReceiveDataPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PublisherSyncJob[]>([]);
  const [notifications, setNotifications] = useState<PublisherSyncNotification[]>([]);
  const [selectedType, setSelectedType] = useState<FilterType>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setError(null);
    try {
      const response = await publisherSyncFetch('/api/publisher-app/incoming');
      if (!response.ok) throw new Error('incoming');
      const data = await response.json();
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les données entrantes.');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    setError(null);
    try {
      const response = await publisherSyncFetch('/api/publisher-app/notifications?limit=100');
      if (!response.ok) throw new Error('notifications');
      const data = await response.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les notifications.');
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    loadNotifications();
  }, [loadJobs, loadNotifications]);

  const incomingItems = useMemo(() => jobs.map(mapJobToIncomingItem), [jobs]);
  const jobLookup = useMemo(() => new Map(jobs.map((job) => [job.id, job])), [jobs]);
  const pendingItems = useMemo(
    () => incomingItems.filter((item) => jobLookup.get(item.id)?.status === 'pending'),
    [incomingItems, jobLookup]
  );
  const hasPendingIncoming = pendingItems.length > 0;

  const typesWithCount = useMemo(() => {
    const counts = pendingItems.reduce<Record<PublisherSyncType, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {} as Record<PublisherSyncType, number>);

    return Object.entries(counts).map(([type, count]) => ({
      type: type as PublisherSyncType,
      count,
    }));
  }, [pendingItems]);

  const filteredItems = useMemo(() => {
    if (selectedType === 'all') {
      return pendingItems;
    }
    return pendingItems.filter((item) => item.type === selectedType);
  }, [pendingItems, selectedType]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? null,
    [filteredItems, selectedItemId]
  );

  const handleSelectType = (type: PublisherSyncType) => {
    setSelectedType((prev) => (prev === type ? 'all' : type));
    setSelectedItemId(null);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
  };

  const resolveDestination = (type: PublisherSyncType) =>
    typeLabels[type]?.destination ?? 'Destination inconnue';

  const handleImport = async (targetIds?: string[]) => {
    const ids = targetIds ?? (selectedItem ? [selectedItem.id] : []);
    if (!ids.length) {
      toast({
        title: 'Aucune donnée sélectionnée',
        description: 'Choisissez une information avant de lancer l’importation.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await Promise.all(
        ids.map(async (jobId) => {
          const response = await publisherSyncFetch('/api/publisher-app/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, status: 'processed' }),
          });
          if (!response.ok) {
            throw new Error('import');
          }
        })
      );
      await Promise.all([loadJobs(), loadNotifications()]);
      setSelectedItemId(null);
      toast({
        title: ids.length > 1 ? 'Importation multiple réussie' : 'Importation réussie',
        description:
          ids.length > 1
            ? `${ids.length} éléments ont été dirigés vers les modules concernés.`
            : `${selectedItem?.description ?? 'Élément'} a été dirigé vers ${
                selectedItem ? resolveDestination(selectedItem.type) : 'la destination prévue'
              }.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Importation impossible',
        description: 'Une erreur est survenue pendant le traitement.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetSelection = () => {
    setSelectedItemId(null);
    setSelectedType('all');
  };

  const handleClearNotifications = async () => {
    await publisherSyncFetch('/api/publisher-app/notifications', { method: 'DELETE' });
    await loadNotifications();
  };

  const handleDeleteNotification = async (id: string) => {
    await publisherSyncFetch(`/api/publisher-app/notifications?id=${id}`, { method: 'DELETE' });
    await loadNotifications();
  };

  const notificationRows = useMemo(() => {
    return notifications.map((notification) => {
      const job = notification.jobId ? jobLookup.get(notification.jobId) : null;
      return {
        id: notification.id,
        type: job ? typeLabels[job.type]?.label ?? job.type : notification.jobId ?? 'Notification',
        message: notification.message,
        person: job?.initiator ?? '—',
      };
    });
  }, [notifications, jobLookup]);

  return (
    <div className="grid min-h-[700px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,32%)_minmax(0,32%)_minmax(0,36%)]">
      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Données en attente de réception
            {hasPendingIncoming && (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" aria-label="Données à traiter" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[3fr_auto] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Type</span>
              <span className="text-right">Nombre</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {typesWithCount.map(({ type, count }) => (
                <button
                  key={type}
                  className={`grid w-full grid-cols-[3fr_auto] items-center border-b border-sky-200 px-3 py-2 text-left text-sm transition hover:bg-sky-50 ${
                    selectedType === type ? 'bg-sky-100 font-semibold' : ''
                  }`}
                  onClick={() => handleSelectType(type)}
                >
                  <span>{typeLabels[type]?.label ?? type}</span>
                  <span className="text-right">{count}</span>
                </button>
              ))}
              {!typesWithCount.length && !loadingJobs && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Aucune donnée en attente
                </div>
              )}
              {loadingJobs && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Chargement…
                </div>
              )}
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Détails</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[3fr_2fr] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Description</span>
              <span>Personne</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`grid w-full grid-cols-[3fr_2fr] items-center border-b border-sky-200 px-3 py-2 text-left text-sm transition hover:bg-sky-50 ${
                    selectedItemId === item.id ? 'bg-sky-100 font-semibold' : ''
                  }`}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <span className="truncate text-xs sm:text-sm">{item.description}</span>
                  <span className="truncate text-xs sm:text-sm">{item.person}</span>
                </button>
              ))}
              {!filteredItems.length && !loadingJobs && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Aucune donnée pour ce type
                </div>
              )}
              {loadingJobs && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Chargement…
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Aperçu</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="flex h-[436px] flex-col border border-sky-600 px-4 py-4 text-sm text-slate-700">
            {selectedItem ? (
              <>
                <div className="space-y-1">
                  <p className="text-base font-semibold">{selectedItem.description}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {typeLabels[selectedItem.type]?.label ?? selectedItem.type}
                  </p>
                  <p className="text-xs text-slate-600">Personne concernée : {selectedItem.person}</p>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {selectedItem.details.map((detail) => (
                    <div key={detail.label} className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1">
                      <dt className="font-medium text-slate-600">{detail.label}</dt>
                      <dd className="text-right text-slate-800">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p>Sélectionner une donnée pour afficher son aperçu détaillé.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full flex flex-wrap justify-center gap-3">
        <Button
          className="flex h-12 min-w-[110px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => handleImport()}
          disabled={isProcessing}
        >
          <CheckSquare className="h-4 w-4" />
          Accepter
        </Button>
        <Button className="flex h-12 min-w-[110px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleResetSelection}>
          <Square className="h-4 w-4" />
          Réinitialiser
        </Button>
        <Button
          className="flex h-12 min-w-[140px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => handleImport(filteredItems.map((item) => item.id))}
          disabled={isProcessing || !filteredItems.length}
        >
          <Download className="h-4 w-4" />
          Importer la sélection
        </Button>
        <Button
          className="flex h-12 min-w-[140px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleClearNotifications}
          disabled={!notifications.length}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <Card className="col-span-full border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Historique des notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[2fr_3fr_2fr_auto] border-b-2 border-sky-600 bg-sky-100 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Type</span>
              <span>Message</span>
              <span>Personne</span>
              <span className="text-center">Action</span>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {notificationRows.length === 0 ? (
                <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
                  {loadingNotifications ? 'Chargement…' : 'Aucune notification enregistrée'}
                </div>
              ) : (
                notificationRows.map((notif) => (
                  <div key={notif.id} className="grid grid-cols-[2fr_3fr_2fr_auto] items-center border-b border-sky-200 px-3 py-2 text-sm last:border-b-0">
                    <span className="uppercase tracking-wide text-xs text-slate-500">{notif.type}</span>
                    <span className="text-xs sm:text-sm">{notif.message}</span>
                    <span className="text-xs sm:text-sm">{notif.person}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notif.id)}>
                      Retirer
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

