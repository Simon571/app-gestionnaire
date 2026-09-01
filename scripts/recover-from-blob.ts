/**
 * scripts/recover-from-blob.ts
 *
 * Remet dans Redis les donnees restees dans Vercel Blob.
 *
 * Contexte : la base Upstash de production a disparu, et avec elle tout ce qui
 * y avait ete ecrit. Vercel Blob detient encore des copies plus anciennes des
 * memes fichiers (data/families.json, data/publisher-users.json, …) : ce script
 * les telecharge et les reecrit dans la nouvelle base, sous le prefixe de
 * l'assemblee.
 *
 *   npm run recover:blob                          (simulation)
 *   npm run recover:blob -- --apply
 *   npm run recover:blob -- --apply --id=ASSEMB-XXXX
 *   npm run recover:blob -- --apply --backup=sauvegarde/
 *
 * Prerequis : BLOB_READ_WRITE_TOKEN, UPSTASH_REDIS_REST_URL et
 * UPSTASH_REDIS_REST_TOKEN dans l'environnement (`vercel env pull`).
 *
 * Le blob n'est jamais modifie, et une cle Redis deja remplie n'est jamais
 * ecrasee sans --force : une reprise ratee ne doit pas detruire ce qui marche.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { list } from '@vercel/blob';

const apply = process.argv.includes('--apply');
const force = process.argv.includes('--force');
const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const tenantId = (arg('id') || process.env.ASSEMBLY_ID || 'KINYOL-WGHK').trim();
const backupDir = arg('backup');

function cleanEnv(s: string | undefined): string {
  const BOM = String.fromCharCode(0xfeff);
  const value = s ?? '';
  return (value.startsWith(BOM) ? value.slice(1) : value).trim();
}

/**
 * `data/families.json` -> `app:tenants:<id>:data:families.json`
 *
 * Meme derivation que `blob-store.ts` : prefixe `tenants/<id>/`, puis les `/`
 * deviennent des `:`.
 */
function redisKeyFor(pathname: string): string {
  return `app:tenants:${tenantId}:${pathname}`.replace(/\//g, ':');
}

type Candidate = { pathname: string; url: string; size: number };

async function listBlobs(): Promise<Candidate[]> {
  const token = cleanEnv(process.env.BLOB_READ_WRITE_TOKEN);
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN absent');

  const found: Candidate[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ token, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      // Les instantanes `publisher-sync/state/state-*.json` sont des fichiers de
      // travail regeneres a chaque synchronisation : inutiles a restaurer.
      if (blob.pathname.startsWith('publisher-sync/state/')) continue;
      if (!blob.pathname.endsWith('.json')) continue;
      found.push({ pathname: blob.pathname, url: blob.url, size: blob.size });
    }
    cursor = page.cursor;
  } while (cursor);

  // Le plus gros d'abord : c'est celui dont l'echec couterait le plus cher.
  return found.sort((a, b) => b.size - a.size);
}

async function download(candidate: Candidate): Promise<string> {
  const response = await fetch(candidate.url, { cache: 'no-store' });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 120);
    throw new Error(`HTTP ${response.status} — ${detail}`);
  }
  const text = await response.text();
  // Un fichier tronque casserait le magasin en silence : on verifie.
  JSON.parse(text);
  return text;
}

async function main(): Promise<void> {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const redisToken = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url.startsWith('https://') || !redisToken) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents');
  }

  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url, token: redisToken });

  console.log(`Assemblee cible : ${tenantId}`);
  console.log(apply ? 'Mode : APPLICATION\n' : 'Mode : SIMULATION (--apply pour ecrire)\n');

  const candidates = await listBlobs();
  console.log(`${candidates.length} fichiers candidats dans Vercel Blob :\n`);

  let restored = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const key = redisKeyFor(candidate.pathname);
    const kb = (candidate.size / 1024).toFixed(1);

    const occupied = await redis.exists(key);
    if (occupied && !force) {
      console.log(`  = ${candidate.pathname} (${kb} ko) -> ${key} : deja rempli, ignore`);
      skipped += 1;
      continue;
    }

    let content: string;
    try {
      content = await download(candidate);
    } catch (error) {
      // Un store Blob desactive repond « Your store is blocked » en 403.
      console.log(`  ! ${candidate.pathname} : ${(error as Error).message}`);
      failed += 1;
      continue;
    }

    if (backupDir) {
      const target = path.join(process.cwd(), backupDir, candidate.pathname);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, 'utf8');
    }

    if (apply) await redis.set(key, content);
    console.log(`  ${apply ? '+' : '~'} ${candidate.pathname} (${kb} ko) -> ${key}`);
    restored += 1;
  }

  console.log(
    `\n${restored} a restaurer, ${skipped} ignores, ${failed} en echec.` +
      (backupDir ? ` Copies locales dans ${backupDir}.` : '')
  );
  if (!apply && restored > 0) {
    console.log("Rien n'a ete ecrit. Relancer avec --apply.");
  }
  if (failed > 0) {
    console.log(
      "\nEchecs : si le message dit « Your store is blocked », la facturation du\n" +
        'magasin Blob est inactive. La reactiver dans Vercel, puis relancer.'
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
