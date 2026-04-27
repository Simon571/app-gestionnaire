export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { readVcmAssignments, writeVcmAssignments } from '@/lib/vcm-assignments-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ weekStartIso: string }> }
) {
    try {
        const { weekStartIso } = await params;
        const allAssignments = await readVcmAssignments();
        const weekAssignments = allAssignments[weekStartIso] || {};
        return NextResponse.json(weekAssignments);
    } catch (e) {
        return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ weekStartIso: string }> }
) {
  const body = await req.json().catch(() => ({}));
  const { weekStartIso } = await params;
  console.log("[API][ASSIGN]", { week: weekStartIso, payload: body });
  
  try {
    const allAssignments = await readVcmAssignments();
    if (!allAssignments[weekStartIso]) {
        allAssignments[weekStartIso] = {};
    }
    allAssignments[weekStartIso][body.itemId] = {
        ...(allAssignments[weekStartIso][body.itemId] || {}),
        personId: body.personId,
        role: body.role,
        override: body.override
    };

    await writeVcmAssignments(allAssignments);
    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur lors de la sauvegarde', error: (e as Error).message }, { status: 500 });
  }
}