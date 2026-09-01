/**
 * GET  /api/super-admin/assemblies -> liste des assemblees et de leurs abonnements
 * POST /api/super-admin/assemblies -> cree une assemblee et retourne son PIN
 *
 * L'acces est filtre en amont par le middleware, qui exige une session
 * `role: 'super-admin'` sur tout `/api/super-admin/*`. On re-verifie ici : cette
 * route ne doit pas dependre uniquement d'une garde externe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/tenants/require-super-admin';
import { createAssembly, listAssemblies } from '@/lib/tenants/assembly-registry';
import type { SubscriptionPlan } from '@/lib/tenants/subscription';

export const dynamic = 'force-dynamic';

const PLANS: SubscriptionPlan[] = ['trial', 'monthly', 'yearly'];

export async function GET(request: NextRequest) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  return NextResponse.json({ assemblies: await listAssemblies() });
}

export async function POST(request: NextRequest) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  if (name.length < 3) {
    return NextResponse.json(
      { error: 'Le nom de l\'assemblee doit comporter au moins 3 caracteres' },
      { status: 400 }
    );
  }

  const planInput = String(body.plan ?? 'trial') as SubscriptionPlan;
  const plan = PLANS.includes(planInput) ? planInput : 'trial';
  const maxPublishers = Number(body.maxPublishers ?? 200);

  try {
    const { assembly, pin } = await createAssembly({
      name,
      contactEmail: String(body.contactEmail ?? ''),
      plan,
      maxPublishers: Number.isFinite(maxPublishers) ? maxPublishers : 200,
    });

    // Le PIN n'est renvoye qu'ici : il est stocke hashe et ne pourra plus etre
    // relu. A transmettre a l'assemblee, puis a regenerer si perdu.
    return NextResponse.json({ assembly, pin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
