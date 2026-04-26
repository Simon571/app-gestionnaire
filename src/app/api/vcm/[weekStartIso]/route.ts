export const dynamic = "force-static";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { readVcmAssignments, writeVcmAssignments } from '@/lib/vcm-assignments-store';

type RouteContext = {
  params: Promise<{ weekStartIso: string }>
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { weekStartIso } = await context.params;
  console.log("[API][DELETE] Suppression de toutes les données pour la semaine:", weekStartIso);
  try {
    const allAssignments = await readAssignments();
    delete allAssignments[weekStartIso];
    await writeAssignments(allAssignments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
