export const dynamic = "force-static";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { readVcmAssignments, writeVcmAssignments } from '@/lib/vcm-assignments-store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weekStartIso: string }> }
) {
  const { weekStartIso } = await params;

  if (!weekStartIso) {
    return NextResponse.json({ message: 'Paramètre weekStartIso manquant' }, { status: 400 });
  }
  console.log("[API][CLEAR] Effacement des assignations pour la semaine:", weekStartIso);
  try {
    const allAssignments = await readVcmAssignments();
    delete allAssignments[weekStartIso];
    await writeVcmAssignments(allAssignments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
