import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Endpoint pour synchroniser person.activity[] vers publisher-preaching.json
 * Appelé quand on modifie l'activité d'un proclamateur depuis la page Personnes
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, activity } = body;

    if (!userId || !Array.isArray(activity)) {
      return NextResponse.json({ error: 'userId et activity[] requis' }, { status: 400 });
    }

    const preachingPath = path.join(process.cwd(), 'data', 'publisher-preaching.json');

    // Lire le fichier actuel
    let data: any = { reports: [] };
    try {
      const raw = await fs.readFile(preachingPath, 'utf8');
      data = JSON.parse(raw);
      if (!data.reports) data.reports = [];
    } catch {
      // Fichier n'existe pas encore
    }

    // Synchroniser chaque mois d'activité
    for (const monthActivity of activity) {
      const { month, participated, bibleStudies, hours, credit, isLate, remarks } = monthActivity;

      if (!month) continue;

      // Chercher un rapport existant
      const existingIndex = data.reports.findIndex(
        (r: any) => r.userId === userId && r.month === month
      );

      // Créer le rapport
      const report = {
        userId,
        month,
        didPreach: participated ?? false,
        submitted: participated ?? false,
        status: 'validated', // Les rapports saisis manuellement sont considérés comme validés
        isLate: isLate ?? false,
        totals: {
          hours: hours ?? 0,
          bibleStudies: bibleStudies ?? 0,
          credit: credit ?? 0,
        },
        entries: {},
        meta: {
          source: 'manual-entry',
          syncedFrom: 'personnes-page',
        },
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Mettre à jour le rapport existant (ne pas écraser les données Flutter si elles existent)
        const existing = data.reports[existingIndex];
        
        // Si le rapport vient de Flutter (pas de meta.source = manual-entry), ne pas écraser
        if (existing.meta?.source === 'flutter' || existing.meta?.deviceId) {
          // Ne rien faire, les données Flutter ont priorité
          continue;
        }
        
        data.reports[existingIndex] = report;
      } else {
        // Ajouter un nouveau rapport
        data.reports.push(report);
      }
    }

    // Sauvegarder le fichier
    await fs.mkdir(path.dirname(preachingPath), { recursive: true });
    await fs.writeFile(preachingPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✅ Activité synchronisée vers publisher-preaching.json pour ${userId} (${activity.length} mois)`);

    return NextResponse.json({ ok: true, syncedMonths: activity.length });
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation d\'activité:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
