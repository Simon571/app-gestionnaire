import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { PUBLISHER_SYNC_STATUSES } from '@/types/publisher-sync';

const bodySchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(PUBLISHER_SYNC_STATUSES).default('processed'),
  deviceId: z.string().optional(),
  errorMessage: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
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
