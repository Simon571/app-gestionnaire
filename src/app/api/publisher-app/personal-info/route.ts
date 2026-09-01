/**
 * /api/publisher-app/personal-info
 * Mise a jour des coordonnees d'un proclamateur depuis l'application mobile.
 *
 * L'APK publie appelle cette route depuis deux endroits — le proclamateur qui
 * modifie sa propre fiche, et un ancien qui la modifie pour lui — mais elle
 * n'existait pas cote serveur : les deux appels recevaient un 404 et la
 * modification restait locale au telephone.
 *
 * Identite verifiee comme sur `/api/publisher-app/mobile-reports`, dont cette
 * route reprend le schema d'authentification : le champ `pin` vaut soit le PIN
 * du proclamateur concerne, soit celui d'un ancien ou d'un assistant agissant
 * en son nom. Le client n'envoie pas d'objet `adminOverride` ici ; il place le
 * PIN de l'acteur dans le meme champ, d'ou la recherche parmi les serviteurs
 * quand le PIN ne correspond pas a la fiche visee.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import {
  findPublisher,
  isAssemblyServant,
  verifyPublisherPin,
  type PublisherRecord,
} from '@/lib/publisher-auth';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';
import { readSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/** Champs modifiables. Rien d'autre n'est repris du corps de la requete. */
const CONTACT_FIELDS = [
  'email1',
  'email2',
  'mobilePhone',
  'homePhone',
  'workPhone',
  'address',
] as const;

const bodySchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(1).optional(),
  email1: z.string().max(200).optional(),
  email2: z.string().max(200).optional(),
  mobilePhone: z.string().max(60).optional(),
  homePhone: z.string().max(60).optional(),
  workPhone: z.string().max(60).optional(),
  address: z.string().max(400).optional(),
});

/** Ancien ou assistant dont le PIN correspond, sans identifiant d'acteur connu. */
function findServantByPin(users: PublisherRecord[], pin: string | undefined): PublisherRecord | null {
  if (!pin) return null;
  return (
    users.find((user) => isAssemblyServant(user) && verifyPublisherPin(user, pin)) ?? null
  );
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Coordonnees invalides.', issues: parsed.error.issues },
      { status: 400, headers: noStore }
    );
  }

  const deviceAuth = await authenticateDevice(request, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;
  const session = await readSession(request);

  return runWithTenant(device?.tenantId ?? session?.tenantId, async () => {
    const users = await readPublisherUsers();
    const target = findPublisher(users, parsed.data.userId);
    if (!target) {
      return NextResponse.json({ error: 'Utilisateur inconnu.' }, { status: 401, headers: noStore });
    }

    // Un ancien connecte au tableau de bord n'a pas de PIN a fournir ; le
    // telephone, lui, s'authentifie par le PIN.
    const sessionAuthorises = Boolean(session && session.role !== 'publisher');
    const ownPinOk = verifyPublisherPin(target, parsed.data.pin);
    const actor = ownPinOk ? null : findServantByPin(users, parsed.data.pin);

    if (!sessionAuthorises && !ownPinOk && !actor) {
      return NextResponse.json(
        { error: 'Utilisateur, PIN ou autorisation invalide.' },
        { status: 401, headers: noStore }
      );
    }

    const updates: Record<string, unknown> = {};
    for (const field of CONTACT_FIELDS) {
      const value = parsed.data[field];
      if (typeof value === 'string') updates[field] = value.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucune coordonnee a mettre a jour.' }, { status: 400, headers: noStore });
    }

    const merged = users.map((user) =>
      String(user['id'] ?? '') === parsed.data.userId
        ? {
            ...user,
            ...updates,
            _updatedAt: new Date().toISOString(),
            _updatedBy: actor
              ? `servant:${String(actor['id'] ?? '')}`
              : sessionAuthorises
                ? `session:${session?.sub ?? ''}`
                : 'self',
          }
        : user
    );

    await writePublisherUsers(merged);

    return NextResponse.json(
      { ok: true, userId: parsed.data.userId, updated: Object.keys(updates) },
      { headers: noStore }
    );
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: noStore });
}
