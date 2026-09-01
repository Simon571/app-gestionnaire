import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

const FLUTTER_DATA_PATH = path.join(process.cwd(), 'flutter_app', 'assets', 'data', 'programme_week.json');

// Rendu dynamique obligatoire : le job cree appartient a une assemblee, et son
// identifiant ne se lit que via `headers()`.
export const dynamic = 'force-dynamic';

/**
 * Envoi d'une semaine de programme vers l'application mobile.
 *
 * « Internal » ne designe que l'appelant attendu — le tableau de bord — et non
 * un reseau de confiance : la route est exposee comme les autres. Le commentaire
 * precedent annoncait qu'elle « contourne l'authentification pour les appels
 * internes » ; elle exige desormais une session d'administration, faute de quoi
 * n'importe qui pouvait pousser un programme aux telephones de l'assemblee.
 */
export async function POST(request: NextRequest) {
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  }
  if (session.role === 'publisher') {
    return NextResponse.json(
      { error: "Envoi du programme reserve aux anciens et assistants de l'assemblee." },
      { status: 403 }
    );
  }
  return runWithTenant(session.tenantId, () => handle(request));
}

async function handle(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      weekStart, 
      weekEnd, 
      weekLabel, 
      meetingType, 
      assignments, 
      songs, 
      participants,
      hall 
    } = body;

    if (!weekStart || !assignments) {
      return NextResponse.json(
        { error: 'Données de programme manquantes' },
        { status: 400 }
      );
    }

    const payload = {
      weekStart,
      weekEnd,
      weekLabel,
      meetingType: meetingType || 'vie_chretienne_ministere',
      assignments: assignments || {},
      songs: songs || {},
      participants: participants || [],
      hall: hall || 'main',
      updatedAt: new Date().toISOString(),
    };

    // Create sync job for mobile sync
    const job = await PublisherSyncStore.addJob({
      type: 'programme_week',
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
      
      // Read existing data to merge weeks
      let existingData: { weeks: any[] } = { weeks: [] };
      try {
        const existing = await fs.readFile(FLUTTER_DATA_PATH, 'utf-8');
        existingData = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }
      
      // Update or add the week
      const weekIndex = existingData.weeks.findIndex(
        (w: any) => w.weekStart === weekStart
      );
      if (weekIndex >= 0) {
        existingData.weeks[weekIndex] = payload;
      } else {
        existingData.weeks.push(payload);
      }
      
      // Sort weeks by date
      existingData.weeks.sort((a: any, b: any) => 
        new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
      );
      
      await fs.writeFile(FLUTTER_DATA_PATH, JSON.stringify(existingData, null, 2), 'utf-8');
      console.log('Wrote programme_week.json to Flutter assets');
    } catch (fileError) {
      console.error('Failed to write Flutter asset file:', fileError);
      // Don't fail the request if file write fails
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error('internal/sync-programme-week error', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du job de synchronisation' },
      { status: 500 }
    );
  }
}
