import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { PUBLISHER_SYNC_STATUSES } from '@/types/publisher-sync';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

const bodySchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(PUBLISHER_SYNC_STATUSES).default('processed'),
  deviceId: z.string().optional(),
  errorMessage: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  // Deux appelants : le tableau de bord (cookie) et un telephone signant sa
  // requete. Sans en-tete d'appareil, la route n'exigeait rien : marquer un job
  // « traite » depuis l'exterieur suffisait a faire disparaitre un envoi.
  // Contrairement a /send, un proclamateur est admis : accuser reception fait
  // partie de ce qu'il peut faire (cf. PUBLISHER_WRITABLE_PATHS).
  const deviceIdHeader = request.headers.get('x-device-id');

  const updateLocally = async () => {
    try {
      const json = await request.json();
      const body = bodySchema.parse(json);

      const updated = await PublisherSyncStore.updateJob(body.jobId, {
        status: body.status,
        deviceTarget: body.deviceId ?? null,
        errorMessage: body.errorMessage ?? null,
      });

      if (!updated) {
        return NextResponse.json({ error: 'Job introuvable.' }, { status: 404 });
      }

      return NextResponse.json({ job: updated });
    } catch (error) {
      console.error('publisher-app/ack local error', error);
      return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
    }
  };

  if (!deviceIdHeader) {
    const session = await readSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
    }
    return runWithTenant(session.tenantId, updateLocally);
  }

  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest, device }) => {
      try {
        const json = await authRequest.json();
        const body = bodySchema.parse(json);

        const updated = await PublisherSyncStore.updateJob(body.jobId, {
          status: body.status,
          deviceTarget: body.deviceId ?? device.id,
          errorMessage: body.errorMessage ?? null,
        });

        if (!updated) {
          return NextResponse.json({ error: 'Job introuvable.' }, { status: 404 });
        }

        return NextResponse.json({ job: updated });
      } catch (error) {
        console.error('publisher-app/ack error', error);
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
      }
    },
    { roles: ['mobile', 'desktop', 'server'], permissions: ['ack'], methods: ['POST'] }
  );
}



