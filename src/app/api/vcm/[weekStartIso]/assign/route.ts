import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'vcm-assignments.json');

async function readAssignments(): Promise<{ [weekId: string]: any }> {
    try {
        await fs.mkdir(path.dirname(ASSIGNMENTS_FILE_PATH), { recursive: true });
        const file = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf8');
        return JSON.parse(file);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return {};
        throw error;
    }
}

async function writeAssignments(data: any) {
    await fs.mkdir(path.dirname(ASSIGNMENTS_FILE_PATH), { recursive: true });
    await fs.writeFile(ASSIGNMENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request: NextRequest, { params }: { params: { weekStartIso: string } }) {
    try {
        const allAssignments = await readAssignments();
        const weekAssignments = allAssignments[params.weekStartIso] || {};
        return NextResponse.json(weekAssignments);
    } catch (e) {
        return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { weekStartIso: string } }) {
  const body = await req.json().catch(() => ({}));
  console.log("[API][ASSIGN]", { week: params.weekStartIso, payload: body });
  
  try {
    const allAssignments = await readAssignments();
    if (!allAssignments[params.weekStartIso]) {
        allAssignments[params.weekStartIso] = {};
    }
    allAssignments[params.weekStartIso][body.itemId] = {
        ...(allAssignments[params.weekStartIso][body.itemId] || {}),
        personId: body.personId,
        role: body.role,
        override: body.override
    };

    await writeAssignments(allAssignments);
    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur lors de la sauvegarde', error: (e as Error).message }, { status: 500 });
  }
}