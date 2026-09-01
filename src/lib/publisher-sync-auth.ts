import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  RATE_LIMIT_MAX_REQUESTS,
  checkRateLimit,
  getRateLimitKey,
} from '@/lib/rate-limiter';
import { blobReadGlobal } from '@/lib/blob-store';
import { runWithTenant } from '@/lib/tenants/tenant-scope';

export type PublisherSyncRole = 'desktop' | 'mobile' | 'server';
export type PublisherSyncPermission =
  | 'send'
  | 'queue'
  | 'notifications'
  | 'import'
  | 'updates'
  | 'incoming'
  | 'ack'
  | '*';

type PublisherSyncDeviceStatus = 'active' | 'revoked';

export interface PublisherSyncDevice {
  id: string;
  label: string;
  role: PublisherSyncRole;
  status: PublisherSyncDeviceStatus;
  apiKeyHash: string;
  permissions: PublisherSyncPermission[];
  lastRotatedAt: string | null;
  revokedAt: string | null;
  /**
   * Assemblee a laquelle cet appareil est rattache.
   *
   * Le middleware ne peut pas la deviner : ces requetes n'ont pas de cookie de
   * session, seulement une signature verifiable en runtime Node. C'est donc le
   * registre qui porte l'information, et `handlePublisherSyncRequest` qui
   * l'applique aux lectures/ecritures.
   *
   * Absente pour les appareils enregistres avant le passage en
   * multi-assemblees : ils continuent de lire le jeu de donnees historique non
   * prefixe, ce qui evite de couper les installations existantes.
   */
  tenantId?: string;
}

interface DevicesFileSchema {
  devices: PublisherSyncDevice[];
}

const DEVICE_CONFIG_PATH = path.join(process.cwd(), 'data', 'publisher-sync', 'devices.json');
const BLOB_DEVICES_PATH = 'publisher-sync/devices.json';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

// Minimum registry required by the released Publisher App. Only the one-way
// SHA-256 key hash is stored here; the API key itself remains in the client.
// This also protects authentication when deployment packaging omits data/.
//
// LIMITE ASSUMEE, ET COMMENT EN SORTIR
// ------------------------------------
// `mobile-main` est une identite *partagee* : la meme cle est embarquee dans
// chaque APK publie. Elle n'identifie donc pas un telephone, seulement « un
// client mobile officiel ». Tant qu'elle existe, un seul APK extrait suffit a
// parler a l'API au nom de n'importe quel appareil. Elle est conservee parce que
// la supprimer couperait tous les telephones deja installes.
//
// Deux leviers, disponibles des maintenant :
//   - `PUBLISHER_BOOTSTRAP_DEVICE=off` la desactive, une fois un APK publie avec
//     des cles par appareil (`npm run sync:keys`) ;
//   - `PUBLISHER_BOOTSTRAP_TENANT` la rattache a une assemblee, sans quoi elle
//     lit le jeu de donnees historique non prefixe.
// Ses permissions restent celles dont le client publie a besoin : lui en retirer
// une couperait l'envoi des rapports depuis les telephones deja installes.
const BOOTSTRAP_DEVICE_DISABLED =
  (process.env.PUBLISHER_BOOTSTRAP_DEVICE || '').trim().toLowerCase() === 'off';

const BOOTSTRAP_DEVICES: PublisherSyncDevice[] = BOOTSTRAP_DEVICE_DISABLED
  ? []
  : [
      {
        id: 'mobile-main',
        label: 'Téléphone',
        role: 'mobile',
        status: 'active',
        apiKeyHash: '587b2175b3df1f8e06e85c909f6989f1fcd0dfecde58a6bfd27190ef6bf3738c',
        permissions: ['updates', 'incoming', 'ack'],
        lastRotatedAt: '2025-12-05T12:26:34.248Z',
        revokedAt: null,
        tenantId: (process.env.PUBLISHER_BOOTSTRAP_TENANT || '').trim() || undefined,
      },
    ];

const jsonError = (message: string, status = 401) =>
  NextResponse.json({ error: message }, { status });

let cachedDevices: PublisherSyncDevice[] | null = null;
let cacheMtime = 0;

async function loadDevices(): Promise<PublisherSyncDevice[]> {
  // Persistent storage may contain an empty/stale device registry after a fresh
  // Vercel setup. Always merge it with the bundled bootstrap registry so the
  // credentials shipped with released clients remain recognized.
  //
  // Lecture *hors* cloisonnement (`blobReadGlobal`) : ce registre associe un
  // appareil a son assemblee, il ne peut donc pas etre range dans l'une d'elles
  // sans rendre l'association introuvable au moment ou on en a besoin.
  try {
    const persistedRaw = await blobReadGlobal(BLOB_DEVICES_PATH, DEVICE_CONFIG_PATH);
    const persistedDevices = persistedRaw
      ? (JSON.parse(persistedRaw) as DevicesFileSchema).devices ?? []
      : [];

    let bundledDevices: PublisherSyncDevice[] = [];
    try {
      const bundledRaw = await fs.readFile(DEVICE_CONFIG_PATH, 'utf8');
      bundledDevices = (JSON.parse(bundledRaw) as DevicesFileSchema).devices ?? [];
    } catch (error) {
      console.warn('publisher-sync-auth: bundled devices file unavailable', error);
    }

    const devicesById = new Map<string, PublisherSyncDevice>();
    for (const device of BOOTSTRAP_DEVICES) {
      devicesById.set(device.id, device);
    }
    for (const device of bundledDevices) {
      devicesById.set(device.id, device);
    }
    // Explicit persisted entries override bootstrap entries with the same ID,
    // preserving rotations and revocations performed in production.
    for (const device of persistedDevices) {
      devicesById.set(device.id, device);
    }

    cachedDevices = [...devicesById.values()];
    if (!cachedDevices.length) {
      console.warn('publisher-sync-auth: no devices found in persistent or bundled registry');
    }
    return cachedDevices;
  } catch (error) {
    console.error('publisher-sync-auth: unable to load devices file', error);
    cachedDevices = [];
    cacheMtime = Date.now();
    return [];
  }
}

const hashApiKey = (apiKey: string) =>
  crypto.createHash('sha256').update(apiKey).digest('hex');

const computeSignature = (secret: string, payload: string) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

const isWithinTolerance = (timestampHeader: string | null) => {
  if (!timestampHeader) return false;
  const value = Number(timestampHeader);
  const parsedDate = Number.isNaN(value)
    ? Date.parse(timestampHeader)
    : value;
  if (Number.isNaN(parsedDate)) return false;
  return Math.abs(Date.now() - parsedDate) <= TIMESTAMP_TOLERANCE_MS;
};

const deviceHasPermission = (
  device: PublisherSyncDevice,
  requiredPermissions?: PublisherSyncPermission[]
) => {
  if (!requiredPermissions || !requiredPermissions.length) return true;
  if (device.permissions.includes('*')) return true;
  return requiredPermissions.every((perm) => device.permissions.includes(perm));
};

const deviceMatchesRole = (
  device: PublisherSyncDevice,
  roles?: PublisherSyncRole[]
) => {
  if (!roles || !roles.length) return true;
  return roles.includes(device.role);
};

export interface PublisherSyncSecurityOptions {
  roles?: PublisherSyncRole[];
  permissions?: PublisherSyncPermission[];
  methods?: string[];
  rateLimit?: number;
  rateLimitId?: string;
}

export interface PublisherSyncSecurityContext {
  request: NextRequest;
  device: PublisherSyncDevice;
}

/**
 * Authenticate a device from a request without handling the full request flow.
 * Use this when you need to check device auth as part of a more complex auth flow.
 */
export async function authenticateDevice(
  request: NextRequest,
  options: PublisherSyncSecurityOptions = {}
): Promise<{ device?: PublisherSyncDevice; response?: NextResponse }> {
  if (options.methods && !options.methods.includes(request.method)) {
    return { response: jsonError('Méthode non autorisée', 405) };
  }

  const deviceId = request.headers.get('x-device-id');
  const apiKey =
    request.headers.get('x-api-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null;
  const timestampHeader = request.headers.get('x-timestamp');
  const signatureHeader = request.headers.get('x-signature');

  if (!deviceId || !apiKey) {
    return { response: jsonError('Identifiants manquants') };
  }
  if (!isWithinTolerance(timestampHeader)) {
    return { response: jsonError('Horodatage invalide ou expiré') };
  }
  if (!signatureHeader) {
    return { response: jsonError('Signature requise') };
  }

  const devices = await loadDevices();
  const device = devices.find((entry) => entry.id === deviceId);
  if (!device) {
    return { response: jsonError('Appareil inconnu', 403) };
  }
  if (device.status !== 'active' || device.revokedAt) {
    return { response: jsonError('Appareil révoqué', 403) };
  }
  if (!deviceMatchesRole(device, options.roles)) {
    return { response: jsonError('Rôle non autorisé', 403) };
  }
  if (!deviceHasPermission(device, options.permissions)) {
    return { response: jsonError('Permission insuffisante', 403) };
  }

  const hashedKey = hashApiKey(apiKey);
  if (hashedKey !== device.apiKeyHash) {
    return { response: jsonError('Clé invalide', 403) };
  }

  const url = new URL(request.url);
  const signaturePayload = `${request.method}\n${url.pathname}${url.search}\n${timestampHeader}`;
  const expectedSignature = computeSignature(hashedKey, signaturePayload);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(signatureHeader, 'hex');
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return { response: jsonError('Signature invalide', 403) };
  }

  return { device };
}

export async function handlePublisherSyncRequest(
  request: NextRequest,
  handler: (ctx: PublisherSyncSecurityContext) => Promise<NextResponse>,
  options: PublisherSyncSecurityOptions = {}
): Promise<NextResponse> {
  const auth = await authenticateDevice(request, options);
  if (auth.response || !auth.device) {
    return auth.response ?? jsonError('Accès refusé');
  }

  const rateLimit = options.rateLimit ?? RATE_LIMIT_MAX_REQUESTS.apiCall;
  const rateId = options.rateLimitId ?? `publisher-sync:${auth.device.id}`;
  const key = getRateLimitKey(request, rateId);
  const { allowed, remaining, resetTime } = await checkRateLimit(key, rateLimit);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Trop de requêtes',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  // Le handler s'execute dans le contexte d'assemblee de l'appareil : sans cela
  // les rapports envoyes par les telephones de toutes les assemblees
  // atterriraient dans un seul et meme jeu de donnees.
  const response = await runWithTenant(auth.device.tenantId, () =>
    handler({ request, device: auth.device! })
  );
  response.headers.set('X-RateLimit-Limit', String(rateLimit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  response.headers.set('X-Device-Id', auth.device.id);
  return response;
}

export function getSignatureBase(
  request: NextRequest,
  timestamp: string
): string {
  const url = new URL(request.url);
  return `${request.method}\n${url.pathname}${url.search}\n${timestamp}`;
}
