import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { PublisherSyncType, PUBLISHER_SYNC_TYPES } from '@/types/publisher-sync';

const sanitizeTypes = (params: URLSearchParams): PublisherSyncType[] | undefined => {
  const typeParam = params.getAll('type');
  const legacy = params.get('types');
  const raw = [...typeParam];
  if (legacy) {
    raw.push(...legacy.split(','));
  }
  if (!raw.length) return undefined;
  const allowed = PUBLISHER_SYNC_TYPES as readonly string[];
  const filtered = raw
    .map((item) => item.trim())
    .filter((item): item is PublisherSyncType => allowed.includes(item));
  return filtered.length ? filtered : undefined;
};

export async function GET(request: NextRequest) {
  try {
    return await handlePublisherSyncRequest(
      request,
      async ({ request: authRequest }) => {
        const { searchParams } = new URL(authRequest.url);
        const since = searchParams.get('since') ?? undefined;
        const types = sanitizeTypes(searchParams);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? Number(limitParam) : undefined;

        // Get both pending and sent jobs (sent = confirmed by desktop, ready for mobile)
        const [pendingJobs, sentJobs] = await Promise.all([
          PublisherSyncStore.listJobs({
            direction: 'desktop_to_mobile',
            status: 'pending',
            since,
            types,
            limit: Number.isNaN(limit) ? undefined : limit,
          }),
          PublisherSyncStore.listJobs({
            direction: 'desktop_to_mobile',
            status: 'sent',
            since,
            types,
            limit: Number.isNaN(limit) ? undefined : limit,
          }),
        ]);

        // Combine and sort by createdAt descending
        const jobs = [...pendingJobs, ...sentJobs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ jobs });
      },
      { roles: ['mobile', 'desktop', 'server'], permissions: ['updates'], methods: ['GET'] }
    );
  } catch (error) {
    console.error('publisher-app/updates GET error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
