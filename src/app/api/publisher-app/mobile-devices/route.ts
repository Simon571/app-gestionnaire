import { NextResponse } from 'next/server';
import { blobRead } from '@/lib/blob-store';
import path from 'path';

export const dynamic = 'force-dynamic';

const DEVICE_CONFIG_PATH = path.join(process.cwd(), 'data', 'publisher-sync', 'devices.json');
const BLOB_DEVICES_PATH = 'publisher-sync/devices.json';

interface DeviceEntry {
  id: string;
  label: string;
  role: string;
  status: string;
  permissions: string[];
  lastRotatedAt: string | null;
  revokedAt: string | null;
}

export async function GET() {
  try {
    const raw = await blobRead(BLOB_DEVICES_PATH, DEVICE_CONFIG_PATH);
    const rawType = typeof raw;
    const rawNull = raw === null;
    const rawPreview = raw ? (typeof raw === 'string' ? raw.substring(0, 60) : JSON.stringify(raw).substring(0, 60)) : 'NULL';

    if (!raw) {
      return NextResponse.json({ devices: [], d: { rawType, rawNull, rawPreview, isVercel: process.env.VERCEL, hasRedisUrl: !!(process.env.UPSTASH_REDIS_REST_URL) } });
    }
    const parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)) as { devices: DeviceEntry[] };
    const devices = (parsed.devices ?? [])
      .filter((d) => d.role === 'mobile')
      .map(({ id, label, status, lastRotatedAt }) => ({ id, label, status, lastRotatedAt }));
    return NextResponse.json({ devices, d: { rawType, rawPreview } });
  } catch (error) {
    console.error('mobile-devices GET error', error);
    return NextResponse.json({ devices: [], d: String(error) });
  }
}
  } catch (error) {
    console.error('mobile-devices GET error', error);
    return NextResponse.json({ devices: [] });
  }
}
