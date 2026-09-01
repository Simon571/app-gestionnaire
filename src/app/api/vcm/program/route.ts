/**
 * /api/vcm/program
 *
 * GET  : programme Vie chretienne et ministere courant, accompagne de son etat
 *        de fraicheur. Sert le magasin s'il est alimente, sinon le fichier
 *        statique livre avec l'application.
 * POST : depot d'un programme frais. C'est ce qui rend la mise a jour continue :
 *        l'extraction tourne ailleurs (action planifiee ou poste de travail) et
 *        depose ici son resultat, sans redeploiement.
 *
 * Le programme est commun a toutes les assemblees ; seules les attributions de
 * personnes sont cloisonnees.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  computeCoverage,
  readStoredVcmProgram,
  writeStoredVcmProgram,
  type VcmProgramFile,
} from '@/lib/vcm-program-store';
import { readSession } from '@/lib/api-auth';
import { matchServiceToken } from '@/lib/api-auth-policy';

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

const itemSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    theme: z.string().optional(),
    duration: z.number().optional(),
  })
  .passthrough();

const weekSchema = z
  .object({
    weekTitle: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    sourceUrl: z.string().optional(),
    sections: z
      .array(
        z
          .object({
            key: z.string(),
            title: z.string().optional(),
            items: z.array(itemSchema).default([]),
          })
          .passthrough()
      )
      .default([]),
  })
  .passthrough();

const programSchema = z.object({
  weeks: z.array(weekSchema).min(1, 'Au moins une semaine est requise.'),
  lang: z.string().optional(),
  scrapedAt: z.string().optional(),
  source: z.string().optional(),
});

/** Repli sur le fichier livre dans `public/vcm/`, utilise avant tout depot. */
async function readBundledProgram(lang: string): Promise<VcmProgramFile | null> {
  const candidates = [
    path.join(process.cwd(), 'public', 'vcm', lang, 'vcm-program.normalized.json'),
    path.join(process.cwd(), 'public', 'vcm', 'vcm-program.normalized.json'),
  ];
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      const parsed = JSON.parse(raw) as VcmProgramFile;
      if (Array.isArray(parsed?.weeks) && parsed.weeks.length) {
        return { ...parsed, source: 'bundled' };
      }
    } catch {
      // Fichier absent : on essaie le candidat suivant.
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const lang = (request.nextUrl.searchParams.get('lang') || 'fr').toLowerCase();

  const stored = await readStoredVcmProgram();
  const program = stored ?? (await readBundledProgram(lang));

  if (!program) {
    return NextResponse.json(
      {
        error: 'Aucun programme disponible',
        hint: 'Executer npm run vcm:update:fr puis npm run vcm:publish.',
        coverage: computeCoverage(null),
      },
      { status: 404, headers: noStore }
    );
  }

  return NextResponse.json(
    {
      weeks: program.weeks,
      lang: program.lang ?? lang,
      origin: stored ? 'store' : 'bundled',
      coverage: computeCoverage(program),
    },
    { headers: noStore }
  );
}

export async function POST(request: NextRequest) {
  // Deux identites acceptees : le super admin depuis la console, et le jeton de
  // service utilise par la tache planifiee. Une session d'assemblee ne peut pas
  // deposer un programme : il est commun a tout le parc.
  const session = await readSession(request);
  const authorized = session?.role === 'super-admin' || matchServiceToken(request.headers);
  if (!authorized) {
    return NextResponse.json(
      { error: 'Depot reserve au super admin ou au jeton de service.' },
      { status: 403, headers: noStore }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = programSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Programme invalide', issues: parsed.error.issues },
      { status: 400, headers: noStore }
    );
  }

  try {
    const stored = await writeStoredVcmProgram(parsed.data as VcmProgramFile);
    return NextResponse.json(
      { ok: true, coverage: computeCoverage(stored) },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400, headers: noStore }
    );
  }
}
