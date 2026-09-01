/**
 * scripts/migrate-to-tenant.ts
 *
 * Deplace les donnees mono-assemblee existantes vers l'arborescence cloisonnee
 * `tenants/<assemblyId>/`.
 *
 *   npx tsx scripts/migrate-to-tenant.ts --dry-run      (par defaut)
 *   npx tsx scripts/migrate-to-tenant.ts --apply
 *   npx tsx scripts/migrate-to-tenant.ts --apply --id=ASSEMB-XXXX
 *
 * Les fichiers d'origine sont copies, jamais supprimes : en cas de probleme
 * l'etat precedent reste intact.
 */
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const apply = process.argv.includes('--apply');
const idArg = process.argv.find((arg) => arg.startsWith('--id='));
const tenantId = (idArg?.slice('--id='.length) || process.env.ASSEMBLY_ID || 'KINYOL-WGHK').trim();

function cleanEnv(s: string | undefined): string {
  const BOM = String.fromCharCode(0xfeff);
  const value = s ?? '';
  return (value.startsWith(BOM) ? value.slice(1) : value).trim();
}

async function migrateFiles(): Promise<string[]> {
  const target = path.join(DATA_DIR, 'tenants', tenantId);
  const moved: string[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(DATA_DIR);
  } catch {
    console.log('Aucun dossier data/ : rien a migrer cote fichiers.');
    return moved;
  }

  for (const entry of entries) {
    if (!entry.endsWith('.json')) continue;
    const source = path.join(DATA_DIR, entry);
    const destination = path.join(target, entry);

    if (apply) {
      await fs.mkdir(target, { recursive: true });
      // `flag: 'wx'` : ne jamais ecraser une donnee deja migree.
      try {
        await fs.copyFile(source, destination, fs.constants?.COPYFILE_EXCL ?? 0);
      } catch {
        console.log(`  ignore (deja present) : ${entry}`);
        continue;
      }
    }
    moved.push(entry);
  }
  return moved;
}

async function migrateRedis(): Promise<string[]> {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url.startsWith('https://') || !token) {
    console.log('Upstash non configure : rien a migrer cote Redis.');
    return [];
  }

  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url, token });

  const keys = await redis.keys('app:data:*');
  const moved: string[] = [];

  for (const key of keys) {
    // app:data:families.json -> app:tenants:<id>:data:families.json
    const suffix = key.slice('app:'.length);
    const destination = `app:tenants:${tenantId}:${suffix}`;

    if (await redis.exists(destination)) {
      console.log(`  ignore (deja present) : ${key}`);
      continue;
    }
    if (apply) {
      const value = await redis.get<string>(key);
      if (value === null || value === undefined) continue;
      await redis.set(destination, value);
    }
    moved.push(`${key} -> ${destination}`);
  }
  return moved;
}

async function main(): Promise<void> {
  console.log(`Assemblee cible : ${tenantId}`);
  console.log(apply ? 'Mode : APPLICATION\n' : 'Mode : SIMULATION (--apply pour ecrire)\n');

  const files = await migrateFiles();
  console.log(`Fichiers (${files.length}) :`);
  files.forEach((file) => console.log(`  data/${file} -> data/tenants/${tenantId}/${file}`));

  const redisKeys = await migrateRedis();
  console.log(`\nCles Redis (${redisKeys.length}) :`);
  redisKeys.forEach((entry) => console.log(`  ${entry}`));

  if (!apply) {
    console.log('\nRien n\'a ete ecrit. Relancer avec --apply pour appliquer.');
  } else {
    console.log('\nMigration terminee. Les donnees d\'origine sont conservees.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
