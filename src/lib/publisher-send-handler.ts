import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from './publisher-sync-store';
import { writeJobToFlutterAssets } from './publisher-sync-flutter-writer';
import { PublisherSyncSecurityContext } from './publisher-sync-auth';

const bodySchema = z.object({
  type: z.string(),
  payload: z.unknown().default({}),
  direction: z.string().default('desktop_to_mobile'),
  initiator: z.string().optional(),
  deviceTarget: z.string().optional().nullable(),
  notify: z.boolean().optional(),
});

export async function handlePublisherSend(ctx: PublisherSyncSecurityContext): Promise<NextResponse> {
  try {
    const json = await ctx.request.json();
    const body = bodySchema.parse(json);

    const job = await PublisherSyncStore.addJob({
      type: body.type as any,
      direction: body.direction as any,
      payload: body.payload,
      initiator: body.initiator ?? ctx.device.label,
      deviceTarget: body.deviceTarget ?? null,
      notify: body.notify ?? false,
    });

    const writeAssetsEnabled = process.env.PUBLISHER_WRITE_FLUTTER_ASSETS !== '0';
    if (body.direction === 'desktop_to_mobile' && writeAssetsEnabled) {
      writeJobToFlutterAssets(job as any).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('failed to write flutter asset for job', job?.type, e);
      });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('publisher-send handler error', error);
    return NextResponse.json({ error: 'Impossible de créer le job de synchronisation.' }, { status: 400 });
  }
}

export default handlePublisherSend;
