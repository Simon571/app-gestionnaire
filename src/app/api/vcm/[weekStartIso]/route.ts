
import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';

const ASSIGNMENTS_FILE_PATH = path.join(process.cwd(), 'data', 'vcm-assignments.json');

async function readAssignments(): Promise<{ [weekId: string]: any }> {
    try {
        const file = await fs.readFile(ASSIGNMENTS_FILE_PATH, 'utf8');
        return JSON.parse(file);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return {};
        throw error;
    }
}

async function writeAssignments(data: any) {
    await fs.writeFile(ASSIGNMENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function DELETE(_: Request, { params }: { params: { weekStartIso: string } }) {
  console.log("[API][DELETE] Suppression de toutes les données pour la semaine:", params.weekStartIso);
  try {
    const allAssignments = await readAssignments();
    delete allAssignments[params.weekStartIso];
    await writeAssignments(allAssignments);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
