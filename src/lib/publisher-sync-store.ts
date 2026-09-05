/**
 * publisher-sync-store.ts
 *
 * Stockage persistant des jobs de synchronisation et des notifications.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ARCHITECTURE DOUBLE MODE :
 *  • Sur Vercel (serverless) → Vercel Blob Store (persistant entre requêtes)
 *  • En local (dev / MSI)   → Filesystem JSON (data/publisher-sync/state.json)
 * ─────────────────────────────────────────────────────────────────────
 *
 * L'interface publique (listJobs, addJob, updateJob, etc.) reste identique
 * à l'ancienne version SQLite — aucun autre fichier n'a besoin de changer.
 */
import { randomUUID } from 'crypto';
import { blobRead, blobWrite } from '@/lib/blob-store';
import {
  readPublisherSyncState,
  writePublisherSyncState,
} from '@/lib/publisher-sync-persistence';
import {
  PublisherSyncDirection,
  PublisherSyncJob,
  PublisherSyncNotification,
  PublisherSyncStatus,
  PublisherSyncType,
} from '@/types/publisher-sync';

// ─── Chemins de stockage ────────────────────────────────────────────
const BLOB_PATH = 'publisher-sync/state.json';
const isVercel = process.env.VERCEL === '1';
const hasRedisStorage = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
const hasVercelBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
const LOCAL_PATH = (() => {
  // Utiliser path.join seulement côté serveur
  try {
    const path = require('path');
    return path.join(process.cwd(), 'data', 'publisher-sync', 'state.json');
  } catch {
    return 'data/publisher-sync/state.json';
  }
})();

const MAX_NOTIFICATIONS = 200;
const MAX_JOBS = 500; // Garder les 500 derniers jobs pour éviter que le fichier grossisse trop

// ─── Structure de l'état persisté ────────────────────────────────────
interface PersistedState {
  jobs: PublisherSyncJob[];
  notifications: PublisherSyncNotification[];
}

const EMPTY_STATE: PersistedState = { jobs: [], notifications: [] };

// ─── Lecture / Écriture de l'état ────────────────────────────────────

async function readState(): Promise<PersistedState> {
  try {
    // En production, Redis est prioritaire comme dans les autres stores de
    // l'application. Vercel Blob reste pris en charge pour les déploiements
    // qui utilisent encore BLOB_READ_WRITE_TOKEN.
    let raw: string | null;
    if (isVercel && hasRedisStorage()) {
      // Repli sur Blob seulement si Redis est *en panne*, pas s'il repond
      // « rien ici » : `readPublisherSyncState` appelle `list()` sur le magasin
      // Blob, compte comme une « advanced operation », et le forfait Hobby n'en
      // accorde que 2 000 par mois. Declenche a chaque lecture sur une base
      // encore vide, cela bloque le magasin — ce qui est arrive une fois.
      try {
        raw = await blobRead(BLOB_PATH, LOCAL_PATH);
      } catch (redisError) {
        if (!hasVercelBlob()) throw redisError;
        console.warn('publisher-sync-store: Redis indisponible, repli sur Blob', redisError);
        raw = await readPublisherSyncState();
      }
    } else if (isVercel && hasVercelBlob()) {
      raw = await readPublisherSyncState();
    } else if (isVercel) {
      throw new Error('Aucun stockage persistant de synchronisation configuré');
    } else {
      raw = await blobRead(BLOB_PATH, LOCAL_PATH);
    }

    if (!raw) return { ...EMPTY_STATE };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch (error) {
    console.error('publisher-sync-store: failed to read state', error);
    throw error;
  }
}

async function writeState(state: PersistedState): Promise<void> {
  try {
    // Limiter la taille : garder seulement les N derniers jobs et notifications
    const trimmedState: PersistedState = {
      jobs: state.jobs.slice(0, MAX_JOBS),
      notifications: state.notifications.slice(0, MAX_NOTIFICATIONS),
    };
    const content = JSON.stringify(trimmedState, null, 2);
    if (isVercel && hasRedisStorage()) {
      try {
        await blobWrite(BLOB_PATH, LOCAL_PATH, content);
      } catch (redisError) {
        if (!hasVercelBlob()) throw redisError;
        console.warn('publisher-sync-store: Redis write failed, using Vercel Blob', redisError);
        await writePublisherSyncState(content);
      }
    } else if (isVercel && hasVercelBlob()) {
      await writePublisherSyncState(content);
    } else if (isVercel) {
      throw new Error('Aucun stockage persistant de synchronisation configuré');
    } else {
      await blobWrite(BLOB_PATH, LOCAL_PATH, content);
    }
  } catch (error) {
    console.error('publisher-sync-store: failed to write state', error);
    throw error;
  }
}

// ─── Interfaces publiques (inchangées) ──────────────────────────────

export interface ListJobsFilter {
  direction?: PublisherSyncDirection;
  status?: PublisherSyncStatus;
  types?: PublisherSyncType[];
  since?: string; // ISO date
  limit?: number;
}

export interface AddJobInput {
  type: PublisherSyncType;
  direction: PublisherSyncDirection;
  payload: unknown;
  initiator?: string;
  deviceTarget?: string | null;
  notify?: boolean;
}

// ─── Classe principale (interface publique identique) ────────────────

export class PublisherSyncStore {
  /**
   * Liste les jobs de synchronisation avec filtrage optionnel.
   */
  static async listJobs(filter: ListJobsFilter = {}): Promise<PublisherSyncJob[]> {
    const state = await readState();
    let jobs = [...state.jobs];

    // Filtrage
    if (filter.direction) {
      jobs = jobs.filter((j) => j.direction === filter.direction);
    }
    if (filter.status) {
      jobs = jobs.filter((j) => j.status === filter.status);
    }
    if (filter.types && filter.types.length > 0) {
      jobs = jobs.filter((j) => filter.types!.includes(j.type));
    }
    if (filter.since) {
      const sinceDate = filter.since;
      jobs = jobs.filter((j) => j.updatedAt >= sinceDate);
    }

    // Tri par date de création décroissante
    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limite
    if (filter.limit && filter.limit > 0) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs;
  }

  /**
   * Ajoute un nouveau job de synchronisation.
   */
  static async addJob(input: AddJobInput): Promise<PublisherSyncJob> {
    const state = await readState();
    const now = new Date().toISOString();

    const job: PublisherSyncJob = {
      id: randomUUID(),
      type: input.type,
      direction: input.direction,
      payload: input.payload,
      status: 'pending',
      initiator: input.initiator,
      deviceTarget: input.deviceTarget ?? null,
      notify: input.notify ?? false,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    // Ajouter le job en tête de liste (le plus récent en premier)
    state.jobs.unshift(job);

    // Ajouter une notification si demandé
    if (input.notify) {
      const notif: PublisherSyncNotification = {
        id: randomUUID(),
        jobId: job.id,
        message: `Notification programmée pour ${job.type}`,
        level: 'info',
        createdAt: now,
      };
      state.notifications.unshift(notif);
    }

    await writeState(state);
    return job;
  }

  /**
   * Met à jour un job existant.
   */
  static async updateJob(
    jobId: string,
    updates: Partial<Pick<PublisherSyncJob, 'status' | 'payload' | 'errorMessage' | 'deviceTarget'>>
  ): Promise<PublisherSyncJob | null> {
    const state = await readState();
    const jobIndex = state.jobs.findIndex((j) => j.id === jobId);

    if (jobIndex === -1) {
      return null;
    }

    const now = new Date().toISOString();
    const job = { ...state.jobs[jobIndex] };

    if (updates.status) {
      job.status = updates.status;
    }
    if (updates.payload !== undefined) {
      job.payload = updates.payload;
    }
    if (updates.errorMessage !== undefined) {
      job.errorMessage = updates.errorMessage ?? null;
    }
    if (updates.deviceTarget !== undefined) {
      job.deviceTarget = updates.deviceTarget ?? null;
    }
    job.updatedAt = now;

    state.jobs[jobIndex] = job;

    // Ajouter une notification de changement de statut
    if (updates.status) {
      const notif: PublisherSyncNotification = {
        id: randomUUID(),
        jobId,
        message: `Statut mis à jour → ${updates.status}`,
        level: updates.status === 'failed' ? 'error' : 'info',
        createdAt: now,
      };
      state.notifications.unshift(notif);
    }

    await writeState(state);
    return job;
  }

  /**
   * Recherche un job par son ID.
   */
  private static async getJob(jobId: string): Promise<PublisherSyncJob | null> {
    const state = await readState();
    return state.jobs.find((j) => j.id === jobId) ?? null;
  }

  // Public accessor for job lookup
  static async findJob(jobId: string): Promise<PublisherSyncJob | null> {
    return this.getJob(jobId);
  }

  /**
   * Ajoute une notification.
   */
  static async addNotification(
    notification: Omit<PublisherSyncNotification, 'id' | 'createdAt'> & { id?: string }
  ): Promise<PublisherSyncNotification> {
    const state = await readState();

    const record: PublisherSyncNotification = {
      id: notification.id ?? randomUUID(),
      jobId: notification.jobId,
      message: notification.message,
      level: notification.level,
      createdAt: new Date().toISOString(),
    };

    state.notifications.unshift(record);

    // Garder seulement les N dernières notifications
    if (state.notifications.length > MAX_NOTIFICATIONS) {
      state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
    }

    await writeState(state);
    return record;
  }

  /**
   * Liste les notifications les plus récentes.
   */
  static async listNotifications(limit = 50): Promise<PublisherSyncNotification[]> {
    const state = await readState();
    // Tri par date décroissante
    const sorted = [...state.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, limit);
  }

  /**
   * Supprime une notification par son ID.
   */
  static async removeNotification(id: string): Promise<void> {
    const state = await readState();
    state.notifications = state.notifications.filter((n) => n.id !== id);
    await writeState(state);
  }

  /**
   * Supprime toutes les notifications.
   */
  static async clearNotifications(): Promise<void> {
    const state = await readState();
    state.notifications = [];
    await writeState(state);
  }
}
