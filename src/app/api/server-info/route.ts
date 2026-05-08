import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  
  // Extraire l'IP (enlever le port)
  const ip = host.split(':')[0];
  const url = `http://${host}`;
  
  return NextResponse.json({
    ip,
    url,
    port: 3000,
    timestamp: new Date().toISOString(),
  });
}
