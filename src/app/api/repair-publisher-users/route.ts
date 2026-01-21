import { NextResponse } from 'next/server';
import { writePublisherUsers } from '@/lib/publisher-users-store';

/**
 * Endpoint pour réparer publisher-users.json en synchronisant depuis localStorage
 * Utilisé une seule fois pour copier les données complètes (groupes, etc.)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { people } = body;

    if (!Array.isArray(people)) {
      return NextResponse.json({ error: 'people array required' }, { status: 400 });
    }

    // Écrire les données dans publisher-users.json
    await writePublisherUsers(people);

    console.log(`✅ Publisher-users.json réparé: ${people.length} utilisateurs synchronisés`);

    return NextResponse.json({ 
      ok: true, 
      count: people.length,
      message: 'Publisher-users.json a été réparé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur lors de la réparation de publisher-users.json:', error);
    return NextResponse.json({ error: 'Repair failed' }, { status: 500 });
  }
}
