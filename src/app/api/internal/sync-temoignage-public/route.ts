import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

const FLUTTER_DATA_PATH = path.join(process.cwd(), 'flutter_app', 'assets', 'data', 'temoignage_public.json');

/**
 * Envoi des creneaux de temoignage public vers l'application mobile.
 *
 * Comme `sync-programme-week`, « internal » ne designe que l'appelant attendu :
 * la route est exposee, et exige donc une session d'administration.
 */
export async function POST(request: NextRequest) {
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  }
  if (session.role === 'publisher') {
    return NextResponse.json(
      { error: "Envoi reserve aux anciens et assistants de l'assemblee." },
      { status: 403 }
    );
  }
  return runWithTenant(session.tenantId, () => handle(request));
}

async function handle(request: NextRequest) {
  try {
    const body = await request.json();
    const { slots, locations, weekStart } = body;

    if (!slots && !locations) {
      return NextResponse.json(
        { error: 'Aucune donnée à envoyer' },
        { status: 400 }
      );
    }

    const payload = {
      slots: slots || [],
      locations: locations || [],
      weekStart: weekStart || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create sync job for mobile sync
    const job = await PublisherSyncStore.addJob({
      type: 'temoignage_public',
      direction: 'desktop_to_mobile',
      payload,
      initiator: 'desktop',
      deviceTarget: null,
      notify: true,
    });

    // Also write directly to Flutter assets for local development
    try {
      const dir = path.dirname(FLUTTER_DATA_PATH);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(FLUTTER_DATA_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      console.log('Wrote temoignage_public.json to Flutter assets');
    } catch (fileError) {
      console.error('Failed to write Flutter asset file:', fileError);
      // Don't fail the request if file write fails
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error('internal/sync-temoignage-public error', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du job de synchronisation' },
      { status: 500 }
    );
  }
}
