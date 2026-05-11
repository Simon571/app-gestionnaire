import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DEVICE_CONFIG_PATH = path.join(process.cwd(), 'data', 'publisher-sync', 'devices.json');

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
    const raw = await fs.readFile(DEVICE_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { devices: DeviceEntry[] };
    const devices = (parsed.devices ?? [])
      .filter((d) => d.role === 'mobile')
      .map(({ id, label, status, lastRotatedAt }) => ({ id, label, status, lastRotatedAt }));

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('mobile-devices GET error', error);
    return NextResponse.json({ devices: [] });
  }
}
