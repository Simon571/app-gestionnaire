/**
 * require-super-admin.ts
 * Garde de route pour l'administration de la plateforme.
 *
 * Le middleware filtre deja `/api/super-admin/*`, mais une route ne doit pas
 * dependre uniquement d'une garde externe : une erreur de `matcher` suffirait a
 * exposer tout le parc. Retourne `null` quand l'appel est autorise, ou la
 * reponse d'erreur a renvoyer.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { readSession } from '@/lib/api-auth';

export async function requireSuperAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const session = await readSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentification requise', code: 'authentication-required' },
      { status: 401 }
    );
  }
  if (session.role !== 'super-admin') {
    return NextResponse.json(
      { error: 'Reserve a l\'administrateur de la plateforme', code: 'forbidden' },
      { status: 403 }
    );
  }
  return null;
}
