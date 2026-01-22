import SHA256 from 'crypto-js/sha256';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import { getApiUrl } from './api-client';

interface PublisherSyncFetchOptions extends RequestInit {
  rawBody?: string;
}

const getDeviceConfig = () => {
  const deviceId = process.env.NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_ID;
  const apiKey = process.env.NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_KEY;
  if (!deviceId || !apiKey) {
    return null;
  }
  return { deviceId, apiKey };
};

const getSignature = (method: string, path: string, timestamp: string, apiKey: string) => {
  const hashedKey = SHA256(apiKey).toString();
  const payload = `${method.toUpperCase()}\n${path}\n${timestamp}`;
  const signature = HmacSHA256(payload, hashedKey).toString();
  return { hashedKey, signature };
};

export const publisherSyncFetch = async (
  input: string,
  init: PublisherSyncFetchOptions = {}
): Promise<Response> => {
  // ✨ TAURI FIX: Convertir le chemin relatif en URL complète pour Vercel
  const fullUrl = getApiUrl(input);
  
  const cfg = getDeviceConfig();
  if (!cfg) {
    // Best-effort fallback for local usage: proceed without device auth headers.
    // Protected endpoints will still reject, but callers won't crash.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('publisherSyncFetch: missing NEXT_PUBLIC_PUBLISHER_SYNC_DEVICE_*. Sending request without auth headers.');
    }
    return fetch(fullUrl, init);
  }

  const { deviceId, apiKey } = cfg;
  const url = new URL(input, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  const timestamp = Date.now().toString();
  const { signature } = getSignature(init.method ?? 'GET', `${url.pathname}${url.search}`, timestamp, apiKey);

  const headers = new Headers(init.headers);
  headers.set('X-Device-Id', deviceId);
  headers.set('X-Api-Key', apiKey);
  headers.set('X-Timestamp', timestamp);
  headers.set('X-Signature', signature);

  return fetch(fullUrl, {
    ...init,
    headers,
  });
};
