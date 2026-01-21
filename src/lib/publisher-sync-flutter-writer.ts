import { promises as fs } from 'fs';
import path from 'path';
import type { PublisherSyncJob } from '@/types/publisher-sync';

const FLUTTER_ASSETS_DIR = path.join(process.cwd(), 'flutter_app', 'assets', 'data');
// Allow tests / CI to override the output folder (useful for unit tests)
function flutterPathForType(type: string, jobPayload: any) {
  const baseDir = process.env.PUBLISHER_FLUTTER_ASSETS_DIR ?? FLUTTER_ASSETS_DIR;
  // Default mapping from job type -> file name
  switch (type) {
    case 'programme_week':
      return path.join(baseDir, 'programme_week.json');
    case 'programme_weekend':
      return path.join(baseDir, 'programme_weekend.json');
    case 'temoignage_public':
      return path.join(baseDir, 'temoignage_public.json');
    case 'services':
      return path.join(baseDir, 'services.json');
    case 'communications':
      return path.join(baseDir, 'communications.json');
    case 'predication':
      return path.join(baseDir, 'predication.json');
    case 'rapports':
      return path.join(baseDir, 'rapports.json');
    case 'assistance':
      return path.join(baseDir, 'assistance.json');
    case 'taches':
      return path.join(baseDir, 'taches.json');
    case 'emergency_contacts':
      return path.join(baseDir, 'emergency_contacts.json');
    case 'territories':
      return path.join(baseDir, 'territories.json');
    default:
      return path.join(baseDir, `${type}.json`);
  }
}

/**
 * Write a publisher sync job payload into Flutter assets so the mobile app can
 * load it directly (useful for local/dev sync and to ensure a stable on-device
 * representation of the data that will be displayed).
 *
 * This function is intentionally defensive — failures here should not block
 * the main send/queue path.
 */
export async function writeJobToFlutterAssets(job: PublisherSyncJob): Promise<void> {
  try {
    const outPath = flutterPathForType(job.type, job.payload);
    const outDir = path.dirname(outPath);

    await fs.mkdir(outDir, { recursive: true });

    // Special merging behaviour for programme_week: keep the file as { weeks: [...] }
    if (job.type === 'programme_week') {
      let existing: { weeks: any[] } = { weeks: [] };
      try {
        // check existence before reading (debug)
        // existence check omitted in production
        const content = await fs.readFile(outPath, 'utf-8');
        existing = JSON.parse(content) as { weeks: any[] };
        if (!existing || !Array.isArray(existing.weeks)) existing = { weeks: [] };
      } catch (err) {
        // no-op — file not present or invalid, we'll recreate
      }

      // job.payload may represent one week or an object containing weeks
      // Normalize to an array of week items
      const payload = job.payload as Record<string, unknown> | null;
      const incomingWeeks = Array.isArray(payload?.weeks)
        ? payload.weeks
        : [payload].filter(Boolean);

      // Replace or append by weekStart to keep unique weeks
      // Merge existing weeks with incoming weeks
      for (const w of incomingWeeks) {
        if (!w || !w.weekStart) continue;
        const idx = existing.weeks.findIndex((ew) => ew.weekStart === w.weekStart);
        if (idx >= 0) existing.weeks[idx] = w;
        else existing.weeks.push(w);
      }

      // Sort weeks ascending
      existing.weeks.sort((a: any, b: any) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

      await fs.writeFile(outPath, JSON.stringify(existing, null, 2), 'utf-8');
      return;
    }

    // For communications the expected format in Flutter is { updatedAt, items }
    if (job.type === 'communications') {
      const commPayload = job.payload as Record<string, unknown> | null;
      const comms = commPayload?.communications ?? commPayload?.items ?? [];
      const obj = { updatedAt: new Date().toISOString(), items: comms };
      await fs.writeFile(outPath, JSON.stringify(obj, null, 2), 'utf-8');
      return;
    }

    // For programme_weekend behave similarly to programme_week if payload contains weeks
    if (job.type === 'programme_weekend') {
      const weekendPayload = job.payload as Record<string, unknown> | null;
      if (Array.isArray(weekendPayload?.weeks)) {
        const obj = { weeks: weekendPayload.weeks };
        await fs.writeFile(outPath, JSON.stringify(obj, null, 2), 'utf-8');
        return;
      }
    }

    // Default behaviour: write the job.payload as-is to the file so Flutter's
    // SyncService can consume it directly (it expects the payload structure
    // matching the job type in most cases).
    await fs.writeFile(outPath, JSON.stringify(job.payload ?? {}, null, 2), 'utf-8');
  } catch (err) {
    // Do not break the main flow — log and return
    // eslint-disable-next-line no-console
    console.error('writeJobToFlutterAssets failed', err);
  }
}

export default writeJobToFlutterAssets;
