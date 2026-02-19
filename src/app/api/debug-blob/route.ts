export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env
  results.hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  results.tokenPrefix = process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 20) + '...';
  results.isVercel = process.env.VERCEL === '1';

  // 2. Test list
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'data/' });
    results.listOk = true;
    results.blobCount = blobs.length;
    results.blobPaths = blobs.map(b => b.pathname);
  } catch (e) {
    results.listError = String(e);
  }

  // 3. Test put
  try {
    const { put } = await import('@vercel/blob');
    await put('data/debug-test.json', '{"ok":true}', { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
    results.putOk = true;
  } catch (e) {
    results.putError = String(e);
  }

  return NextResponse.json(results);
}
