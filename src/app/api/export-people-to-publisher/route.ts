import { NextRequest, NextResponse } from 'next/server';
import { writePublisherUsers } from '@/lib/publisher-users-store';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

// Rendu dynamique obligatoire : l'export **remplace** l'annuaire mobile de
// l'assemblee. Sans `headers()`, l'identifiant d'assemblee est perdu et l'export
// d'une assemblee ecraserait l'annuaire d'une autre.
export const dynamic = 'force-dynamic';

/**
 * Route pour exporter les personnes vers publisher-users.json pour Flutter
 * POST /api/export-people-to-publisher
 * Body: { people: Person[], assemblyId: string }
 *
 * L'ecriture etant un remplacement complet, elle exige une session
 * d'administration : elle n'etait auparavant protegee par rien.
 */
export async function POST(request: NextRequest) {
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
  }
  if (session.role === 'publisher') {
    return NextResponse.json(
      { error: "Export reserve aux anciens et assistants de l'assemblee." },
      { status: 403 }
    );
  }
  return runWithTenant(session.tenantId, () => handle(request, session.tenantId));
}

async function handle(request: NextRequest, tenantId?: string) {
  try {
    const body = await request.json();
    const people = body.people || [];
    // L'assemblee de la session prime sur celle du corps : un client ne choisit
    // pas l'annuaire qu'il remplace.
    const assemblyId = tenantId || body.assemblyId || 'KINYOL-WGHK';

    if (!Array.isArray(people) || people.length === 0) {
      return NextResponse.json(
        { error: 'Aucune personne trouvée', count: 0 },
        { status: 400 }
      );
    }

    // Convertir les personnes au format publisher-users
    const publisherUsers = people.map((person: any) => ({
      id: person.id || '',
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      displayName: person.displayName || `${person.firstName} ${person.lastName}`.trim(),
      email: person.email1 || person.email2 || '',
      pin: person.pin || '',
      activity: Array.isArray(person.activity) ? person.activity : [],
      preachingGroup: person.spiritual?.group || null,
      _assemblyId: assemblyId,
    }));

    // Sauvegarder dans publisher-users.json
    await writePublisherUsers(publisherUsers);

    console.log(`✅ Export réussi: ${publisherUsers.length} utilisateurs sauvegardés dans publisher-users.json`);

    return NextResponse.json({
      ok: true,
      message: `Export réussi: ${publisherUsers.length} utilisateurs`,
      count: publisherUsers.length,
      assemblyId: assemblyId,
    });
  } catch (error) {
    console.error('Erreur lors de l\'export vers publisher-users.json:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'export',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
