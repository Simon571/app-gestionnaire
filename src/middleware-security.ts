/**
 * Middleware de securite pour Next.js
 *
 * Applique les en-tetes de securite et la politique CORS. Ce module est appele
 * par `src/middleware.ts` : Next.js n'execute qu'un seul middleware par
 * application, donc toute la logique doit converger vers ce point d'entree
 * unique.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { corsHeaders, isOriginAllowed, securityHeaderEntries } from '@/lib/security-config';

/** Ajoute les en-tetes de securite a une reponse existante. */
export function securityHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(securityHeaderEntries())) {
    response.headers.set(name, value);
  }
  return response;
}

/** Ajoute les en-tetes CORS correspondant a l'origine de la requete. */
export function applyCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  for (const [name, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(name, value);
  }
  return response;
}

/**
 * Repond a un preflight CORS. Une origine inconnue recoit un 403 sans en-tete
 * `Access-Control-Allow-Origin`, ce qui bloque la requete reelle cote
 * navigateur.
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const allowed = isOriginAllowed(origin);
  const response = new NextResponse(null, { status: allowed ? 204 : 403 });
  return securityHeaders(applyCors(response, request));
}
