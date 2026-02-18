export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download/android
 * Redirige vers le téléchargement de l'APK Android.
 * L'URL est configurable via NEXT_PUBLIC_ANDROID_DOWNLOAD_URL.
 */
export async function GET(_request: NextRequest) {
  const downloadUrl = (
    process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ||
    'https://github.com/Simon571/app-gestionnaire/releases/latest/download/app-release.apk'
  ).trim().replace(/^\uFEFF/, '');

  return NextResponse.redirect(new URL(downloadUrl), { status: 307 });
}

export async function HEAD(_request: NextRequest) {
  const downloadUrl = (
    process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ||
    'https://github.com/Simon571/app-gestionnaire/releases/latest/download/app-release.apk'
  ).trim().replace(/^\uFEFF/, '');

  try {
    const response = await fetch(downloadUrl, { method: 'HEAD' });
    return new NextResponse(null, { status: response.ok ? 200 : 404 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
