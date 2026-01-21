import { NextResponse } from 'next/server';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';

/**
 * POST /api/publisher-app/create-sync-job
 * Crée un job de synchronisation pour une personne modifiée
 * SANS modifier publisher-users.json
 */
export async function POST(request: Request) {
  try {
    const { person } = await request.json();
    
    if (!person || !person.id) {
      return NextResponse.json(
        { error: 'Person data required' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des données à synchroniser
    const hasActivity = person.activity && Array.isArray(person.activity) && person.activity.length > 0;
    const hasEmergencyContacts = person.emergency?.contacts && person.emergency.contacts.length > 0;
    
    if (!hasActivity && !hasEmergencyContacts) {
      return NextResponse.json({
        success: true,
        jobCreated: false,
        message: 'Aucune donnée à synchroniser',
      });
    }

    // Créer un job desktop_to_mobile
    const job = await PublisherSyncStore.addJob({
      direction: 'desktop_to_mobile',
      type: 'user_data',
      payload: {
        userId: person.id,
        displayName: person.displayName || `${person.firstName} ${person.lastName}`.trim(),
        activity: person.activity || [],
        emergencyContacts: person.emergency?.contacts || [],
        pin: person.pin,
        email: person.email1 || person.email2,
        preachingGroup: person.spiritual?.group,
      },
    });

    return NextResponse.json({
      success: true,
      jobCreated: true,
      jobId: job.id,
      message: 'Job de synchronisation créé',
    });
  } catch (error) {
    console.error('Create sync job error:', error);
    return NextResponse.json(
      { error: 'Failed to create sync job', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
