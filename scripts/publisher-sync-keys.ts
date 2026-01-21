#!/usr/bin/env ts-node
import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';

type Command = 'generate' | 'revoke' | 'list';

type Role = 'desktop' | 'mobile' | 'server';

type DeviceRecord = {
  id: string;
  label: string;
  role: Role;
  status: 'active' | 'revoked';
  apiKeyHash: string;
  permissions: string[];
  lastRotatedAt: string | null;
  revokedAt: string | null;
};

interface DevicesFileSchema {
  devices: DeviceRecord[];
}

const DATA_DIR = path.join(process.cwd(), 'data', 'publisher-sync');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');

const usage = `
Usage:
  ts-node scripts/publisher-sync-keys.ts list
  ts-node scripts/publisher-sync-keys.ts generate --role=desktop --label="Poste" --permissions=send,queue --id=desktop-admin
  ts-node scripts/publisher-sync-keys.ts revoke --id=desktop-admin
`;

const parseOptions = (rawArgs: string[]): Record<string, string> => {
  return rawArgs.reduce<Record<string, string>>((acc, arg) => {
    if (!arg.startsWith('--')) return acc;
    const [name, value = 'true'] = arg.slice(2).split('=');
    acc[name] = value;
    return acc;
  }, {});
};

const loadDevices = async (): Promise<DevicesFileSchema> => {
  try {
    const raw = await fs.readFile(DEVICES_FILE, 'utf8');
    return JSON.parse(raw) as DevicesFileSchema;
  } catch {
    return { devices: [] };
  }
};

const saveDevices = async (data: DevicesFileSchema): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DEVICES_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const hashKey = (key: string) => createHash('sha256').update(key).digest('hex');

async function listDevices() {
  const data = await loadDevices();
  console.table(
    data.devices.map((device) => ({
      id: device.id,
      role: device.role,
      status: device.status,
      permissions: device.permissions.join(','),
      lastRotatedAt: device.lastRotatedAt,
      revokedAt: device.revokedAt,
    }))
  );
}

async function generateDevice(options: Record<string, string>) {
  const role = options.role as Role | undefined;
  const label = options.label;
  const permissions = options.permissions?.split(',').map((entry) => entry.trim()).filter(Boolean);
  const id = options.id ?? `device-${Date.now()}`;
  const providedKey = options.key;

  if (!role || !label || !permissions?.length) {
    console.error('role, label et permissions sont requis');
    console.log(usage);
    process.exit(1);
  }

  const apiKey = providedKey ?? randomBytes(24).toString('base64url');
  const data = await loadDevices();

  if (data.devices.some((device) => device.id === id)) {
    console.error(`Un appareil avec l'identifiant "${id}" existe déjà.`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  data.devices.push({
    id,
    label,
    role,
    status: 'active',
    apiKeyHash: hashKey(apiKey),
    permissions,
    lastRotatedAt: now,
    revokedAt: null,
  });

  await saveDevices(data);
  console.log('Nouvelle clé générée. Distribue uniquement la valeur suivante à l’appareil :');
  console.log(`Device ID : ${id}`);
  console.log(`API Key   : ${apiKey}`);
}

async function revokeDevice(options: Record<string, string>) {
  const id = options.id;
  if (!id) {
    console.error('Identifiant requis (--id).');
    process.exit(1);
  }
  const data = await loadDevices();
  const device = data.devices.find((entry) => entry.id === id);
  if (!device) {
    console.error(`Appareil ${id} introuvable.`);
    process.exit(1);
  }
  device.status = 'revoked';
  device.revokedAt = new Date().toISOString();
  await saveDevices(data);
  console.log(`Appareil ${id} révoqué.`);
}

async function main() {
  const [commandRaw, ...rest] = process.argv.slice(2);
  const command = commandRaw as Command;
  const options = parseOptions(rest);

  switch (command) {
    case 'list':
      await listDevices();
      break;
    case 'generate':
      await generateDevice(options);
      break;
    case 'revoke':
      await revokeDevice(options);
      break;
    default:
      console.log(usage);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
