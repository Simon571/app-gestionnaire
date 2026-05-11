import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { writeJobToFlutterAssets } from '@/lib/publisher-sync-flutter-writer';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { handlePublisherSend } from '@/lib/publisher-send-handler';
import { PUBLISHER_SYNC_TYPES, PUBLISHER_SYNC_DIRECTIONS } from '@/types/publisher-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

const bodySchema = z.object({
  type: z.enum(PUBLISHER_SYNC_TYPES),
  payload: z.unknown().default({}),
  direction: z.enum(PUBLISHER_SYNC_DIRECTIONS).default('desktop_to_mobile'),
  initiator: z.string().optional(),
  deviceTarget: z.string().optional().nullable(),
  notify: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  const deviceId = request.headers.get('x-device-id');

  if (!deviceId) {
    // Accès local depuis le web dashboard - créer le job directement
    try {
      const json = await request.json();
      const body = bodySchema.parse(json);

      const job = await PublisherSyncStore.addJob({
        type: body.type,
        direction: body.direction,
        payload: body.payload,
        initiator: body.initiator ?? 'desktop',
        deviceTarget: body.deviceTarget ?? null,
        notify: body.notify ?? false,
      });

      // Écrire dans les assets Flutter si applicable
      const writeAssetsEnabled = process.env.PUBLISHER_WRITE_FLUTTER_ASSETS !== '0';
      if (body.direction === 'desktop_to_mobile' && writeAssetsEnabled) {
        writeJobToFlutterAssets(job as any).catch((e) => {
          console.error('failed to write flutter asset for job', job?.type, e);
        });
      }

      return NextResponse.json({ job }, { status: 201 });
    } catch (error) {
      console.error('publisher-app/send local error', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { error: 'Impossible de créer le job de synchronisation.', detail: errMsg },
        { status: 400 }
      );
    }
  }

  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest, device }) => {
      try {
        // Delegate the core logic to a testable handler so tests can call the
        // same logic directly without exercising the full auth wrapper.
        return handlePublisherSend({ request: authRequest, device });
      } catch (error) {
        console.error('publisher-app/send error', error);
        return NextResponse.json(
          { error: 'Impossible de créer le job de synchronisation.' },
          { status: 400 }
        );
      }
    },
    { roles: ['desktop', 'server'], permissions: ['send'], methods: ['POST'] }
  );
}


