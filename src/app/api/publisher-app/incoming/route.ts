import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import {
  PublisherSyncStatus,
  PublisherSyncType,
  PUBLISHER_SYNC_STATUSES,
  PUBLISHER_SYNC_TYPES,
} from '@/types/publisher-sync';

const isStatus = (value: string | null): value is PublisherSyncStatus =>
  value !== null && (PUBLISHER_SYNC_STATUSES as readonly string[]).includes(value);

const sanitizeTypes = (param: string | null): PublisherSyncType[] | undefined => {
  if (!param) return undefined;
  const allowed = PUBLISHER_SYNC_TYPES as readonly string[];
  const values = param
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is PublisherSyncType => allowed.includes(item));
  return values.length ? values : undefined;
};

const incomingBodySchema = z.object({
  type: z.enum(PUBLISHER_SYNC_TYPES),
  payload: z.unknown().default({}),
  initiator: z.string().optional(),
  deviceTarget: z.string().optional().nullable(),
  notify: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  // Vérifier si la requête vient du même origine (pas de device headers = requête locale)
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    // Accès local depuis le web dashboard - pas besoin d'authentification device
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const sinceParam = searchParams.get('since');

    const jobs = await PublisherSyncStore.listJobs({
      direction: 'mobile_to_desktop',
      status: isStatus(statusParam) ? statusParam : undefined,
      types: sanitizeTypes(typeParam),
      since: sinceParam ?? undefined,
    });

    return NextResponse.json({ jobs });
  }
  
  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest }) => {
      const { searchParams } = new URL(authRequest.url);
      const statusParam = searchParams.get('status');
      const typeParam = searchParams.get('type');
      const sinceParam = searchParams.get('since');

      const jobs = await PublisherSyncStore.listJobs({
        direction: 'mobile_to_desktop',
        status: isStatus(statusParam) ? statusParam : undefined,
        types: sanitizeTypes(typeParam),
        since: sinceParam ?? undefined,
      });

      return NextResponse.json({ jobs });
    },
    { roles: ['desktop', 'server'], permissions: ['incoming'], methods: ['GET'] }
  );
}

export async function POST(request: NextRequest) {
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest, device }) => {
      try {
        const json = await authRequest.json();
        const body = incomingBodySchema.parse(json);

        const job = await PublisherSyncStore.addJob({
          type: body.type,
          direction: 'mobile_to_desktop',
          payload: body.payload,
          initiator: body.initiator ?? device.label,
          deviceTarget: body.deviceTarget ?? null,
          notify: body.notify ?? false,
        });

        return NextResponse.json({ job }, { status: 201 });
      } catch (error) {
        console.error('publisher-app/incoming POST error', error);
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
      }
    },
    { roles: ['mobile', 'server'], permissions: ['incoming'], methods: ['POST'] }
  );
}
