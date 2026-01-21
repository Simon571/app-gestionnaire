export const PUBLISHER_SYNC_TYPES = [
  'programme_week',
  'programme_weekend',
  'predication',
  'discours_publics',
  'temoignage_public',
  'services',
  'nettoyage',
  'rapports',
  'assistance',
  'communications',
  'taches',
  'territories',
  'emergency_contacts',
  'user_data',
] as const;

export type PublisherSyncType = typeof PUBLISHER_SYNC_TYPES[number];

export const PUBLISHER_SYNC_DIRECTIONS = ['desktop_to_mobile', 'mobile_to_desktop'] as const;
export type PublisherSyncDirection = typeof PUBLISHER_SYNC_DIRECTIONS[number];

export const PUBLISHER_SYNC_STATUSES = ['pending', 'sent', 'processed', 'failed'] as const;
export type PublisherSyncStatus = typeof PUBLISHER_SYNC_STATUSES[number];

export interface PublisherSyncJob {
  id: string;
  type: PublisherSyncType;
  direction: PublisherSyncDirection;
  payload: unknown;
  status: PublisherSyncStatus;
  initiator?: string;
  deviceTarget?: string | null;
  notify?: boolean;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublisherSyncNotification {
  id: string;
  jobId?: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  createdAt: string;
}
