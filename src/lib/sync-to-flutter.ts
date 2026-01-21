import { publisherSyncFetch } from './publisher-sync-client';
import { PublisherSyncType } from '@/types/publisher-sync';

/**
 * Utilitaire pour envoyer automatiquement des données vers Flutter.
 * À appeler après chaque sauvegarde de données sur les pages concernées.
 */
export async function syncToFlutter(
  type: PublisherSyncType,
  payload: unknown,
  options?: {
    notify?: boolean;
    deviceTarget?: string | null;
  }
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const response = await publisherSyncFetch('/api/publisher-app/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        payload,
        direction: 'desktop_to_mobile',
        initiator: 'desktop',
        deviceTarget: options?.deviceTarget ?? null,
        notify: options?.notify ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Erreur HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.job?.id,
    };
  } catch (error) {
    console.error('Sync to Flutter failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Types de données et leurs pages correspondantes:
 * 
 * - programme_week: /programme/reunion-vie-ministere
 * - programme_weekend: /programme/discours-publics-local
 * - predication: /programme/predication
 * - discours_publics: /programme/discours-publics-local, /programme/discours-publics-exterieur
 * - temoignage_public: /programme/temoignage-public
 * - services: /programme/services, /responsabilites/*
 * - nettoyage: /programme/nettoyage
 * - rapports: /reports/*
 * - assistance: /reports (depuis Flutter vers desktop)
 * - communications: /communications
 * - taches: /moi/taches
 * - territories: /territories
 * - emergency_contacts: /personnes (contacts d'urgence)
 */

// Helpers spécifiques pour chaque type de données

export const syncProgrammeWeek = async (weekData: {
  weekStart: string;
  weekEnd?: string;
  weekLabel?: string;
  meetingType?: string;
  assignments: Record<string, unknown>;
  songs?: Record<string, unknown>;
  participants?: unknown[];
  hall?: string;
}) => syncToFlutter('programme_week', { ...weekData, updatedAt: new Date().toISOString() });

export const syncProgrammeWeekend = async (weekendData: {
  date: string;
  speaker?: string;
  discourseNumber?: number;
  discourseTitle?: string;
  chairman?: string;
  reader?: string;
  songs?: Record<string, unknown>;
}) => syncToFlutter('programme_weekend', { ...weekendData, updatedAt: new Date().toISOString() });

export const syncPredication = async (preachingData: {
  date: string;
  time?: string;
  location?: string;
  type?: string;
  groups?: unknown[];
  assignments?: unknown[];
}) => syncToFlutter('predication', { ...preachingData, updatedAt: new Date().toISOString() });

export const syncDiscoursPublics = async (discoursData: {
  date: string;
  speaker?: string;
  congregation?: string;
  discourseNumber?: number;
  discourseTitle?: string;
  isOutgoing?: boolean;
}) => syncToFlutter('discours_publics', { ...discoursData, updatedAt: new Date().toISOString() });

export const syncTemoignagePublic = async (temoignageData: {
  date: string;
  location?: string;
  time?: string;
  participants?: unknown[];
  materials?: unknown[];
}) => syncToFlutter('temoignage_public', { ...temoignageData, updatedAt: new Date().toISOString() });

export const syncServices = async (servicesData: {
  type: string;
  date?: string;
  assignments?: unknown[];
}) => syncToFlutter('services', { ...servicesData, updatedAt: new Date().toISOString() });

export const syncNettoyage = async (nettoyageData: {
  date: string;
  groups?: unknown[];
  assignments?: unknown[];
}) => syncToFlutter('nettoyage', { ...nettoyageData, updatedAt: new Date().toISOString() });

export const syncRapports = async (rapportsData: {
  month: string;
  reports?: unknown[];
  summary?: unknown;
}) => syncToFlutter('rapports', { ...rapportsData, updatedAt: new Date().toISOString() });

export const syncCommunications = async (communicationsData: {
  id?: string;
  title: string;
  content: string;
  date?: string;
  priority?: string;
  recipients?: string[];
}) => syncToFlutter('communications', { ...communicationsData, updatedAt: new Date().toISOString() });

export const syncTaches = async (tachesData: {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string;
  /** Legacy (names). Prefer assignedToPersonIds when possible. */
  assignedTo?: string[];
  /** Preferred stable references to people. */
  assignedToPersonIds?: string[];
  status?: string;
}) => syncToFlutter('taches', { ...tachesData, updatedAt: new Date().toISOString() });

export const syncTerritories = async (territoriesData: {
  id?: string;
  number: string;
  name?: string;
  /** Legacy (name). Prefer assignedToPersonId when possible. */
  assignedTo?: string;
  /** Preferred stable reference to a person. */
  assignedToPersonId?: string;
  assignedDate?: string;
  type?: string;
  addresses?: unknown[];
}) => syncToFlutter('territories', { ...territoriesData, updatedAt: new Date().toISOString() });

export const syncEmergencyContacts = async (contactsData: {
  personId: string;
  contacts: unknown[];
}) => syncToFlutter('emergency_contacts', { ...contactsData, updatedAt: new Date().toISOString() });
