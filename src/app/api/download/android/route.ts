export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download/android
 * Redirige vers le téléchargement de l'APK Android.
 * L'URL est configurable via NEXT_PUBLIC_ANDROID_DOWNLOAD_URL.
 */
export async function GET(_request: NextRequest) {
  let downloadUrl = (
    process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ||
    '/downloads/app-release.apk'
  ).trim().replace(/^\uFEFF/, '');

  // Resolve relative paths against the request origin
  const resolvedUrl = downloadUrl.startsWith('/') ? new URL(downloadUrl, _request.url) : new URL(downloadUrl);

  return NextResponse.redirect(resolvedUrl, { status: 307 });
}

export async function HEAD(_request: NextRequest) {
  let downloadUrl = (
    process.env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL ||
    '/downloads/app-release.apk'
  ).trim().replace(/^\uFEFF/, '');

  const resolvedUrl = downloadUrl.startsWith('/') ? new URL(downloadUrl, _request.url) : new URL(downloadUrl);

  try {
    const response = await fetch(resolvedUrl.toString(), { method: 'HEAD' });
    return new NextResponse(null, { status: response.ok ? 200 : 404 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
