/**
 * /api/publisher-app/mobile-reports
 * Variante utilisee par l'application Flutter pour deposer et relire un rapport
 * de service. Le traitement est le meme que `/api/publisher-app/activity` ; les
 * deux routes partagent desormais la verification d'identite
 * (`publisher-auth`) et la recopie d'activite (`publisher-activity-mirror`)
 * pour qu'elles ne puissent plus divorcer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPublisherUsers } from '@/lib/publisher-users-store';
import { listPreachingReports, upsertPreachingReport } from '@/lib/publisher-preaching-store';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';
import { mirrorReportToPublisherUser } from '@/lib/publisher-activity-mirror';
import {
  findPublisher,
  publisherDisplayName,
  verifyAdminOverride,
  verifyPublisherPin,
} from '@/lib/publisher-auth';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';
import { readSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

const reportSchema = z
  .object({
    userId: z.string().min(1),
    month: z.string().regex(/^\d{4}-\d{2}$/),
    didPreach: z.boolean().optional(),
    submitted: z.boolean().optional(),
    totals: z
      .object({
        hours: z.number().optional(),
        bibleStudies: z.number().optional(),
        credit: z.number().optional(),
      })
      .optional(),
    entries: z.record(z.any()).optional(),
    pin: z.string().min(1).optional(),
    adminOverride: z
      .object({
        actorId: z.string().min(1),
        actorPin: z.string().min(1),
      })
      .optional(),
  })
  .refine((value) => Boolean(value.pin || value.adminOverride), {
    message: 'Un PIN utilisateur ou une autorisation administrateur est requis.',
  });

/**
 * Lecture : un proclamateur ne voit que ses propres rapports.
 *
 * La route renvoyait auparavant la totalite des rapports de l'assemblee a
 * quiconque appelait sans `userId`, sans aucune authentification.
 */
export async function GET(request: NextRequest) {
  const requestedUserId = request.nextUrl.searchParams.get('userId')?.trim() ?? '';
  const session = await readSession(request);
  const deviceAuth = await authenticateDevice(request, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;

  if (!session && !device) {
    return NextResponse.json({ error: 'Session ou appareil requis.' }, { status: 401, headers: noStore });
  }

  // Un appareil mobile doit designer le proclamateur dont il releve les
  // rapports ; sans cela il obtiendrait ceux de toute l'assemblee.
  if (!session && !requestedUserId) {
    return NextResponse.json({ error: 'Parametre userId requis.' }, { status: 400, headers: noStore });
  }

  const scope = session?.role === 'publisher' ? session.sub : requestedUserId;

  return runWithTenant(device?.tenantId, async () => {
    const reports = await listPreachingReports();
    return NextResponse.json(
      { reports: scope ? reports.filter((report) => report.userId === scope) : reports },
      { headers: noStore }
    );
  });
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données du rapport invalides.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const deviceAuth = await authenticateDevice(request, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;

  return runWithTenant(device?.tenantId, async () => {
    const users = await readPublisherUsers();
    const targetUser = findPublisher(users, parsed.data.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur inconnu.' }, { status: 401 });
    }

    const pinOk = verifyPublisherPin(targetUser, parsed.data.pin);
    const actor = pinOk ? null : verifyAdminOverride(users, parsed.data.adminOverride);
    if (!pinOk && !actor) {
      return NextResponse.json(
        { error: 'Utilisateur, PIN ou autorisation invalide.' },
        { status: 401 }
      );
    }

    const { pin: _pin, adminOverride: _adminOverride, ...report } = parsed.data;
    const record = await upsertPreachingReport({
      ...report,
      submitted: true,
      status: 'received',
      meta: {
        auth: actor ? 'admin-override' : 'pin',
        source: 'flutter-mobile',
        ...(actor ? { actorId: parsed.data.adminOverride?.actorId } : {}),
        ...(device ? { deviceId: device.id } : {}),
      },
    });
    await mirrorReportToPublisherUser(record);

    await PublisherSyncStore.addJob({
      type: 'rapports',
      direction: 'mobile_to_desktop',
      payload: {
        userId: record.userId,
        userName: publisherDisplayName(targetUser, record.userId),
        month: record.month,
        didPreach: record.didPreach,
        totals: record.totals,
        reportId: `${record.userId}-${record.month}`,
      },
      initiator: actor
        ? publisherDisplayName(actor, 'Responsable')
        : publisherDisplayName(targetUser, 'Publisher App'),
      notify: true,
    });

    return NextResponse.json({ ok: true, report: record });
  });
}
