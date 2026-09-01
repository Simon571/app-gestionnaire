import { list, put } from '@vercel/blob';

const REPORTS_PREFIX = 'publisher-preaching/reports/';
const SUBMISSIONS_PREFIX = 'publisher-preaching/submissions/';
const CONTENT_TYPE = 'application/json';

type PreachingStateKind = 'reports' | 'submissions';

const prefixFor = (kind: PreachingStateKind) =>
  kind === 'reports' ? REPORTS_PREFIX : SUBMISSIONS_PREFIX;

/** Reads the latest preaching snapshot of the requested kind from Vercel Blob. */
export async function readPublisherPreachingState(
  kind: PreachingStateKind
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  const result = await list({
    prefix: prefixFor(kind),
    limit: 100,
  });
  const latest = result.blobs.sort(
    (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
  )[0];

  if (!latest) return null;

  const response = await fetch(latest.downloadUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      `Unable to read Publisher preaching ${kind}: HTTP ${response.status}`
    );
  }

  return response.text();
}

/** Persists an immutable preaching snapshot in Vercel Blob. */
export async function writePublisherPreachingState(
  kind: PreachingStateKind,
  content: string
): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }

  await put(`${prefixFor(kind)}${kind}.json`, content, {
    access: 'public',
    addRandomSuffix: true,
    contentType: CONTENT_TYPE,
  });
}
