// force-dynamic: nécessaire pour que Vercel serverless lise le body du POST.
// Pour le build Tauri (output: 'export'), build-tauri.ps1 patche temporairement en 'force-static'.
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';

/**
 * POST /api/publisher-app/users/web-sync
 * Endpoint interne utilisé par le web pour synchroniser la liste des personnes
 * vers publisher-users.json (lu par Flutter via /api/publisher-app/users/export).
 *
 * Chaque utilisateur est tagué avec son assemblyId pour isoler les données
 * de chaque assemblée. Ainsi plusieurs assemblées partagent le même fichier
 * sans jamais voir les données des autres.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assemblyId: string = typeof body.assemblyId === 'string' ? body.assemblyId.trim() : '';
    const incoming: Record<string, unknown>[] = Array.isArray(body.users)
      ? body.users
      : Array.isArray(body.people)
      ? body.people
      : [];

    if (incoming.length === 0) {
      return NextResponse.json({ ok: false, message: 'Aucun utilisateur reçu' }, { status: 400 });
    }
    if (!assemblyId) {
      return NextResponse.json({ ok: false, message: 'assemblyId manquant' }, { status: 400 });
    }

    // Lire tous les utilisateurs existants (toutes assemblées confondues)
    const existing = await readPublisherUsers();

    // Conserver les utilisateurs des AUTRES assemblées intacts
    const otherAssemblies = existing.filter(
      (u) => typeof u['_assemblyId'] === 'string' && u['_assemblyId'] !== assemblyId
    );

    // Construire un map des utilisateurs existants de CETTE assemblée
    const ownExisting = existing.filter(
      (u) => !u['_assemblyId'] || u['_assemblyId'] === assemblyId
    );
    const existingMap = new Map<string, Record<string, unknown>>();
    for (const u of ownExisting) {
      if (typeof u['id'] === 'string') {
        existingMap.set(u['id'] as string, u);
      }
    }

    // Merger : données entrantes ont la priorité, on tague avec _assemblyId
    const ownMerged: Record<string, unknown>[] = incoming.map((incomingUser) => {
      const id = incomingUser['id'] as string;
      const existingUser = existingMap.get(id) ?? {};
      return { ...existingUser, ...incomingUser, _assemblyId: assemblyId };
    });

    // Écrire : autres assemblées + cette assemblée mise à jour
    await writePublisherUsers([...otherAssemblies, ...ownMerged]);

    return NextResponse.json({ ok: true, count: ownMerged.length, assemblyId });
  } catch (error) {
    console.error('web-sync POST error', error);
    const msg = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    return NextResponse.json({ error: 'Erreur interne', detail: msg }, { status: 500 });
  }
}

