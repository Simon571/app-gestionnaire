/**
 * POST /api/assemblies/register
 *
 * Inscription d'une assemblee depuis l'application elle-meme : l'administrateur
 * saisit le nom de son assemblee dans « Information de l'assemblée », et le
 * serveur lui attribue un identifiant, un PIN et un essai d'un mois.
 *
 * Pourquoi cote serveur ? L'application distribuee (MSI, APK) genere aujourd'hui
 * ces identifiants dans le navigateur, avec un tirage au hasard. Deux postes
 * pouvaient donc tomber sur le meme identifiant, le PIN n'etait jamais hashe, et
 * surtout l'assemblee n'existait nulle part : ni dans le registre, ni dans la
 * console super admin, et le compte a rebours de l'essai ne demarrait pas.
 *
 * La route est ouverte (elle doit l'etre : l'installation qui s'inscrit n'a
 * encore aucun identifiant). Elle est donc limitee en debit par le middleware, et
 * elle n'expose rien : le PIN n'est renvoye que dans cette reponse et n'est
 * stocke que hashe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAssembly, listAssemblies } from '@/lib/tenants/assembly-registry';
import { DEFAULT_TRIAL_DAYS } from '@/lib/tenants/subscription';
import { RATE_LIMIT_MAX_REQUESTS, checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import { StorageUnavailableError } from '@/lib/blob-store';

export const dynamic = 'force-dynamic';

/** Nombre maximal d'assemblees qu'un meme poste peut inscrire en 15 minutes. */
const SIGNUP_LIMIT = RATE_LIMIT_MAX_REQUESTS.signup;

/** Longueur maximale du nom : au-dela, c'est une saisie erronee ou un abus. */
const MAX_NAME_LENGTH = 120;

export async function POST(request: NextRequest) {
  // Cle par IP : c'est la seule que l'on ait avant que l'assemblee existe.
  const { allowed, resetTime } = await checkRateLimit(
    getRateLimitKey(request, 'assembly-register'),
    SIGNUP_LIMIT
  );
  if (!allowed) {
    const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Trop d\'inscriptions depuis ce poste. Reessayez plus tard.', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

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
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Le nom de l'assemblee ne doit pas depasser ${MAX_NAME_LENGTH} caracteres` },
      { status: 400 }
    );
  }

  const contactEmail = String(body.contactEmail ?? '').trim();
  if (contactEmail.length > 200) {
    return NextResponse.json({ error: 'Adresse e-mail trop longue' }, { status: 400 });
  }

  const maxPublishers = Number(body.maxPublishers ?? 200);

  try {
    // Un seul essai par nom d'assemblee : sans cette garde, chaque clic sur
    // « Enregistrer » creerait une nouvelle assemblee dans la console super
    // admin, et le nom se remplirait de doublons.
    const existing = (await listAssemblies()).find(
      (assembly) => assembly.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return NextResponse.json(
        {
          error:
            'Une assemblee porte deja ce nom. Si c\'est la votre, connectez-vous avec ' +
            'son identifiant, ou demandez a l\'administrateur de la plateforme de regenerer ' +
            'son PIN.',
          code: 'assembly-name-taken',
        },
        { status: 409 }
      );
    }

    const { assembly, pin } = await createAssembly({
      name,
      contactEmail,
      // L'essai est la seule formule ouverte a l'inscription libre ; les formules
      // payantes sont posees par l'administrateur de la plateforme, apres
      // paiement, depuis la console super admin.
      plan: 'trial',
      maxPublishers: Number.isFinite(maxPublishers) ? maxPublishers : 200,
    });

    return NextResponse.json(
      {
        assembly,
        // Renvoye ici et nulle part ailleurs : seul le hash est conserve.
        pin,
        trialDays: DEFAULT_TRIAL_DAYS,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      console.error('assemblies/register: stockage injoignable', error.message);
      return NextResponse.json(
        {
          error:
            "Stockage indisponible : impossible d'enregistrer l'assemblee pour le moment.",
          code: 'storage-unavailable',
        },
        { status: 503, headers: { 'Retry-After': '30' } }
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}