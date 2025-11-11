/**
 * Middleware de sécurité pour Next.js
 * Ajoute les headers de sécurité nécessaires et applique les règles CSP
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityHeaders(response: NextResponse) {
  // Politique de sécurité du contenu (CSP)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://supabase.co; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // Empêcher les clics depuis des frames externes
  response.headers.set('X-Frame-Options', 'DENY');

  // Empêcher la détection de type MIME
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Activer le XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Référrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (anciennement Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // HSTS - Forcer HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Désactiver la mise en cache pour les pages sensibles
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const middleware = (request: NextRequest) => {
  const response = NextResponse.next();

  // Appliquer les headers de sécurité
  return securityHeaders(response as NextResponse);
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
