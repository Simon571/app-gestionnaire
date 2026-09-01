/**
 * /api/publisher-app/mobile-devices
 *
 * Enrolement des telephones, appareil par appareil.
 *
 * POURQUOI
 * --------
 * Jusqu'ici tous les telephones partageaient l'identite `mobile-main`, dont la
 * cle est embarquee dans chaque APK publie. Elle n'identifie donc pas un
 * appareil mais « un client mobile officiel » : impossible de revoquer un seul
 * telephone perdu, et impossible de savoir a quelle assemblee il appartient.
 *
 * Ici, un ancien enrole le telephone depuis la console : le serveur tire une cle
 * propre a cet appareil, la rattache a l'assemblee de la session, et ne la
 * montre **qu'une fois** — seule son empreinte est conservee. Une fois l'APK
 * capable de recevoir sa cle a l'enrolement, `PUBLISHER_BOOTSTRAP_DEVICE=off`
 * retire l'identite partagee.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { listDevices, registerDevice, revokeDevice } from '@/lib/publisher-sync-auth';
import { readSession } from '@/lib/api-auth';

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/** Seuls un ancien ou un assistant enrolent un appareil. */
async function requireAssemblyAdmin(request: NextRequest) {
  const session = await readSession(request);
  if (!session) {
    return { error: NextResponse.json({ error: 'Session requise.' }, { status: 401, headers: noStore }) };
  }
  if (session.role === 'publisher') {
    return {
      error: NextResponse.json(
        { error: "Enrolement reserve aux anciens et assistants de l'assemblee." },
        { status: 403, headers: noStore }
      ),
    };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  const { error, session } = await requireAssemblyAdmin(request);
  if (error) return error;

  // Le super admin n'a pas d'assemblee : il voit le parc entier.
  const scope = session!.role === 'super-admin' ? undefined : session!.tenantId;
  const devices = (await listDevices(scope)).filter((device) => device.role === 'mobile');
  return NextResponse.json({ devices }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAssemblyAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const label = typeof (body as { label?: unknown } | null)?.label === 'string'
    ? (body as { label: string }).label
    : '';

  if (!label.trim()) {
    return NextResponse.json(
      { error: 'Un libelle est requis (par exemple le nom du proclamateur).' },
      { status: 400, headers: noStore }
    );
  }

  try {
    const { device, apiKey } = await registerDevice({
      label,
      tenantId: session!.tenantId,
    });
    return NextResponse.json(
      {
        device: { id: device.id, label: device.label, status: device.status },
        // Affichee une seule fois : le registre n'en garde qu'une empreinte.
        apiKey,
        hint: "Cette cle ne sera plus affichee. La saisir sur le telephone maintenant.",
      },
      { status: 201, headers: noStore }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400, headers: noStore }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error, session } = await requireAssemblyAdmin(request);
  if (error) return error;

  const deviceId = (request.nextUrl.searchParams.get('id') || '').trim();
  if (!deviceId) {
    return NextResponse.json({ error: 'Identifiant d appareil requis.' }, { status: 400, headers: noStore });
  }

  // Revoquer l'appareil d'une autre assemblee reviendrait a couper le telephone
  // de quelqu'un d'autre : on verifie l'appartenance avant.
  if (session!.role !== 'super-admin') {
    const own = await listDevices(session!.tenantId);
    if (!own.some((device) => device.id === deviceId)) {
      return NextResponse.json({ error: 'Appareil introuvable.' }, { status: 404, headers: noStore });
    }
  }

  const revoked = await revokeDevice(deviceId);
  if (!revoked) {
    return NextResponse.json({ error: 'Appareil introuvable.' }, { status: 404, headers: noStore });
  }
  return NextResponse.json({ ok: true, id: deviceId }, { headers: noStore });
}
