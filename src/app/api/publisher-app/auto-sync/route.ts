import { NextRequest, NextResponse } from 'next/server';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';

/**
 * POST /api/publisher-app/auto-sync
 * Synchronise les utilisateurs depuis la page Personnes et crée automatiquement 
 * des jobs desktop_to_mobile pour notifier Flutter
 */
export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json();
    
    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: 'users must be an array' },
        { status: 400 }
      );
    }

    // 1. Sauvegarder dans publisher-users.json
    await writePublisherUsers(users);

    // 2. Créer des jobs de sync pour chaque utilisateur qui a des rapports
    let jobsCreated = 0;

    for (const user of users) {
      // Si l'utilisateur a des rapports d'activité
      if (user.activity && Array.isArray(user.activity) && user.activity.length > 0) {
        // Créer un job desktop_to_mobile pour notifier l'app Flutter
        await PublisherSyncStore.addJob({
          direction: 'desktop_to_mobile',
          type: 'user_data',
          payload: {
            userId: user.id,
            displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            activity: user.activity,
            pin: user.pin,
            email: user.email,
            preachingGroup: user.preachingGroup,
          },
        });
        jobsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      usersCount: users.length,
      jobsCreated,
      message: `${users.length} utilisateurs synchronisés, ${jobsCreated} jobs créés`,
    });
  } catch (error) {
    console.error('Auto-sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
