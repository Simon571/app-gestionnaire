import { NextRequest, NextResponse } from 'next/server';

// Rendu dynamique obligatoire : `force-static` priverait la route des API
// dynamiques (`headers()`), donc de l'identifiant d'assemblee pose par le
// middleware. Toutes les assemblees ecriraient alors dans le meme fichier.
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { readSession } from '@/lib/api-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export async function GET(request: NextRequest) {
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    // Accès local depuis le web dashboard
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;
    const notifications = await PublisherSyncStore.listNotifications(
      Number.isNaN(limit) ? 50 : limit ?? 50
    );
    return NextResponse.json({ notifications });
  }
  
  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest }) => {
      const { searchParams } = new URL(authRequest.url);
      const limitParam = searchParams.get('limit');
      const limit = limitParam ? Number(limitParam) : undefined;
      const notifications = await PublisherSyncStore.listNotifications(
        Number.isNaN(limit) ? 50 : limit ?? 50
      );
      return NextResponse.json({ notifications });
    },
    { roles: ['desktop', 'mobile', 'server'], permissions: ['notifications'], methods: ['GET'] }
  );
}

export async function DELETE(request: NextRequest) {
  // Sans en-tete d'appareil, effacer les notifications ne demandait aucune
  // identite : n'importe qui pouvait vider la file de l'assemblee.
  const deviceId = request.headers.get('x-device-id');

  if (!deviceId) {
    const session = await readSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Session requise.' }, { status: 401 });
    }
    return runWithTenant(session.tenantId, async () => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      if (id) {
        await PublisherSyncStore.removeNotification(id);
      } else {
        await PublisherSyncStore.clearNotifications();
      }
      return NextResponse.json({ success: true });
    });
  }
  
  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest }) => {
      const { searchParams } = new URL(authRequest.url);
      const id = searchParams.get('id');
      if (id) {
        await PublisherSyncStore.removeNotification(id);
      } else {
        await PublisherSyncStore.clearNotifications();
      }
      return NextResponse.json({ success: true });
    },
    { roles: ['desktop', 'server'], permissions: ['notifications'], methods: ['DELETE'] }
  );
}
