import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
export const revalidate = 0;
import { z } from 'zod';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { listPreachingReports, upsertPreachingReport } from '@/lib/publisher-preaching-store';
import { readPublisherUsers } from '@/lib/publisher-users-store';
import { PublisherSyncStore } from '@/lib/publisher-sync-store';

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

export async function GET() {
  const reports = await listPreachingReports();
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('❌ Activity POST: Invalid payload', parsed.error.issues);
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  // Log l'arrivée du rapport
  console.log('📩 Activity POST received:', {
    userId: parsed.data.userId,
    month: parsed.data.month,
    didPreach: parsed.data.didPreach,
    totals: parsed.data.totals,
  });

  // Auth: prefer device (publisher-sync), otherwise fallback to user+PIN or admin override (elder/servant).
  const deviceAuth = await authenticateDevice(req, {
    permissions: ['incoming'],
  });

  let meta: Record<string, unknown> = {};
  let initiatorName = 'Mobile App';
  const users = await readPublisherUsers();

  // Check if device auth succeeded (no error response and device present)
  const deviceAuthOk = !deviceAuth.response && deviceAuth.device;
  
  if (deviceAuthOk) {
    console.log(`🔑 Auth: Device (ID: ${deviceAuth.device?.id})`);
    meta.deviceId = deviceAuth.device!.id;
    meta.deviceName = deviceAuth.device!.label;
  } else {
    const { userId, pin, adminOverride } = parsed.data;

    // Admin override: allow elders/servants to send for someone else using their own PIN.
    if (adminOverride) {
      console.log(`👥 Auth: Admin override attempt by ${adminOverride.actorId}`);
      const actor = users.find((u) => u['id'] === adminOverride.actorId && u['pin'] === adminOverride.actorPin);
      const spiritual = actor?.['spiritual'] as Record<string, unknown> | undefined;
      const actorFunction = spiritual?.['function'] as string | undefined;
      const isElder = actorFunction === 'elder' || actorFunction === 'ancien';
      const isServant = actorFunction === 'servant' || actorFunction === 'assistant';
      if (!actor || (!isElder && !isServant)) {
        console.warn(`❌ Auth: Admin override forbidden for ${adminOverride.actorId}`);
        return NextResponse.json({ error: 'Admin override forbidden.' }, { status: 401 });
      }
      meta.auth = 'admin-override';
      meta.actorId = adminOverride.actorId;
      initiatorName = (actor?.['displayName'] || actor?.['firstName'] || 'Ancien') as string;
    } else {
      // Regular user PIN
      if (!pin) {
        console.warn('❌ Auth: No PIN provided');
        return NextResponse.json({ error: 'Auth required (device or PIN).' }, { status: 401 });
      }
      const matched = users.find((u) => u['id'] === userId && u['pin'] === pin);
      if (!matched) {
        console.warn(`❌ Auth: PIN mismatch for user ${userId}`);
        return NextResponse.json({ error: 'Invalid user or PIN.' }, { status: 401 });
      }
      console.log(`✅ Auth: PIN validated for user ${userId}`);
      meta.auth = 'pin';
      initiatorName = (matched?.['displayName'] || matched?.['firstName'] || 'Proclamateur') as string;
    }
  }

  const { pin, adminOverride, ...report } = parsed.data;
  // Chaque nouvel envoi redevient "received" pour permettre une re-validation après modification.
  const record = await upsertPreachingReport({ ...report, status: 'received', meta });

  // Synchroniser vers publisher-users.json pour que Flutter voit le rapport comme envoyé
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const publisherUsersPath = path.join(process.cwd(), 'data', 'publisher-users.json');
    
    // Lire le fichier
    const rawData = await fs.readFile(publisherUsersPath, 'utf8');
    const users = JSON.parse(rawData);
    
    // Trouver l'utilisateur concerné
    const userIndex = users.findIndex((u: any) => u.id === parsed.data.userId);
    
    if (userIndex >= 0) {
      const user = users[userIndex];
      
      // S'assurer que activity[] existe
      if (!user.activity) {
        user.activity = [];
      }
      
      // Chercher si un rapport existe déjà pour ce mois
      const activityIndex = user.activity.findIndex((a: any) => a.month === parsed.data.month);
      
      // Créer ou mettre à jour le rapport
      const activityReport = {
        month: parsed.data.month,
        participated: record.totals?.hours ? record.totals.hours > 0 : record.didPreach ?? false,
        bibleStudies: record.totals?.bibleStudies ?? null,
        isAuxiliaryPioneer: false,
        hours: record.totals?.hours ?? null,
        credit: record.totals?.credit ?? null,
        isLate: record.isLate ?? false,
        remarks: '',
      };
      
      if (activityIndex >= 0) {
        // Mettre à jour le rapport existant
        user.activity[activityIndex] = {
          ...user.activity[activityIndex],
          ...activityReport,
        };
      } else {
        // Ajouter un nouveau rapport
        user.activity.push(activityReport);
      }
      
      // Mettre à jour l'utilisateur dans le tableau
      users[userIndex] = user;
      
      // Sauvegarder le fichier
      await fs.writeFile(publisherUsersPath, JSON.stringify(users, null, 2), 'utf8');
      
      console.log(`✅ Rapport synchronisé dans publisher-users.json pour ${parsed.data.userId} (${parsed.data.month})`);
    }
  } catch (err) {
    console.error('❌ Erreur lors de la mise à jour de publisher-users.json:', err);
    // Ne pas bloquer l'enregistrement du rapport si la synchro échoue
  }

  // Trouver le nom de l'utilisateur cible pour l'affichage
  const targetUser = users.find((u) => u['id'] === parsed.data.userId);
  const targetName = targetUser?.['displayName'] || targetUser?.['firstName'] || parsed.data.userId;

  // Créer un job incoming pour que le rapport apparaisse dans receive-data avec le badge
  try {
    await PublisherSyncStore.addJob({
      type: 'rapports',
      direction: 'mobile_to_desktop',
      payload: {
        userId: parsed.data.userId,
        userName: targetName,
        month: parsed.data.month,
        didPreach: parsed.data.didPreach,
        totals: parsed.data.totals,
        reportId: `${record.userId}-${record.month}`,
      },
      initiator: initiatorName,
      notify: true,
    });
  } catch (e) {
    console.error('Failed to create incoming job for preaching report', e);
  }

  return NextResponse.json({ ok: true, report: record });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  // Basic check: reserved for admins (same-site). No device auth required here.
  const record = await upsertPreachingReport({ ...parsed.data });
  
  // Si le statut est "validated", mettre à jour aussi person.activity[] dans publisher-users.json
  if (parsed.data.status === 'validated') {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const publisherUsersPath = path.join(process.cwd(), 'data', 'publisher-users.json');
      
      // Lire le fichier
      const rawData = await fs.readFile(publisherUsersPath, 'utf8');
      const users = JSON.parse(rawData);
      
      // Trouver l'utilisateur concerné
      const userIndex = users.findIndex((u: any) => u.id === parsed.data.userId);
      
      if (userIndex >= 0) {
        const user = users[userIndex];
        
        // S'assurer que activity[] existe
        if (!user.activity) {
          user.activity = [];
        }
        
        // Chercher si un rapport existe déjà pour ce mois
        const activityIndex = user.activity.findIndex((a: any) => a.month === parsed.data.month);
        
        // Créer ou mettre à jour le rapport
        const activityReport = {
          month: parsed.data.month,
          participated: record.totals?.hours ? record.totals.hours > 0 : false,
          bibleStudies: record.totals?.bibleStudies ?? null,
          isAuxiliaryPioneer: false, // À déterminer selon le statut de pionnier
          hours: record.totals?.hours ?? null,
          credit: record.totals?.credit ?? null,
          isLate: record.isLate ?? false,
          remarks: '',
        };
        
        if (activityIndex >= 0) {
          // Mettre à jour le rapport existant
          user.activity[activityIndex] = {
            ...user.activity[activityIndex],
            ...activityReport,
          };
        } else {
          // Ajouter un nouveau rapport
          user.activity.push(activityReport);
        }
        
        // Mettre à jour l'utilisateur dans le tableau
        users[userIndex] = user;
        
        // Sauvegarder le fichier
        await fs.writeFile(publisherUsersPath, JSON.stringify(users, null, 2), 'utf8');
        
        console.log(`✅ Rapport validé et synchronisé dans publisher-users.json pour ${parsed.data.userId} (${parsed.data.month})`);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour de publisher-users.json:', err);
      // Ne pas bloquer la validation si la synchro échoue
    }
  }
  
  return NextResponse.json({ ok: true, report: record });
}
