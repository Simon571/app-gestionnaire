export const dynamic = "force-static";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { resolve } from 'path';

const PROGRAM_PATH = resolve(
  process.cwd(),
  'public',
  'vcm',
  'fr',
  'vcm-program.normalized.json',
);

async function readProgramFile() {
  const raw = await fs.readFile(PROGRAM_PATH, 'utf-8');
  return JSON.parse(raw);
}

export const GET = async () => {
  try {
    const data = await readProgramFile();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[API /api/vcm/weeks] Erreur:', e?.message ?? e);
    return new NextResponse('Erreur chargement programme VCM', { status: 500 });
  }
};
