export const dynamic = "force-static";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
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
    const allAssignments = await readAssignments();
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

    await writeAssignments(allAssignments);
    return NextResponse.json({ ok: true });

  } catch (e) {
    return NextResponse.json({ message: 'Erreur serveur', error: (e as Error).message }, { status: 500 });
  }
}
