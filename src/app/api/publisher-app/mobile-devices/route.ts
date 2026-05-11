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
    if (!raw) {
      return NextResponse.json({ devices: [], debug: 'raw is null/empty' });
    }
    const rawType = typeof raw;
    const rawPreview = typeof raw === 'string' ? raw.substring(0, 80) : JSON.stringify(raw).substring(0, 80);
    const parsed = typeof raw === 'string' ? JSON.parse(raw) as { devices: DeviceEntry[] } : raw as unknown as { devices: DeviceEntry[] };
    const devices = (parsed.devices ?? [])
      .filter((d) => d.role === 'mobile')
      .map(({ id, label, status, lastRotatedAt }) => ({ id, label, status, lastRotatedAt }));

    return NextResponse.json({ devices, debug: { rawType, rawPreview } });
  } catch (error) {
    console.error('mobile-devices GET error', error);
    return NextResponse.json({ devices: [], debug: String(error) });
  }
}
