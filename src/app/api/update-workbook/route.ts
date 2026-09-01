/**
 * /api/update-workbook  (ancienne route de depot du cahier)
 *
 * Conservee pour les scripts qui la visaient deja, mais elle n'ecrit plus dans
 * `export/vcm-program.json` : elle delegue au meme magasin que
 * `/api/vcm/program`. Deux raisons :
 *   - une ecriture directe sur le disque echoue sur un hebergement dont le
 *     systeme de fichiers est en lecture seule ;
 *   - deux emplacements de verite pour un meme cahier finissent toujours par
 *     divergent.
 *
 * SECURITE : la version precedente acceptait un POST **sans aucune cle**
 * (« si aucune cle n'est fournie, on suppose que c'est une requete legitime du
 * client »). N'importe qui pouvait donc remplacer le programme de tout le parc.
 * Le depot exige desormais une identite : super admin, jeton de service, ou
 * `AUTOMATION_API_KEY` pour la tache planifiee historique.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import {
  computeCoverage,
  readStoredVcmProgram,
  writeStoredVcmProgram,
  type VcmProgramFile,
} from '@/lib/vcm-program-store';
import { readSession } from '@/lib/api-auth';
import { matchServiceToken } from '@/lib/api-auth-policy';

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/** Cle d'automatisation historique, comparee seulement si elle est configuree. */
function matchAutomationKey(request: NextRequest): boolean {
  const expected = (process.env.AUTOMATION_API_KEY || '').trim();
  if (expected.length < 16) return false;
  const provided = (request.headers.get('x-api-key') || '').trim();
  return provided.length > 0 && provided === expected;
}

export async function POST(request: NextRequest) {
  const session = await readSession(request);
  const authorized =
    session?.role === 'super-admin' ||
    matchServiceToken(request.headers) ||
    matchAutomationKey(request);

  if (!authorized) {
    return NextResponse.json(
      {
        message: 'Depot refuse.',
        hint: 'Fournir x-api-token (jeton de service) ou x-api-key (AUTOMATION_API_KEY).',
      },
      { status: 403, headers: noStore }
    );
  }

  const body = await request.json().catch(() => null);
  const weeks = (body as { weeks?: unknown } | null)?.weeks;
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return NextResponse.json(
      {
        message: 'Programme invalide : au moins une semaine est requise.',
        hint: 'Preferer POST /api/vcm/program, qui valide la structure complete.',
      },
      { status: 400, headers: noStore }
    );
  }

  try {
    const stored = await writeStoredVcmProgram(body as VcmProgramFile);
    return NextResponse.json(
      { message: 'Programme mis a jour.', coverage: computeCoverage(stored) },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 400, headers: noStore }
    );
  }
}

export async function GET() {
  const stored = await readStoredVcmProgram();
  return NextResponse.json(
    { weeks: stored?.weeks ?? [], coverage: computeCoverage(stored) },
    { headers: noStore }
  );
}
