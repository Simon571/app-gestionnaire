import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const DEFAULT_PORT = 3000;

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const host = headersList.get('host') || `localhost:${DEFAULT_PORT}`;

  // Le port etait code en dur a 3000 alors que `url` etait deduit de l'en-tete
  // Host : un client qui reconstruit l'adresse a partir de `ip` + `port` visait
  // donc le mauvais port des que le serveur n'ecoutait pas sur 3000 (lanceur
  // Tauri, `next start -p`, reverse proxy).
  const [ip, rawPort] = host.split(':');
  const port = Number(rawPort) || DEFAULT_PORT;

  // Derriere le proxy de Vercel la connexion est en HTTPS ; annoncer `http://`
  // fournirait au client mobile une URL bloquee en contenu mixte.
  const protocol = headersList.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';
  const url = `${protocol}://${host}`;

  return NextResponse.json({
    ip,
    url,
    port,
    timestamp: new Date().toISOString(),
  });
}
