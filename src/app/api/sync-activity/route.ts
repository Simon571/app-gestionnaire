/**
 * POST /api/sync-activity
 * Reporte l'activite saisie sur la page Personnes vers les rapports de
 * predication, pour que le proclamateur retrouve sur son telephone ce que
 * l'assemblee a enregistre pour lui.
 *
 * La version precedente ecrivait directement dans `data/publisher-preaching.json`
 * avec `fs.writeFile`. Deux consequences : l'ecriture echouait sur un
 * hebergement dont le systeme de fichiers est en lecture seule, et elle passait
 * a cote du cloisonnement — toutes les assemblees partageaient un seul fichier
 * de rapports. Tout passe desormais par `publisher-preaching-store`.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  listPreachingReports,
  upsertPreachingReport,
} from '@/lib/publisher-preaching-store';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

interface MonthActivity {
  month?: string;
  participated?: boolean;
  bibleStudies?: number;
  hours?: number;
  credit?: number;
  isLate?: boolean;
}

export async function POST(request: NextRequest) {
  // Saisir l'activite d'un proclamateur est un acte d'administration : un
  // proclamateur declare ses heures depuis son telephone, pas ici.
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  }
  if (session.role === 'publisher') {
    return NextResponse.json(
      { error: "Saisie reservee aux anciens et assistants de l'assemblee." },
      { status: 403 }
    );
  }
  return runWithTenant(session.tenantId, () => handle(request));
}

async function handle(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body?.userId === 'string' ? body.userId : '';
    const activity: MonthActivity[] = Array.isArray(body?.activity) ? body.activity : [];

    if (!userId || !Array.isArray(body?.activity)) {
      return NextResponse.json({ error: 'userId et activity[] requis' }, { status: 400 });
    }

    const existingReports = await listPreachingReports();
    let synced = 0;
    let preserved = 0;

    for (const monthActivity of activity) {
      const month = monthActivity?.month;
      if (!month) continue;

      // Un rapport envoye par le proclamateur depuis son telephone fait foi :
      // il l'a rempli lui-meme. La saisie manuelle ne l'ecrase pas.
      const existing = existingReports.find((r) => r.userId === userId && r.month === month);
      const fromMobile =
        existing?.meta?.['source'] === 'flutter' || Boolean(existing?.meta?.['deviceId']);
      if (fromMobile) {
        preserved += 1;
        continue;
      }

      const participated = monthActivity.participated ?? false;
      await upsertPreachingReport({
        userId,
        month,
        didPreach: participated,
        submitted: participated,
        // Une saisie faite par l'assemblee est validee d'office.
        status: 'validated',
        isLate: monthActivity.isLate ?? false,
        totals: {
          hours: monthActivity.hours ?? 0,
          bibleStudies: monthActivity.bibleStudies ?? 0,
          credit: monthActivity.credit ?? 0,
        },
        entries: existing?.entries ?? {},
        meta: {
          ...(existing?.meta ?? {}),
          source: 'manual-entry',
          syncedFrom: 'personnes-page',
        },
      });
      synced += 1;
    }

    return NextResponse.json({ ok: true, syncedMonths: synced, preservedMonths: preserved });
  } catch (error) {
    console.error('sync-activity: synchronisation impossible', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
