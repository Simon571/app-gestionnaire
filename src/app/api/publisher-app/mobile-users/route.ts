import { NextRequest, NextResponse } from 'next/server';
import {
  readPublisherUsers,
  writePublisherUsers,
} from '@/lib/publisher-users-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function usersForAssembly(
  users: Record<string, unknown>[],
  assemblyId: string
) {
  if (!assemblyId) return users;

  return users.filter((user) => {
    const tag = user['_assemblyId'];
    return !tag || tag === assemblyId || tag === 'DEFAULT';
  });
}

/** Returns the current user list to the newly built mobile application. */
export async function GET(request: NextRequest) {
  try {
    const assemblyId = request.nextUrl.searchParams.get('assemblyId')?.trim() ?? '';
    const users = usersForAssembly(await readPublisherUsers(), assemblyId);

    return NextResponse.json(
      { users },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('mobile-users GET error', error);
    return NextResponse.json(
      { error: 'Impossible de lire les utilisateurs.' },
      { status: 500 }
    );
  }
}

/** Receives the browser user list while preserving data from other assemblies. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assemblyId = typeof body.assemblyId === 'string'
      ? body.assemblyId.trim()
      : '';
    const incoming: Record<string, unknown>[] = Array.isArray(body.users)
      ? body.users
      : [];

    if (!assemblyId || incoming.length === 0) {
      return NextResponse.json(
        { error: 'assemblyId et utilisateurs requis.' },
        { status: 400 }
      );
    }

    const existing = await readPublisherUsers();
    const otherAssemblies = existing.filter(
      (user) =>
        typeof user['_assemblyId'] === 'string' &&
        user['_assemblyId'] !== assemblyId
    );
    const ownExisting = existing.filter(
      (user) => !user['_assemblyId'] || user['_assemblyId'] === assemblyId
    );
    const existingById = new Map(
      ownExisting
        .filter((user) => typeof user['id'] === 'string')
        .map((user) => [user['id'] as string, user])
    );
    const merged = incoming.map((user) => ({
      ...(typeof user['id'] === 'string' ? existingById.get(user['id']) : {}),
      ...user,
      _assemblyId: assemblyId,
    }));

    await writePublisherUsers([...otherAssemblies, ...merged]);

    return NextResponse.json({ ok: true, count: merged.length, assemblyId });
  } catch (error) {
    console.error('mobile-users POST error', error);
    return NextResponse.json(
      { error: 'Impossible de synchroniser les utilisateurs.' },
      { status: 500 }
    );
  }
}
