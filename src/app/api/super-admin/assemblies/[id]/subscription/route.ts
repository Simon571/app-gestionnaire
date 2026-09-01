/**
 * PATCH /api/super-admin/assemblies/[id]/subscription
 *
 * Point unique de gestion des abonnements. Trois usages :
 *   { action: 'renew', plan: 'monthly' }  -> prolonge (depuis l'echeance si future)
 *   { action: 'suspend' } / { action: 'reactivate' }
 *   { plan?, status?, expiresAt?, notes? } -> ajustement manuel
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/tenants/require-super-admin';
import { renewSubscription, setSubscription } from '@/lib/tenants/assembly-registry';
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/tenants/subscription';

export const dynamic = 'force-dynamic';

const PLANS: SubscriptionPlan[] = ['trial', 'monthly', 'yearly'];
const STATUSES: SubscriptionStatus[] = ['trial', 'active', 'expired', 'suspended'];

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const action = String(body.action ?? '');

  if (action === 'renew') {
    const plan = String(body.plan ?? 'monthly') as SubscriptionPlan;
    if (!PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Formule inconnue' }, { status: 400 });
    }
    const assembly = await renewSubscription(id, plan);
    return assembly
      ? NextResponse.json({ assembly })
      : NextResponse.json({ error: 'Assemblee inconnue' }, { status: 404 });
  }

  if (action === 'suspend' || action === 'reactivate') {
    const assembly = await setSubscription(id, {
      status: action === 'suspend' ? 'suspended' : 'active',
      notes: body.notes === undefined ? undefined : String(body.notes),
    });
    return assembly
      ? NextResponse.json({ assembly })
      : NextResponse.json({ error: 'Assemblee inconnue' }, { status: 404 });
  }

  const plan = body.plan === undefined ? undefined : String(body.plan) as SubscriptionPlan;
  const status = body.status === undefined ? undefined : String(body.status) as SubscriptionStatus;

  if (plan && !PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Formule inconnue' }, { status: 400 });
  }
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Statut inconnu' }, { status: 400 });
  }

  let expiresAt: string | null | undefined;
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === '') {
      expiresAt = null;
    } else {
      const parsed = Date.parse(String(body.expiresAt));
      if (Number.isNaN(parsed)) {
        return NextResponse.json({ error: 'Date d\'echeance invalide' }, { status: 400 });
      }
      expiresAt = new Date(parsed).toISOString();
    }
  }

  const assembly = await setSubscription(id, {
    plan,
    status,
    expiresAt,
    notes: body.notes === undefined ? undefined : String(body.notes),
  });

  return assembly
    ? NextResponse.json({ assembly })
    : NextResponse.json({ error: 'Assemblee inconnue' }, { status: 404 });
}
