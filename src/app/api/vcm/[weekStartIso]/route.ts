export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { readVcmAssignments, writeVcmAssignments } from '@/lib/vcm-assignments-store';

type RouteContext = {
  params: Promise<{ weekStartIso: string }>
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { weekStartIso } = await context.params;
    
    let data: any = {};
    try {
      data = await readVcmAssignments();
    } catch (e) {
      console.error('Failed to read assignments', e);
    }
    
    return NextResponse.json(data[weekStartIso] || {});
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { weekStartIso } = await context.params;
  console.log("[API][DELETE] Suppression de toutes les données pour la semaine:", weekStartIso);
  try {
    const allAssignments = await readVcmAssignments();
    delete allAssignments[weekStartIso];
    await writeVcmAssignments(allAssignments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
