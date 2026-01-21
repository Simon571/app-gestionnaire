import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3';
import {
  PublisherSyncDirection,
  PublisherSyncJob,
  PublisherSyncNotification,
  PublisherSyncStatus,
  PublisherSyncType,
} from '@/types/publisher-sync';

const DATA_DIR = path.join(process.cwd(), 'data', 'publisher-sync');
const STATE_JSON_FILE = path.join(DATA_DIR, 'state.json');
const STATE_DB_FILE = path.join(DATA_DIR, 'state.db');

type JobRow = {
  id: string;
  type: PublisherSyncType;
  direction: PublisherSyncDirection;
  payload: string;
  status: PublisherSyncStatus;
  initiator: string | null;
  device_target: string | null;
  notify: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: string;
  job_id: string | null;
  message: string;
  level: PublisherSyncNotification['level'];
  created_at: string;
};

let db: Database.Database | null = null;
const initializationPromise = initializeDatabase();

async function initializeDatabase(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (!db) {
    db = new Database(STATE_DB_FILE);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS publisher_sync_jobs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      direction TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      initiator TEXT,
      device_target TEXT,
      notify INTEGER DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_direction_status ON publisher_sync_jobs(direction, status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_jobs_type ON publisher_sync_jobs(type);
    CREATE TABLE IF NOT EXISTS publisher_sync_notifications (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      message TEXT NOT NULL,
      level TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES publisher_sync_jobs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON publisher_sync_notifications(created_at DESC);
  `);

  await migrateLegacyStateIfNeeded();
}

async function migrateLegacyStateIfNeeded(): Promise<void> {
  if (!db) return;
  const count = db.prepare('SELECT COUNT(1) as total FROM publisher_sync_jobs').get() as { total: number };
  if (count.total > 0) {
    return;
  }
  try {
    await fs.access(STATE_JSON_FILE);
  } catch {
    return;
  }

  try {
    const raw = await fs.readFile(STATE_JSON_FILE, 'utf8');
    const parsed = JSON.parse(raw) as {
      jobs?: PublisherSyncJob[];
      notifications?: PublisherSyncNotification[];
    };
    const jobs = parsed.jobs ?? [];
    const notifications = parsed.notifications ?? [];
    const insertJob = db.prepare(`
      INSERT INTO publisher_sync_jobs
      (id, type, direction, payload, status, initiator, device_target, notify, error_message, created_at, updated_at)
      VALUES (@id, @type, @direction, @payload, @status, @initiator, @device_target, @notify, @error_message, @created_at, @updated_at)
    `);
    const insertNotif = db.prepare(`
      INSERT INTO publisher_sync_notifications (id, job_id, message, level, created_at)
      VALUES (@id, @job_id, @message, @level, @created_at)
    `);

    const insertJobsTransaction = db.transaction((records: PublisherSyncJob[]) => {
      records.forEach((job) => {
        insertJob.run({
          id: job.id,
          type: job.type,
          direction: job.direction,
          payload: JSON.stringify(job.payload ?? {}),
          status: job.status,
          initiator: job.initiator ?? null,
          device_target: job.deviceTarget ?? null,
          notify: job.notify ? 1 : 0,
          error_message: job.errorMessage ?? null,
          created_at: job.createdAt,
          updated_at: job.updatedAt,
        });
      });
    });

    const insertNotificationsTransaction = db.transaction((records: PublisherSyncNotification[]) => {
      records.forEach((notif) => {
        insertNotif.run({
          id: notif.id,
          job_id: notif.jobId ?? null,
          message: notif.message,
          level: notif.level,
          created_at: notif.createdAt,
        });
      });
    });

    insertJobsTransaction(jobs);
    insertNotificationsTransaction(notifications.slice(-200));
    await fs.rename(STATE_JSON_FILE, `${STATE_JSON_FILE}.bak`);
    console.info('publisher-sync-store: legacy JSON state migrated to SQLite');
  } catch (error) {
    console.error('publisher-sync-store: unable to migrate legacy state', error);
  }
}

const mapJobRow = (row: JobRow): PublisherSyncJob => ({
  id: row.id,
  type: row.type,
  direction: row.direction,
  payload: safeParsePayload(row.payload),
  status: row.status,
  initiator: row.initiator ?? undefined,
  deviceTarget: row.device_target,
  notify: Boolean(row.notify),
  errorMessage: row.error_message,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNotificationRow = (row: NotificationRow): PublisherSyncNotification => ({
  id: row.id,
  jobId: row.job_id ?? undefined,
  message: row.message,
  level: row.level,
  createdAt: row.created_at,
});

const safeParsePayload = (input: string): unknown => {
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
};

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

export class PublisherSyncStore {
  static async listJobs(filter: ListJobsFilter = {}): Promise<PublisherSyncJob[]> {
    await initializationPromise;
    if (!db) return [];

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.direction) {
      conditions.push('direction = ?');
      params.push(filter.direction);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.types && filter.types.length > 0) {
      const placeholders = filter.types.map(() => '?').join(',');
      conditions.push(`type IN (${placeholders})`);
      params.push(...filter.types);
    }
    if (filter.since) {
      conditions.push('updated_at >= ?');
      params.push(filter.since);
    }

    let query = 'SELECT * FROM publisher_sync_jobs';
    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY created_at DESC';
    if (filter.limit && filter.limit > 0) {
      query += ' LIMIT ?';
      params.push(filter.limit);
    }

    const rows = db.prepare(query).all(...params) as JobRow[];
    return rows.map(mapJobRow);
  }

  static async addJob(input: AddJobInput): Promise<PublisherSyncJob> {
    await initializationPromise;
    if (!db) {
      throw new Error('publisher-sync-store: database not initialized');
    }
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

    const insertJob = db.prepare(`
      INSERT INTO publisher_sync_jobs
      (id, type, direction, payload, status, initiator, device_target, notify, error_message, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNotification = db.prepare(`
      INSERT INTO publisher_sync_notifications (id, job_id, message, level, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((record: PublisherSyncJob) => {
      insertJob.run(
        record.id,
        record.type,
        record.direction,
        JSON.stringify(record.payload ?? {}),
        record.status,
        record.initiator ?? null,
        record.deviceTarget ?? null,
        record.notify ? 1 : 0,
        record.errorMessage,
        record.createdAt,
        record.updatedAt
      );
      if (input.notify) {
        insertNotification.run(randomUUID(), record.id, `Notification programmée pour ${record.type}`, 'info', now);
      }
    });

    transaction(job);
    return job;
  }

  static async updateJob(
    jobId: string,
    updates: Partial<Pick<PublisherSyncJob, 'status' | 'payload' | 'errorMessage' | 'deviceTarget'>>
  ): Promise<PublisherSyncJob | null> {
    await initializationPromise;
    if (!db) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.status) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.payload !== undefined) {
      fields.push('payload = ?');
      params.push(JSON.stringify(updates.payload ?? {}));
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      params.push(updates.errorMessage ?? null);
    }
    if (updates.deviceTarget !== undefined) {
      fields.push('device_target = ?');
      params.push(updates.deviceTarget ?? null);
    }

    if (!fields.length) {
      return this.getJob(jobId);
    }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(jobId);

    const stmt = db.prepare(`UPDATE publisher_sync_jobs SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    if (result.changes === 0) {
      return null;
    }

    if (updates.status) {
      await this.addNotification({
        jobId,
        message: `Statut mis à jour → ${updates.status}`,
        level: updates.status === 'failed' ? 'error' : 'info',
      });
    }

    return this.getJob(jobId);
  }

  private static async getJob(jobId: string): Promise<PublisherSyncJob | null> {
    await initializationPromise;
    if (!db) return null;
    const row = db
      .prepare('SELECT * FROM publisher_sync_jobs WHERE id = ? LIMIT 1')
      .get(jobId) as JobRow | undefined;
    return row ? mapJobRow(row) : null;
  }

  // Public accessor for job lookup
  static async findJob(jobId: string): Promise<PublisherSyncJob | null> {
    return this.getJob(jobId);
  }

  static async addNotification(
    notification: Omit<PublisherSyncNotification, 'id' | 'createdAt'> & { id?: string }
  ): Promise<PublisherSyncNotification> {
    await initializationPromise;
    if (!db) {
      throw new Error('publisher-sync-store: database not initialized');
    }

    const record: PublisherSyncNotification = {
      id: notification.id ?? randomUUID(),
      jobId: notification.jobId,
      message: notification.message,
      level: notification.level,
      createdAt: new Date().toISOString(),
    };

    db.prepare(
      'INSERT INTO publisher_sync_notifications (id, job_id, message, level, created_at) VALUES (?, ?, ?, ?, ?);'
    ).run(record.id, record.jobId ?? null, record.message, record.level, record.createdAt);

    db.prepare(
      'DELETE FROM publisher_sync_notifications WHERE id NOT IN (SELECT id FROM publisher_sync_notifications ORDER BY created_at DESC LIMIT 200)'
    ).run();

    return record;
  }

  static async listNotifications(limit = 50): Promise<PublisherSyncNotification[]> {
    await initializationPromise;
    if (!db) return [];
    const rows = db
      .prepare('SELECT * FROM publisher_sync_notifications ORDER BY created_at DESC LIMIT ?')
      .all(limit) as NotificationRow[];
    return rows.map(mapNotificationRow);
  }

  static async removeNotification(id: string): Promise<void> {
    await initializationPromise;
    if (!db) return;
    db.prepare('DELETE FROM publisher_sync_notifications WHERE id = ?').run(id);
  }

  static async clearNotifications(): Promise<void> {
    await initializationPromise;
    if (!db) return;
    db.prepare('DELETE FROM publisher_sync_notifications').run();
  }
}
