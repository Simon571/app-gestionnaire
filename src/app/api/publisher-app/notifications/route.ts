import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';

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
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  const deviceId = request.headers.get('x-device-id');
  
  if (!deviceId) {
    // Accès local depuis le web dashboard
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      await PublisherSyncStore.removeNotification(id);
    } else {
      await PublisherSyncStore.clearNotifications();
    }
    return NextResponse.json({ success: true });
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
