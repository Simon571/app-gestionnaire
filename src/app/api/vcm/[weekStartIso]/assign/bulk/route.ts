export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { readVcmAssignments, writeVcmAssignments } from '@/lib/vcm-assignments-store';

export async function POST(req: NextRequest) {
  const { items } = await req.json().catch(() => ({ items: [] }));
  const pathname = req.nextUrl?.pathname ?? new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const vcmIndex = segments.indexOf('vcm');
  const weekStartIso = vcmIndex >= 0 && segments.length > vcmIndex + 1
    ? decodeURIComponent(segments[vcmIndex + 1])
    : '';

  if (!weekStartIso) {
    return NextResponse.json({ message: 'Paramètre weekStartIso manquant' }, { status: 400 });
  }
  console.log("[API][BULK] Assignation en masse pour la semaine:", weekStartIso, `${items?.length || 0} items`);

  try {
    const allAssignments = await readVcmAssignments();
    if (!allAssignments[weekStartIso]) {
        allAssignments[weekStartIso] = {};
    }

    for (const item of items) {
        if (item.itemId) {
            allAssignments[weekStartIso][item.itemId] = {
                personId: item.personId,
                role: item.role
            };
        }
    }

    await writeVcmAssignments(allAssignments);
    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
