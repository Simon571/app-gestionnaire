import { NextResponse } from 'next/server';
import { writePublisherUsers } from '@/lib/publisher-users-store';

/**
 * Route pour exporter les personnes vers publisher-users.json pour Flutter
 * POST /api/export-people-to-publisher
 * Body: { people: Person[], assemblyId: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const people = body.people || [];
    const assemblyId = body.assemblyId || 'KINYOL-WGHK';

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
