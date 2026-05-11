import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? '(not set)';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? '(not set)';
  const isVercel = process.env.VERCEL === '1';

  // Mask most of the token for security
  const maskedToken = token.length > 10
    ? token.slice(0, 6) + '...' + token.slice(-4) + ` (${token.length} chars)`
    : token;

  // Try a real Redis PING
  let pingResult = 'not attempted';
  try {
    const { Redis } = await import('@upstash/redis');
    const cleanUrl = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim().replace(/^\uFEFF/, '');
    const cleanToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim().replace(/^\uFEFF/, '');
    const redis = new Redis({ url: cleanUrl, token: cleanToken });
    const pong = await redis.ping();
    pingResult = String(pong);
  } catch (e: unknown) {
    pingResult = 'ERROR: ' + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json({
    isVercel,
    url: url.slice(0, 40),
    token: maskedToken,
    ping: pingResult,
  });
}
