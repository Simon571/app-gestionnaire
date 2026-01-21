'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';
import { PublisherSyncType } from '@/types/publisher-sync';

interface UseSyncToFlutterOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToasts?: boolean;
}

interface SyncResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * Hook pour synchroniser automatiquement les données vers Flutter
 * Utilisation: 
 * 
 * const { syncData, isSyncing } = useSyncToFlutter({ showToasts: true });
 * 
 * // Dans votre handler de sauvegarde:
 * await syncData('programme_week', { weekStart: '...', assignments: {...} });
 */
export function useSyncToFlutter(options: UseSyncToFlutterOptions = {}) {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToasts = true, onSuccess, onError } = options;

  const syncData = useCallback(
    async (
      type: PublisherSyncType,
      payload: unknown,
      syncOptions?: {
        notify?: boolean;
        deviceTarget?: string | null;
        successMessage?: string;
        errorMessage?: string;
      }
    ): Promise<SyncResult> => {
      setIsSyncing(true);

      try {
        const response = await publisherSyncFetch('/api/publisher-app/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            payload: {
              ...payload as object,
              updatedAt: new Date().toISOString(),
            },
            direction: 'desktop_to_mobile',
            initiator: 'desktop',
            deviceTarget: syncOptions?.deviceTarget ?? null,
            notify: syncOptions?.notify ?? true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }

        const data = await response.json();

        if (showToasts) {
          toast({
            title: 'Synchronisé',
            description: syncOptions?.successMessage || 'Les données ont été envoyées vers Publisher App.',
          });
        }

        onSuccess?.();

        return {
          success: true,
          jobId: data.job?.id,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Sync to Flutter failed:', error);

        if (showToasts) {
          toast({
            title: 'Erreur de synchronisation',
            description: syncOptions?.errorMessage || errorMessage,
            variant: 'destructive',
          });
        }

        onError?.(error instanceof Error ? error : new Error(errorMessage));

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsSyncing(false);
      }
    },
    [toast, showToasts, onSuccess, onError]
  );

  // Helper functions for specific data types
  const syncProgrammeWeek = useCallback(
    (data: {
      weekStart: string;
      weekEnd?: string;
      weekLabel?: string;
      assignments: Record<string, unknown>;
      songs?: Record<string, unknown>;
      participants?: unknown[];
      hall?: string;
    }) => syncData('programme_week', data),
    [syncData]
  );

  const syncProgrammeWeekend = useCallback(
    (data: {
      date: string;
      speaker?: string;
      discourseNumber?: number;
      discourseTitle?: string;
      chairman?: string;
      reader?: string;
      songs?: Record<string, unknown>;
    }) => syncData('programme_weekend', data),
    [syncData]
  );

  const syncPredication = useCallback(
    (data: {
      date: string;
      time?: string;
      location?: string;
      groups?: unknown[];
      assignments?: unknown[];
    }) => syncData('predication', data),
    [syncData]
  );

  const syncServices = useCallback(
    (data: {
      type: string;
      date?: string;
      assignments?: unknown[];
    }) => syncData('services', data),
    [syncData]
  );

  const syncNettoyage = useCallback(
    (data: {
      date: string;
      groups?: unknown[];
      assignments?: unknown[];
    }) => syncData('nettoyage', data),
    [syncData]
  );

  const syncCommunications = useCallback(
    (data: {
      communications: unknown[];
    }) => syncData('communications', { generatedAt: new Date().toISOString(), ...data }),
    [syncData]
  );

  const syncTerritories = useCallback(
    (data: {
      territories: unknown[];
    }) => syncData('territories', data),
    [syncData]
  );

  const syncEmergencyContacts = useCallback(
    (data: {
      personId: string;
      contacts: unknown[];
    }) => syncData('emergency_contacts', data),
    [syncData]
  );

  const syncDiscoursPublics = useCallback(
    (data: {
      generatedAt?: string;
      type?: 'local' | 'exterieur';
      schedule?: unknown[];
      speakers?: unknown[];
    }) => syncData('discours_publics', { generatedAt: new Date().toISOString(), ...data }),
    [syncData]
  );

  const syncTemoignagePublic = useCallback(
    (data: {
      generatedAt?: string;
      schedule?: unknown[];
      locations?: unknown[];
    }) => syncData('temoignage_public', { generatedAt: new Date().toISOString(), ...data }),
    [syncData]
  );

  const syncRapports = useCallback(
    (data: {
      generatedAt?: string;
      month?: string;
      year?: number;
      reports?: unknown[];
    }) => syncData('rapports', { generatedAt: new Date().toISOString(), ...data }),
    [syncData]
  );

  const syncAssistance = useCallback(
    (data: {
      generatedAt?: string;
      records?: unknown[];
    }) => syncData('assistance', { generatedAt: new Date().toISOString(), ...data }),
    [syncData]
  );

  return {
    syncData,
    isSyncing,
    // Helpers spécifiques
    syncProgrammeWeek,
    syncProgrammeWeekend,
    syncPredication,
    syncServices,
    syncNettoyage,
    syncCommunications,
    syncTerritories,
    syncEmergencyContacts,
    syncDiscoursPublics,
    syncTemoignagePublic,
    syncRapports,
    syncAssistance,
  };
}

export default useSyncToFlutter;
