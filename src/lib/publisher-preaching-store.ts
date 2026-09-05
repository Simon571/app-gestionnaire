/**
 * publisher-preaching-store.ts
 *
 * Rapports d'activite (predication) et envois mensuels au Bethel.
 *
 * Sur Vercel, la source de verite est Redis, comme pour les autres magasins.
 * Vercel Blob n'intervient qu'en repli, et seulement si Redis est *en panne* :
 * `readPublisherPreachingState` appelle `list()` sur le magasin Blob, ce que le
 * forfait Hobby compte comme une « advanced operation » et n'en accorde que
 * 2 000 par mois. Ce module lisait auparavant *uniquement* dans Blob des qu'il
 * tournait sur Vercel : une operation avancee par lecture de rapports, ce qui a
 * fini par bloquer le magasin. La recuperation des donnees restees dans Blob se
 * fait explicitement, par `npm run recover:blob`.
 *
 * Passer par `blobRead`/`blobWrite` cloisonne aussi les rapports par assemblee
 * (`tenants/<id>/data/publisher-preaching.json`), ce que l'acces direct a Blob
 * ne faisait pas : toutes les assemblees partageaient le meme fichier.
 */
import path from 'path';
import { StorageUnavailableError, blobRead, blobWrite } from './blob-store';
import {
  readPublisherPreachingState,
  writePublisherPreachingState,
} from './publisher-preaching-persistence';

const STORE_BLOB = 'data/publisher-preaching.json';
const STORE_LOCAL = path.join(process.cwd(), 'data', 'publisher-preaching.json');
const SUBMISSION_BLOB = 'data/publisher-preaching-submissions.json';
const SUBMISSION_LOCAL = path.join(process.cwd(), 'data', 'publisher-preaching-submissions.json');

const isVercel = process.env.VERCEL === '1';
const hasRedisStorage = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim()) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());
const hasVercelBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

export interface PreachingReportRecord {
  userId: string;
  month: string; // YYYY-MM
  didPreach?: boolean;
  submitted?: boolean;
  status?: 'received' | 'validated';
  isLate?: boolean;
  totals?: { hours?: number; bibleStudies?: number; credit?: number };
  entries?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  updatedAt: string;
}

export interface MonthSubmission {
  month: string;
  sentAt: string;
  lateUserIds: string[];
}

const readReportsState = async (): Promise<string | null> => {
  if (isVercel && hasRedisStorage()) {
    try {
      return await blobRead(STORE_BLOB, STORE_LOCAL);
    } catch (redisError) {
      if (!hasVercelBlob()) throw redisError;
      console.warn('publisher-preaching-store: Redis indisponible, repli sur Blob', redisError);
      return readPublisherPreachingState('reports');
    }
  }
  if (isVercel && hasVercelBlob()) {
    return readPublisherPreachingState('reports');
  }
  return blobRead(STORE_BLOB, STORE_LOCAL);
};

const writeReportsState = async (content: string): Promise<void> => {
  if (isVercel && hasRedisStorage()) {
    try {
      await blobWrite(STORE_BLOB, STORE_LOCAL, content);
      return;
    } catch (redisError) {
      if (!hasVercelBlob()) throw redisError;
      console.warn('publisher-preaching-store: ecriture Redis impossible, repli sur Blob', redisError);
      await writePublisherPreachingState('reports', content);
      return;
    }
  }
  if (isVercel && hasVercelBlob()) {
    await writePublisherPreachingState('reports', content);
    return;
  }
  await blobWrite(STORE_BLOB, STORE_LOCAL, content);
};

const readSubmissionsState = async (): Promise<string | null> => {
  if (isVercel && hasRedisStorage()) {
    try {
      return await blobRead(SUBMISSION_BLOB, SUBMISSION_LOCAL);
    } catch (redisError) {
      if (!hasVercelBlob()) throw redisError;
      console.warn('publisher-preaching-store: Redis indisponible, repli sur Blob', redisError);
      return readPublisherPreachingState('submissions');
    }
  }
  if (isVercel && hasVercelBlob()) {
    return readPublisherPreachingState('submissions');
  }
  return blobRead(SUBMISSION_BLOB, SUBMISSION_LOCAL);
};

const writeSubmissionsState = async (content: string): Promise<void> => {
  if (isVercel && hasRedisStorage()) {
    try {
      await blobWrite(SUBMISSION_BLOB, SUBMISSION_LOCAL, content);
      return;
    } catch (redisError) {
      if (!hasVercelBlob()) throw redisError;
      console.warn('publisher-preaching-store: ecriture Redis impossible, repli sur Blob', redisError);
      await writePublisherPreachingState('submissions', content);
      return;
    }
  }
  if (isVercel && hasVercelBlob()) {
    await writePublisherPreachingState('submissions', content);
    return;
  }
  await blobWrite(SUBMISSION_BLOB, SUBMISSION_LOCAL, content);
};

/**
 * Un stockage injoignable n'est pas un stockage vide.
 *
 * Ces lectures alimentent des cycles lecture-modification-ecriture
 * (`upsertPreachingReport`, `markMonthAsSent`) : renvoyer `[]` sur une panne
 * ferait reecrire l'etat complet avec le seul enregistrement en cours, donc
 * effacerait tous les rapports. La panne remonte, les donnees restent.
 */
const readFileSafe = async (): Promise<PreachingReportRecord[]> => {
  try {
    const raw = await readReportsState();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PreachingReportRecord[];
    if (parsed?.reports && Array.isArray(parsed.reports)) return parsed.reports as PreachingReportRecord[];
    return [];
  } catch (error) {
    if (error instanceof StorageUnavailableError) throw error;
    return [];
  }
};

const readSubmissionsSafe = async (): Promise<MonthSubmission[]> => {
  try {
    const raw = await readSubmissionsState();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MonthSubmission[];
    if (parsed?.submissions && Array.isArray(parsed.submissions)) return parsed.submissions as MonthSubmission[];
    return [];
  } catch (error) {
    if (error instanceof StorageUnavailableError) throw error;
    return [];
  }
};

export async function listPreachingReports(): Promise<PreachingReportRecord[]> {
  return readFileSafe();
}

export async function upsertPreachingReport(report: Omit<PreachingReportRecord, 'updatedAt'>) {
  const reports = await readFileSafe();
  const idx = reports.findIndex((r) => r.userId === report.userId && r.month === report.month);
  const existing = idx >= 0 ? reports[idx] : undefined;
  const record: PreachingReportRecord = {
    ...existing,
    ...report,
    status: report.status ?? existing?.status ?? 'received',
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    reports[idx] = record;
  } else {
    reports.push(record);
  }
  await writeReportsState(JSON.stringify({ reports }, null, 2));
  return record;
}

export async function listMonthSubmissions(): Promise<MonthSubmission[]> {
  return readSubmissionsSafe();
}

export async function getMonthSubmission(month: string): Promise<MonthSubmission | null> {
  const submissions = await readSubmissionsSafe();
  return submissions.find((s) => s.month === month) ?? null;
}

export async function markMonthAsSent(month: string, lateUserIds: string[]): Promise<MonthSubmission> {
  const submissions = await readSubmissionsSafe();
  const reports = await readFileSafe();

  for (const userId of lateUserIds) {
    const idx = reports.findIndex((r) => r.userId === userId && r.month === month);
    if (idx >= 0) {
      reports[idx].isLate = true;
      reports[idx].updatedAt = new Date().toISOString();
    } else {
      reports.push({ userId, month, isLate: true, didPreach: false, updatedAt: new Date().toISOString() });
    }
  }
  await writeReportsState(JSON.stringify({ reports }, null, 2));

  const idx = submissions.findIndex((s) => s.month === month);
  const submission: MonthSubmission = { month, sentAt: new Date().toISOString(), lateUserIds };
  if (idx >= 0) submissions[idx] = submission;
  else submissions.push(submission);
  await writeSubmissionsState(JSON.stringify({ submissions }, null, 2));

  return submission;
}

export async function cancelMonthSent(month: string): Promise<void> {
  const submissions = await readSubmissionsSafe();
  const reports = await readFileSafe();

  const submission = submissions.find((s) => s.month === month);
  if (submission) {
    for (const userId of submission.lateUserIds) {
      const idx = reports.findIndex((r) => r.userId === userId && r.month === month);
      if (idx >= 0) {
        reports[idx].isLate = false;
        reports[idx].updatedAt = new Date().toISOString();
      }
    }
    await writeReportsState(JSON.stringify({ reports }, null, 2));
  }

  const filtered = submissions.filter((s) => s.month !== month);
  await writeSubmissionsState(JSON.stringify({ submissions: filtered }, null, 2));
}