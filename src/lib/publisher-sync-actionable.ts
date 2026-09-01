import type { PublisherSyncJob } from '@/types/publisher-sync';

const METADATA_KEYS = new Set([
  'generatedAt',
  'updatedAt',
  'createdAt',
  'savedAt',
  'source',
  'diagnostic',
  'boardType',
  'boardLabel',
  'meetingType',
  'weekLabel',
  'weekStart',
  'weekEnd',
  'hall',
  'totalCount',
]);

const isDiagnosticPayload = (payload: Record<string, unknown>): boolean => {
  const source = payload.source;
  return payload.diagnostic === true ||
    (typeof source === 'string' && /test|diagnostic|persistence-check/i.test(source));
};

const hasMeaningfulValue = (value: unknown, key?: string): boolean => {
  if (key && METADATA_KEYS.has(key)) return false;
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .some(([childKey, childValue]) => hasMeaningfulValue(childValue, childKey));
  }
  return false;
};

/**
 * Indique si un job contient réellement des données à transférer.
 * Les jobs de diagnostic, les payloads vides et ceux ne contenant que des
 * métadonnées ne doivent pas allumer les badges Publisher App.
 */
export const isActionablePublisherJob = (job: PublisherSyncJob): boolean => {
  const payload = job.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return hasMeaningfulValue(payload);
  }

  const record = payload as Record<string, unknown>;
  if (isDiagnosticPayload(record)) return false;
  return hasMeaningfulValue(record);
};
