/**
 * POST /api/super-admin/assemblies/[id]/pin
 *
 * Regenere le PIN administrateur d'une assemblee. Le PIN en clair n'est renvoye
 * que dans cette reponse : seul son hash est conserve. L'ancien PIN cesse
 * immediatement de fonctionner.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/tenants/require-super-admin';
import { rotatePin } from '@/lib/tenants/assembly-registry';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const result = await rotatePin(id);
  if (!result) {
    return NextResponse.json({ error: 'Assemblee inconnue' }, { status: 404 });
  }

  return NextResponse.json({
    assembly: result.assembly,
    pin: result.pin,
    note: 'Ce PIN ne sera plus affiche. Le transmettre a l\'assemblee maintenant.',
  });
}
