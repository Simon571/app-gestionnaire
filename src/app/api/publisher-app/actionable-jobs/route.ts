import { NextRequest, NextResponse } from 'next/server';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { isActionablePublisherJob } from '@/lib/publisher-sync-actionable';
import type { PublisherSyncStatus, PublisherSyncType } from '@/types/publisher-sync';
import { PUBLISHER_SYNC_STATUSES, PUBLISHER_SYNC_TYPES } from '@/types/publisher-sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const parseStatus = (value: string | null): PublisherSyncStatus | undefined =>
  value && (PUBLISHER_SYNC_STATUSES as readonly string[]).includes(value)
    ? (value as PublisherSyncStatus)
    : undefined;

const parseTypes = (value: string | null): PublisherSyncType[] | undefined => {
  if (!value) return undefined;
  const types = value
    .split(',')
    .filter((type): type is PublisherSyncType =>
      (PUBLISHER_SYNC_TYPES as readonly string[]).includes(type)
    );
  return types.length ? types : undefined;
};

export async function GET(request: NextRequest) {
  const direction = request.nextUrl.searchParams.get('direction');
  const status = parseStatus(request.nextUrl.searchParams.get('status'));
  const jobs = await PublisherSyncStore.listJobs({
    direction: direction === 'mobile_to_desktop' || direction === 'desktop_to_mobile'
      ? direction
      : undefined,
    status,
    types: parseTypes(request.nextUrl.searchParams.get('type')),
    since: request.nextUrl.searchParams.get('since') ?? undefined,
  });

  const actionableJobs = jobs.filter(isActionablePublisherJob);
  return NextResponse.json(
    { jobs: actionableJobs, count: actionableJobs.length },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
