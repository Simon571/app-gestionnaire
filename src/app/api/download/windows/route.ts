import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour télécharger l'installateur Windows
 * Redirige vers GitHub Releases ou l'URL configurée
 */
export async function GET(request: NextRequest) {
  // URL de téléchargement depuis les variables d'environnement
  // Fallback vers le fichier existant sur v0.1.0-rc1 en attendant l'upload de Gestionnaire-setup.msi
  const downloadUrl = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || 
    'https://github.com/Simon571/app-gestionnaire/releases/download/v0.1.0-rc1/Gestionnaire.d.Assemblee_1.0.0_x64_en-US.msi';

  // Redirection permanente vers le fichier
  return NextResponse.redirect(downloadUrl, {
    status: 307, // Temporary redirect pour permettre le changement d'URL
  });
}

/**
 * Optionnel : HEAD request pour vérifier la disponibilité
 */
export async function HEAD(request: NextRequest) {
  const downloadUrl = process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || 
    'https://github.com/Simon571/app-gestionnaire/releases/latest/download/Gestionnaire-setup.msi';

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
