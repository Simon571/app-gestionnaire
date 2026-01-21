import { NextResponse } from 'next/server';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';

/**
 * POST /api/publisher-app/cleanup-jobs
 * Nettoie les jobs en double ou obsolètes de type user_data
 */
export async function POST() {
  try {
    // Récupérer tous les jobs user_data pending
    const jobs = await PublisherSyncStore.listJobs({
      direction: 'desktop_to_mobile',
      status: 'pending',
      types: ['user_data'],
    });

    // Supprimer tous les jobs user_data (ils seront recréés si nécessaire)
    let deletedCount = 0;
    for (const job of jobs) {
      await PublisherSyncStore.updateJob(job.id, { status: 'processed' });
      deletedCount++;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} jobs user_data nettoyés`,
    });
  } catch (error) {
    console.error('Cleanup jobs error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
