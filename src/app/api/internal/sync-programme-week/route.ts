import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';

const FLUTTER_DATA_PATH = path.join(process.cwd(), 'flutter_app', 'assets', 'data', 'programme_week.json');

/**
 * Internal API route for sending VCM programme data to Flutter.
 * This route bypasses the external API authentication for internal calls.
 */
export async function POST(request: NextRequest) {
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
