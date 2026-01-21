export const dynamic = "force-static";
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import { authenticateDevice, handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { listPreachingReports } from '@/lib/publisher-preaching-store';

const isLocalHost = (host: string) => {
  const clean = host.toLowerCase().split(':')[0];
  return clean === 'localhost' || clean === '127.0.0.1' || clean === '::1';
};

const isPrivateLanHost = (host: string) => {
  const clean = host.toLowerCase().split(':')[0];
  // IPv4 private ranges commonly used on LAN
  return (
    clean.startsWith('192.168.') ||
    clean.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(clean)
  );
};

// GET: retourne la liste des utilisateurs avec leurs rapports d'activité fusionnés
export async function GET(request: NextRequest) {
  // Optionnellement on pourrait verrouiller par device auth; pour le moment on laisse ouvert.
  const users = await readPublisherUsers();
  const reports = await listPreachingReports();
  
  // Fusionner les rapports d'activité avec chaque utilisateur
  const usersWithActivity = users.map((user) => {
    const userId = user['id'] as string;
    const userReports = reports.filter((r) => r.userId === userId);
    
    // Convertir les rapports au format attendu par l'app Flutter
    const activity = userReports.map((r) => ({
      month: r.month,
      participated: r.didPreach ?? false,
      bibleStudies: r.totals?.bibleStudies ?? 0,
      isAuxiliaryPioneer: false,
      hours: r.totals?.hours ?? 0,
      credit: r.totals?.credit ?? 0,
      isLate: r.isLate ?? false,
      remarks: '',
    }));
    
    // Fusionner avec les activités existantes (si présentes)
    const existingActivity = Array.isArray(user['activity']) ? user['activity'] as Record<string, unknown>[] : [];
    const existingMonths = new Set(existingActivity.map((a) => a['month']));
    
    // Ajouter les nouvelles activités qui ne sont pas déjà présentes
    const mergedActivity = [...existingActivity];
    for (const act of activity) {
      if (existingMonths.has(act.month)) {
        // Mettre à jour l'activité existante
        const idx = mergedActivity.findIndex((a) => a['month'] === act.month);
        if (idx >= 0) {
          mergedActivity[idx] = { ...mergedActivity[idx], ...act };
        }
      } else {
        mergedActivity.push(act);
      }
    }
    
    return {
      ...user,
      activity: mergedActivity,
    };
  });
  
  return NextResponse.json({ users: usersWithActivity });
}

// POST: remplace la liste, réservé aux appareils desktop/server avec permission 'updates'
export async function POST(request: NextRequest) {
  // Secure path: require publisher-sync auth
  const deviceAuth = await authenticateDevice(request, {
    roles: ['desktop', 'server'],
    permissions: ['updates'],
    methods: ['POST'],
  });

  if (!deviceAuth.response && deviceAuth.device) {
    return handlePublisherSyncRequest(
      request,
      async ({ request: authRequest }) => {
        try {
          const json = await authRequest.json();
          const users = Array.isArray(json.users) ? json.users : [];
          await writePublisherUsers(users);
          return NextResponse.json({ ok: true, count: users.length });
        } catch (error) {
          console.error('users/export POST error', error);
          return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
        }
      },
      { roles: ['desktop', 'server'], permissions: ['updates'], methods: ['POST'] }
    );
  }

  // Fallback: allow unauthenticated POST only when running on localhost / LAN.
  // This is helpful for local desktop usage (e.g. Tauri) when NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_* isn't set.
  const host = request.headers.get('host') ?? '';
  const allowUnauth = isLocalHost(host) || isPrivateLanHost(host);
  if (!allowUnauth) {
    return deviceAuth.response ?? NextResponse.json({ error: 'Accès refusé' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const users = Array.isArray(json.users) ? json.users : [];
    await writePublisherUsers(users);
    return NextResponse.json({ ok: true, count: users.length, auth: 'unauth-local' });
  } catch (error) {
    console.error('users/export POST unauth-local error', error);
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
}