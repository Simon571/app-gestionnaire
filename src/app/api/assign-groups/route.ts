import { NextResponse } from 'next/server';

/**
 * Endpoint pour assigner automatiquement les groupes aux utilisateurs qui n'en ont pas
 * Distribution équitable entre tous les groupes disponibles
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { people, groups } = body;

    if (!Array.isArray(people)) {
      return NextResponse.json({ error: 'people array required' }, { status: 400 });
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ error: 'groups array required' }, { status: 400 });
    }

    // Filtrer les utilisateurs sans groupe
    const usersWithoutGroup = people.filter(
      (p: any) => !p.spiritual?.group || p.spiritual.group === null
    );

    // Distribuer équitablement
    let groupIndex = 0;
    let assignedCount = 0;

    const updatedPeople = people.map((person: any) => {
      // Si la personne a déjà un groupe, ne pas changer
      if (person.spiritual?.group) {
        return person;
      }

      // Assigner le prochain groupe
      const assignedGroup = groups[groupIndex];
      groupIndex = (groupIndex + 1) % groups.length;
      assignedCount++;

      return {
        ...person,
        spiritual: {
          ...person.spiritual,
          group: assignedGroup.id,
          groupName: assignedGroup.name,
        },
      };
    });

    console.log(`✅ ${assignedCount} utilisateurs ont été assignés à des groupes`);

    return NextResponse.json({
      ok: true,
      assigned: assignedCount,
      total: people.length,
      people: updatedPeople,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation des groupes:', error);
    return NextResponse.json({ error: 'Assignment failed' }, { status: 500 });
  }
}
