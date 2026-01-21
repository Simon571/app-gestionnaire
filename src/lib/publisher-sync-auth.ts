import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  RATE_LIMIT_MAX_REQUESTS,
  checkRateLimit,
  getRateLimitKey,
} from '@/lib/rate-limiter';

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
}

interface DevicesFileSchema {
  devices: PublisherSyncDevice[];
}

const DEVICE_CONFIG_PATH = path.join(process.cwd(), 'data', 'publisher-sync', 'devices.json');
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

const jsonError = (message: string, status = 401) =>
  NextResponse.json({ error: message }, { status });

let cachedDevices: PublisherSyncDevice[] | null = null;
let cacheMtime = 0;

async function loadDevices(): Promise<PublisherSyncDevice[]> {
  try {
    const stat = await fs.stat(DEVICE_CONFIG_PATH);
    if (cachedDevices && stat.mtimeMs === cacheMtime) {
      return cachedDevices;
    }
    const raw = await fs.readFile(DEVICE_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DevicesFileSchema;
    cachedDevices = parsed.devices ?? [];
    cacheMtime = stat.mtimeMs;
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
  const { allowed, remaining, resetTime } = checkRateLimit(key, rateLimit);

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

  const response = await handler({ request, device: auth.device });
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
