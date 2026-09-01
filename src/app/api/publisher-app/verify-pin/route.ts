/**
 * /api/publisher-app/verify-pin
 * Verification du PIN d'un proclamateur **cote serveur**.
 *
 * Elle existe pour sortir du modele actuel, ou l'application mobile verifie le
 * PIN hors ligne et doit donc detenir en clair ceux de toute l'assemblee (voir
 * `publisher-users-privacy.ts`). Un client qui appelle cette route n'a plus
 * besoin d'aucun PIN local : il envoie le nom et le PIN saisis, et recoit la
 * fiche du proclamateur, PIN retire.
 *
 * Limitation assumee : elle exige un reseau, alors que la connexion hors ligne
 * est un usage reel sur le terrain. Le client doit donc garder son chemin hors
 * ligne en repli, et n'utiliser celui-ci que lorsqu'il a du reseau — c'est ce
 * qui rendra possible, plus tard, de cesser d'envoyer les PIN aux telephones.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPublisherUsers } from '@/lib/publisher-users-store';
import { publisherDisplayName, verifyPublisherPin, type PublisherRecord } from '@/lib/publisher-auth';
import { authenticateDevice } from '@/lib/publisher-sync-auth';
import { runWithTenant } from '@/lib/tenants/tenant-scope';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

const bodySchema = z.object({
  /** Prenom ou nom affiche, tel que saisi sur le telephone. */
  name: z.string().min(1).max(120),
  pin: z.string().min(1).max(32),
  assemblyId: z.string().max(64).optional(),
});

function nameMatches(user: PublisherRecord, candidate: string): boolean {
  const target = candidate.trim().toLowerCase();
  const first = String(user['firstName'] ?? '').trim().toLowerCase();
  const display = publisherDisplayName(user, '').trim().toLowerCase();
  return Boolean(target) && (first === target || display === target);
}

/**
 * Un PIN a quatre chiffres se parcourt entierement en quelques minutes : la
 * route doit etre limitee en debit. Le plafond n'est pas celui de `login` (5 par
 * quart d'heure) parce qu'une assemblee entiere sort souvent par une seule
 * adresse IP : cinq tentatives bloqueraient tout le monde des la premiere faute
 * de frappe.
 */
const VERIFY_PIN_ATTEMPTS = 20;

export async function POST(request: NextRequest) {
  const limit = await checkRateLimit(getRateLimitKey(request, 'verify-pin'), VERIFY_PIN_ATTEMPTS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Reessayez dans un instant.' },
      { status: 429, headers: noStore }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requete invalide.' }, { status: 400, headers: noStore });
  }

  const deviceAuth = await authenticateDevice(request, { permissions: ['incoming'] });
  const device = !deviceAuth.response ? deviceAuth.device : undefined;

  return runWithTenant(device?.tenantId, async () => {
    const assemblyId = parsed.data.assemblyId?.trim() ?? '';
    const users = (await readPublisherUsers()).filter((user) => {
      if (!assemblyId) return true;
      const tag = user['_assemblyId'];
      return !tag || tag === assemblyId || tag === 'DEFAULT';
    });

    const match = users.find(
      (user) => nameMatches(user, parsed.data.name) && verifyPublisherPin(user, parsed.data.pin)
    );

    // Reponse volontairement identique pour un nom inconnu et un PIN faux :
    // les distinguer revelerait qui appartient a l'assemblee.
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Nom ou PIN invalide.' },
        { status: 401, headers: noStore }
      );
    }

    const { pin: _pin, ...safeUser } = match;
    return NextResponse.json({ ok: true, user: safeUser }, { headers: noStore });
  });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: noStore });
}
