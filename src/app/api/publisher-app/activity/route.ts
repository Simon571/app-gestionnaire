/**
 * /api/publisher-app/activity
 * Rapports de service envoyes par l'application mobile, et validation cote web.
 *
 * GET    : liste des rapports de l'assemblee (reserve aux sessions web).
 * POST   : depot d'un rapport, par un appareil signe ou par PIN.
 * PATCH  : changement de statut (recu / valide), reserve aux anciens.
 */
// Rendu dynamique obligatoire : `force-static` priverait la route des API
// dynamiques (`headers()`), donc de l'identifiant d'assemblee pose par le
// middleware. Toutes les assemblees ecriraient alors dans le meme fichier.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { listPreachingReports, upsertPreachingReport } from '@/lib/publisher-preaching-store';
import { readPublisherUsers } from '@/lib/publisher-users-store';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { mirrorReportToPublisherUser } from '@/lib/publisher-activity-mirror';
import {
  findPublisher,
  isAssemblyServant,
  publisherDisplayName,
  verifyAdminOverride,
  verifyPublisherPin,
} from '@/lib/publisher-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';
import { readSession } from '@/lib/api-auth';

const reportSchema = z.object({
  userId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  didPreach: z.boolean().optional(),
  submitted: z.boolean().optional(),
  status: z.enum(['received', 'validated']).optional(),
  totals: z
    .object({
      hours: z.number().optional(),
      bibleStudies: z.number().optional(),
      credit: z.number().optional(),
    })
    .optional(),
  entries: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  pin: z.string().optional(),
  adminOverride: z
    .object({
      actorId: z.string().min(1),
      actorPin: z.string().min(1),
    })
    .optional(),
});

const statusSchema = z.object({
  userId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  status: z.enum(['received', 'validated']),
});

const unauthorized = (message: string, status = 401) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: NextRequest) {
  // Les rapports contiennent les heures de chaque proclamateur : la lecture
  // suppose une session d'assemblee, pas seulement une requete depuis le site.
  const session = await readSession(request);
  if (!session) return unauthorized('Session requise');

  const reports = await listPreachingReports();
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Trois voies d'authentification, par ordre de confiance :
  //   1. signature d'appareil (application mobile enregistree) ;
  //   2. PIN du proclamateur concerne ;
  //   3. PIN d'un ancien ou assistant agissant pour lui.
  const deviceAuth = await authenticateDevice(req, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;

  // L'assemblee vient de l'appareil quand il y en a un ; sinon du middleware,
  // qui l'a deja posee sur la requete a partir du cookie de session.
  return runWithTenant(device?.tenantId, async () => {
    const users = await readPublisherUsers();
    const { userId, pin, adminOverride } = parsed.data;
    const meta: Record<string, unknown> = { ...(parsed.data.meta ?? {}) };
    let initiatorName = 'Mobile App';

    if (device) {
      meta.auth = 'device';
      meta.deviceId = device.id;
      meta.deviceName = device.label;
    } else if (adminOverride) {
      const actor = verifyAdminOverride(users, adminOverride);
      if (!actor) {
        return unauthorized('Envoi pour autrui reserve aux anciens et assistants.', 403);
      }
      meta.auth = 'admin-override';
      meta.actorId = adminOverride.actorId;
      initiatorName = publisherDisplayName(actor, 'Ancien');
    } else {
      const target = findPublisher(users, userId);
      if (!verifyPublisherPin(target, pin)) {
        return unauthorized('Utilisateur ou PIN invalide.');
      }
      meta.auth = 'pin';
      initiatorName = publisherDisplayName(target, 'Proclamateur');
    }

    const { pin: _pin, adminOverride: _override, meta: _meta, ...report } = parsed.data;
    // Chaque nouvel envoi redevient « recu » pour permettre une re-validation
    // apres modification.
    const record = await upsertPreachingReport({ ...report, status: 'received', meta });

    await mirrorReportToPublisherUser(record);

    const targetName = publisherDisplayName(findPublisher(users, userId), userId);

    // Job entrant : c'est ce qui fait apparaitre le rapport dans
    // /publisher-app/receive-data avec le badge de notification.
    try {
      await PublisherSyncStore.addJob({
        type: 'rapports',
        direction: 'mobile_to_desktop',
        payload: {
          userId,
          userName: targetName,
          month: parsed.data.month,
          didPreach: parsed.data.didPreach,
          totals: parsed.data.totals,
          reportId: `${record.userId}-${record.month}`,
        },
        initiator: initiatorName,
        notify: true,
      });
    } catch (error) {
      console.error('Failed to create incoming job for preaching report', error);
    }

    return NextResponse.json({ ok: true, report: record });
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Valider un rapport est un acte d'administration. Auparavant cette route
  // n'exigeait rien : n'importe quelle requete pouvait marquer un rapport comme
  // valide.
  const session = await readSession(req);
  if (!session) return unauthorized('Session requise');
  if (session.role === 'publisher') {
    const users = await readPublisherUsers();
    if (!isAssemblyServant(findPublisher(users, session.sub))) {
      return unauthorized('Validation reservee aux anciens et assistants.', 403);
    }
  }

  const record = await upsertPreachingReport({ ...parsed.data });
  await mirrorReportToPublisherUser(record);

  return NextResponse.json({ ok: true, report: record });
}
