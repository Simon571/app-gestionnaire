import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * API Route pour télécharger l'installateur Windows
 * Redirige vers GitHub Releases ou l'URL configurée
 */
export async function GET(request: NextRequest) {
  // URL de téléchargement depuis les variables d'environnement
  // Fallback vers la dernière release v1.0.2
  let downloadUrl = (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ||
    '/downloads/Gestionnaire-setup.msi').trim().replace(/^\uFEFF/, '');

  // If a relative path is provided, resolve it against the current request origin
  const resolvedUrl = downloadUrl.startsWith('/') ? new URL(downloadUrl, request.url) : new URL(downloadUrl);

  // Log pour debug
  console.log('Download URL:', resolvedUrl.toString());

  // Redirection vers l'URL résolue (locale ou absolue)
  return NextResponse.redirect(resolvedUrl, {
    status: 307,
  });
}

/**
 * Optionnel : HEAD request pour vérifier la disponibilité
 */
export async function HEAD(request: NextRequest) {
  let downloadUrl = (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || '/downloads/Gestionnaire-setup.msi').trim().replace(/^\uFEFF/, '');
  const resolvedUrl = downloadUrl.startsWith('/') ? new URL(downloadUrl, request.url) : new URL(downloadUrl);

  try {
    const response = await fetch(resolvedUrl.toString(), { method: 'HEAD' });
    return new NextResponse(null, {
      status: response.ok ? 200 : 404,
      headers: {
        'Content-Type': 'application/x-msi',
        'X-Download-URL': resolvedUrl.toString(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
