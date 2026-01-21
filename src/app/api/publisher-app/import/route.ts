import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { handlePublisherSyncRequest } from '@/lib/publisher-sync-auth';
import { PUBLISHER_SYNC_STATUSES } from '@/types/publisher-sync';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import { addAttendanceRecord } from '@/lib/attendance-store';
import { upsertPreachingReport } from '@/lib/publisher-preaching-store';

const bodySchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(PUBLISHER_SYNC_STATUSES).default('processed'),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Permettre l'accès sans authentification depuis le même serveur (web dashboard)
  const deviceId = request.headers.get('x-device-id');
  
  const processImport = async (req: NextRequest) => {
    try {
      const json = await req.json();
      const body = bodySchema.parse(json);

      // Récupérer le job pour traitement
      const job = await PublisherSyncStore.findJob(body.jobId);
      
      // Si c'est un job de contacts d'urgence, appliquer la mise à jour sur les utilisateurs
      try {
        if (job && job.type === 'emergency_contacts' && job.direction === 'mobile_to_desktop') {
          const payload = (job.payload ?? {}) as Record<string, any>;
          const userId = payload['userId'];
          const emergency = payload['emergency'];
          if (typeof userId === 'string' && emergency && typeof emergency === 'object') {
            const users = await readPublisherUsers();
            const idx = users.findIndex((u) => u['id'] === userId);
            if (idx >= 0) {
              users[idx] = {
                ...users[idx],
                emergency,
                updatedAt: new Date().toISOString(),
              };
              await writePublisherUsers(users);
            }
          }
        }
      } catch (error) {
        console.error('publisher-app/import emergency_contacts apply error', error);
      }

      // Si c'est un job d'assistance aux réunions, enregistrer dans le store d'assistance
        try {
          if (job && job.type === 'assistance' && job.direction === 'mobile_to_desktop') {
            const payload = (job.payload ?? {}) as Record<string, any>;
            const meetingType = payload['meetingType'] as 'vcm' | 'weekend';
            const inPerson = typeof payload['inPerson'] === 'number' ? payload['inPerson'] : 0;
            const online = typeof payload['online'] === 'number' ? payload['online'] : 0;
            const total = typeof payload['total'] === 'number' ? payload['total'] : inPerson + online;
            const date = payload['date'] as string ?? new Date().toISOString();
            
            await addAttendanceRecord({
              meetingType: meetingType ?? 'vcm',
              date,
              weekStart: payload['weekStart'] as string | undefined,
              weekEndDate: payload['weekEndDate'] as string | undefined,
              inPerson,
              online,
              total,
              initiator: job.initiator ?? undefined,
            });
            console.log('Assistance record saved:', { meetingType, date, inPerson, online, total });
          }
        } catch (error) {
          console.error('publisher-app/import assistance apply error', error);
        }

        // Si c'est un job de rapport de service, enregistrer dans le store de rapports
        try {
          if (job && job.type === 'rapports' && job.direction === 'mobile_to_desktop') {
            const payload = (job.payload ?? {}) as Record<string, any>;
            const userId = payload['userId'] as string;
            const month = payload['month'] as string;
            const didPreach = payload['didPreach'] as boolean ?? true;
            const totals = payload['totals'] as Record<string, any> ?? {};
            
            if (userId && month) {
              await upsertPreachingReport({
                userId,
                month,
                didPreach,
                submitted: true,
                status: 'received',
                totals,
                entries: payload['entries'] ?? {},
                meta: {
                  importedFromJob: job.id,
                  importedAt: new Date().toISOString(),
                  initiator: job.initiator,
                },
              });
              console.log('Preaching report saved:', { userId, month, didPreach, totals });
            }
          }
        } catch (error) {
          console.error('publisher-app/import rapports apply error', error);
        }

        const updated = await PublisherSyncStore.updateJob(body.jobId, {
          status: body.status,
          errorMessage: body.note ?? null,
        });

        if (!updated) {
          return NextResponse.json({ error: 'Job introuvable.' }, { status: 404 });
        }

        return NextResponse.json({ job: updated });
      } catch (error) {
        console.error('publisher-app/import error', error);
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
      }
  };
  
  if (!deviceId) {
    // Accès local depuis le web dashboard
    return processImport(request);
  }
  
  // Requête avec device headers - authentification requise
  return handlePublisherSyncRequest(
    request,
    async ({ request: authRequest }) => processImport(authRequest),
    { roles: ['desktop', 'server'], permissions: ['import'], methods: ['POST'] }
  );
}
