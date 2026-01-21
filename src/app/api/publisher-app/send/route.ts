import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { writeJobToFlutterAssets } from '@/lib/publisher-sync-flutter-writer';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { handlePublisherSend } from '@/lib/publisher-send-handler';
import { PUBLISHER_SYNC_TYPES, PUBLISHER_SYNC_DIRECTIONS } from '@/types/publisher-sync';

const bodySchema = z.object({
  type: z.enum(PUBLISHER_SYNC_TYPES),
  payload: z.unknown().default({}),
  direction: z.enum(PUBLISHER_SYNC_DIRECTIONS).default('desktop_to_mobile'),
  initiator: z.string().optional(),
  deviceTarget: z.string().optional().nullable(),
  notify: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
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
