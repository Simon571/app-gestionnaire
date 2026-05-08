export const dynamic = "force-static";
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addTache, deleteTache, readTaches, writeTaches, type Tache } from '@/lib/taches-store';

const tacheSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assignedToPersonIds: z.array(z.string()).default([]),
  assignedByPersonId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  assignedTo: z.union([z.string(), z.array(z.string())]).optional(),
});

export async function GET() {
  try {
    const taches = await readTaches();
    return NextResponse.json({ taches });
  } catch (error) {
    console.error('Error reading taches:', error);
    return NextResponse.json({ error: 'Failed to read taches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Bulk replace
    if (Array.isArray(body.taches)) {
      const parsed = z.array(tacheSchema).safeParse(body.taches);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid taches payload' }, { status: 400 });
      }

      await writeTaches(parsed.data as Tache[]);
      return NextResponse.json({ ok: true, count: parsed.data.length });
    }

    // Single add
    const parsedSingle = tacheSchema.safeParse(body);
    if (parsedSingle.success) {
      await addTache(parsedSingle.data as Tache);
      return NextResponse.json({ ok: true, tache: parsedSingle.data }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error saving taches:', error);
    return NextResponse.json({ error: 'Failed to save taches' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tache ID is required' }, { status: 400 });
    }

    await deleteTache(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting tache:', error);
    return NextResponse.json({ error: 'Failed to delete tache' }, { status: 500 });
  }
}
