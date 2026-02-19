import path from 'path';
import { blobRead, blobWrite } from './blob-store';

const STORE_BLOB = 'data/publisher-preaching.json';
const STORE_LOCAL = path.join(process.cwd(), 'data', 'publisher-preaching.json');
const SUBMISSION_BLOB = 'data/publisher-preaching-submissions.json';
const SUBMISSION_LOCAL = path.join(process.cwd(), 'data', 'publisher-preaching-submissions.json');

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

const readFileSafe = async (): Promise<PreachingReportRecord[]> => {
  try {
    const raw = await blobRead(STORE_BLOB, STORE_LOCAL);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PreachingReportRecord[];
    if (parsed?.reports && Array.isArray(parsed.reports)) return parsed.reports as PreachingReportRecord[];
    return [];
  } catch {
    return [];
  }
};

const readSubmissionsSafe = async (): Promise<MonthSubmission[]> => {
  try {
    const raw = await blobRead(SUBMISSION_BLOB, SUBMISSION_LOCAL);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MonthSubmission[];
    if (parsed?.submissions && Array.isArray(parsed.submissions)) return parsed.submissions as MonthSubmission[];
    return [];
  } catch {
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
  await blobWrite(STORE_BLOB, STORE_LOCAL, JSON.stringify({ reports }, null, 2));
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
  await blobWrite(STORE_BLOB, STORE_LOCAL, JSON.stringify({ reports }, null, 2));

  const idx = submissions.findIndex((s) => s.month === month);
  const submission: MonthSubmission = { month, sentAt: new Date().toISOString(), lateUserIds };
  if (idx >= 0) submissions[idx] = submission;
  else submissions.push(submission);
  await blobWrite(SUBMISSION_BLOB, SUBMISSION_LOCAL, JSON.stringify({ submissions }, null, 2));

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
    await blobWrite(STORE_BLOB, STORE_LOCAL, JSON.stringify({ reports }, null, 2));
  }

  const filtered = submissions.filter((s) => s.month !== month);
  await blobWrite(SUBMISSION_BLOB, SUBMISSION_LOCAL, JSON.stringify({ submissions: filtered }, null, 2));
}

const SUBMISSION_PATH = isVercel ? '/tmp/publisher-preaching-submissions.json' : path.join(process.cwd(), 'data', 'publisher-preaching-submissions.json');
const SUBMISSION_DEPLOY = path.join(process.cwd(), 'data', 'publisher-preaching-submissions.json');

export interface PreachingReportRecord {
  userId: string;
  month: string; // YYYY-MM
  didPreach?: boolean;
  submitted?: boolean;
  status?: 'received' | 'validated';
  isLate?: boolean;
  totals?: { hours?: number; bibleStudies?: number; credit?: number };
  entries?: Record<string, unknown>; // date -> entry detail
  meta?: Record<string, unknown>;
  updatedAt: string;
}

export interface MonthSubmission {
  month: string; // YYYY-MM
  sentAt: string; // ISO date
  lateUserIds: string[]; // IDs of users marked as late
}

const readFileSafe = async () => {
  // Sur Vercel : essayer /tmp d'abord
  if (isVercel) {
    try {
      const raw = await fs.readFile(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as PreachingReportRecord[];
      if (parsed?.reports?.length > 0) return parsed.reports as PreachingReportRecord[];
    } catch { /* pas dans /tmp */ }
  }
  // Fallback : fichier du déploiement
  try {
    const raw = await fs.readFile(STORE_DEPLOY, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PreachingReportRecord[];
    if (parsed && Array.isArray(parsed.reports)) return parsed.reports as PreachingReportRecord[];
    return [];
  } catch {
    return [];
  }
};

const readSubmissionsSafe = async (): Promise<MonthSubmission[]> => {
  if (isVercel) {
    try {
      const raw = await fs.readFile(SUBMISSION_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as MonthSubmission[];
    } catch { /* pas dans /tmp */ }
  }
  try {
    const raw = await fs.readFile(SUBMISSION_DEPLOY, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MonthSubmission[];
    if (parsed && Array.isArray(parsed.submissions)) return parsed.submissions as MonthSubmission[];
    return [];
  } catch {
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
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({ reports }, null, 2), 'utf8');
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
  
  // Mark late users in reports
  for (const userId of lateUserIds) {
    const idx = reports.findIndex((r) => r.userId === userId && r.month === month);
    if (idx >= 0) {
      reports[idx].isLate = true;
      reports[idx].updatedAt = new Date().toISOString();
    } else {
      // Create a placeholder report for late user
      reports.push({
        userId,
        month,
        isLate: true,
        didPreach: false,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  
  // Save reports
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({ reports }, null, 2), 'utf8');
  
  // Update or create submission record
  const idx = submissions.findIndex((s) => s.month === month);
  const submission: MonthSubmission = {
    month,
    sentAt: new Date().toISOString(),
    lateUserIds,
  };
  
  if (idx >= 0) {
    submissions[idx] = submission;
  } else {
    submissions.push(submission);
  }
  
  await fs.mkdir(path.dirname(SUBMISSION_PATH), { recursive: true });
  await fs.writeFile(SUBMISSION_PATH, JSON.stringify({ submissions }, null, 2), 'utf8');
  
  return submission;
}

export async function cancelMonthSent(month: string): Promise<void> {
  const submissions = await readSubmissionsSafe();
  const reports = await readFileSafe();
  
  // Find the submission to get late user IDs
  const submission = submissions.find((s) => s.month === month);
  
  if (submission) {
    // Remove isLate flag from users
    for (const userId of submission.lateUserIds) {
      const idx = reports.findIndex((r) => r.userId === userId && r.month === month);
      if (idx >= 0) {
        reports[idx].isLate = false;
        reports[idx].updatedAt = new Date().toISOString();
      }
    }
    
    // Save reports
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify({ reports }, null, 2), 'utf8');
  }
  
  // Remove submission record
  const filteredSubmissions = submissions.filter((s) => s.month !== month);
  await fs.mkdir(path.dirname(SUBMISSION_PATH), { recursive: true });
  await fs.writeFile(SUBMISSION_PATH, JSON.stringify({ submissions: filteredSubmissions }, null, 2), 'utf8');
}
