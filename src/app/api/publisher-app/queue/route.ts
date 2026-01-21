import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import {
  PublisherSyncDirection,
  PublisherSyncStatus,
  PublisherSyncType,
  PUBLISHER_SYNC_DIRECTIONS,
  PUBLISHER_SYNC_STATUSES,
  PUBLISHER_SYNC_TYPES,
} from '@/types/publisher-sync';

const isDirection = (value: string | null): value is PublisherSyncDirection =>
  value !== null && (PUBLISHER_SYNC_DIRECTIONS as readonly string[]).includes(value);

const isStatus = (value: string | null): value is PublisherSyncStatus =>
  value !== null && (PUBLISHER_SYNC_STATUSES as readonly string[]).includes(value);

const sanitizeTypes = (param: string | null): PublisherSyncType[] | undefined => {
  if (!param) return undefined;
  const list = param
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as string[];
  return list.filter((value): value is PublisherSyncType =>
    (PUBLISHER_SYNC_TYPES as readonly string[]).includes(value)
  );
};

export async function GET(request: NextRequest) {
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    // Accès local depuis le web dashboard
    const { searchParams } = new URL(request.url);
    const directionParam = searchParams.get('direction');
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const sinceParam = searchParams.get('since');

    const direction = isDirection(directionParam) ? directionParam : undefined;
    const status = isStatus(statusParam) ? statusParam : undefined;
    const types = sanitizeTypes(typeParam);
    const limit = limitParam ? Number(limitParam) : undefined;

    const jobs = await PublisherSyncStore.listJobs({
      direction,
      status,
      types,
      limit: Number.isNaN(limit) ? undefined : limit,
      since: sinceParam ?? undefined,
    });

    return NextResponse.json({ jobs });
  }
  
  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest }) => {
      const { searchParams } = new URL(authRequest.url);
  const directionParam = searchParams.get('direction');
  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const limitParam = searchParams.get('limit');
  const sinceParam = searchParams.get('since');

  const direction = isDirection(directionParam) ? directionParam : undefined;
  const status = isStatus(statusParam) ? statusParam : undefined;
  const types = sanitizeTypes(typeParam);
  const limit = limitParam ? Number(limitParam) : undefined;

      const jobs = await PublisherSyncStore.listJobs({
    direction,
    status,
    types,
    limit: Number.isNaN(limit) ? undefined : limit,
    since: sinceParam ?? undefined,
  });

      return NextResponse.json({ jobs });
    },
    { roles: ['desktop', 'server'], permissions: ['queue'], methods: ['GET'] }
  );
}
