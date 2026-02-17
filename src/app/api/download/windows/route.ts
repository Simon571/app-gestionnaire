import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * API Route pour télécharger l'installateur Windows
 * Redirige vers GitHub Releases ou l'URL configurée
 */
export async function GET(request: NextRequest) {
  // URL de téléchargement depuis les variables d'environnement
  // Fallback vers la dernière release v1.0.1
  const downloadUrl = (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || 
    'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.1/Gestionnaire-setup.msi').trim().replace(/^\uFEFF/, '');

  // Log pour debug
  console.log('Download URL:', downloadUrl);

  // Redirection avec URL absolue
  return NextResponse.redirect(new URL(downloadUrl), {
    status: 307, // Temporary redirect pour permettre le changement d'URL
  });
}

/**
 * Optionnel : HEAD request pour vérifier la disponibilité
 */
export async function HEAD(request: NextRequest) {
  const downloadUrl = (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || 
    'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.1/Gestionnaire-setup.msi').trim().replace(/^\uFEFF/, '');

  try {
    const response = await fetch(downloadUrl, { method: 'HEAD' });
    return new NextResponse(null, {
      status: response.ok ? 200 : 404,
      headers: {
        'Content-Type': 'application/x-msi',
        'X-Download-URL': downloadUrl,
      },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
