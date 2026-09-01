/**
 * scripts/recover-from-blob.ts
 *
 * Remet dans Redis les donnees restees dans Vercel Blob.
 *
 * Contexte : la base Upstash de production a disparu, et avec elle tout ce qui
 * y avait ete ecrit. Vercel Blob detient encore les memes donnees : ce script
 * les telecharge et les reecrit dans la nouvelle base, sous le prefixe de
 * l'assemblee.
 *
 *   npm run recover:blob                          (simulation)
 *   npm run recover:blob -- --apply
 *   npm run recover:blob -- --apply --backup=sauvegarde
 *   npm run recover:blob -- --apply --id=ASSEMB-XXXX --force
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
 * Magasins ecrits par instantanes : chaque enregistrement cree un nouveau blob
 * au nom suffixe au hasard (`addRandomSuffix`), et seul le plus recent fait foi
 * (cf. `publisher-users-persistence.ts`). Ce sont eux qui portent les donnees
 * les plus fraiches — bien plus recentes que le fichier `data/*.json` de meme
 * role, fige depuis le passage a Redis.
 */
const SNAPSHOTS = [
  { prefix: 'publisher-users/state/', target: 'data/publisher-users.json' },
  { prefix: 'publisher-sync/state/', target: 'publisher-sync/state.json' },
] as const;

/** Reste d'un essai, sans interet. */
const IGNORED = new Set(['data/debug-test.json']);

/** `data/families.json` -> `app:tenants:<id>:data:families.json`, comme blob-store. */
function redisKeyFor(target: string): string {
  return `app:tenants:${tenantId}:${target}`.replace(/\//g, ':');
}

type Plan = {
  /** Chemin canonique attendu par les magasins de l'application. */
  target: string;
  /** Chemin reel du blob, qui peut etre un instantane suffixe. */
  origin: string;
  url: string;
  size: number;
  uploadedAt: Date;
};

type BlobItem = { pathname: string; url: string; size: number; uploadedAt: Date };

/**
 * Un seul blob par destination : le plus recent. Les anciens instantanes sont
 * des versions perimees, et les recopier ecraserait la bonne par une vieille.
 */
async function buildPlan(): Promise<Plan[]> {
  const token = cleanEnv(process.env.BLOB_READ_WRITE_TOKEN);
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN absent');

  const all: BlobItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ token, cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const best = new Map<string, Plan>();
  for (const blob of all) {
    if (!blob.pathname.endsWith('.json')) continue;
    if (IGNORED.has(blob.pathname)) continue;

    const snapshot = SNAPSHOTS.find((s) => blob.pathname.startsWith(s.prefix));
    const candidate: Plan = {
      target: snapshot ? snapshot.target : blob.pathname,
      origin: blob.pathname,
      url: blob.url,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };
    const previous = best.get(candidate.target);
    if (!previous || candidate.uploadedAt > previous.uploadedAt) {
      best.set(candidate.target, candidate);
    }
  }

  console.log(`${all.length} blobs examines, ${best.size} destinations retenues.\n`);
  return [...best.values()].sort((a, b) => b.size - a.size);
}

async function download(plan: Plan): Promise<string> {
  const response = await fetch(plan.url, { cache: 'no-store' });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 120);
    throw new Error(`HTTP ${response.status} — ${detail}`);
  }
  const text = await response.text();
  // Un fichier tronque casserait le magasin en silence : on verifie.
  JSON.parse(text);
  return text;
}

const age = (date: Date): string =>
  `${Math.round((Date.now() - date.getTime()) / 86_400_000)} j`;

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

  const plans = await buildPlan();
  let restored = 0;
  let skipped = 0;
  let failed = 0;

  for (const plan of plans) {
    const key = redisKeyFor(plan.target);
    const kb = (plan.size / 1024).toFixed(1).padStart(8);
    const from = plan.origin === plan.target ? '' : `  (depuis ${plan.origin})`;

    if ((await redis.exists(key)) && !force) {
      console.log(`  = ${kb} ko  ${plan.target} : deja rempli, ignore`);
      skipped += 1;
      continue;
    }

    let content: string;
    try {
      content = await download(plan);
    } catch (error) {
      // Un magasin Blob au quota depasse repond « Your store is blocked » en 403.
      console.log(`  ! ${kb} ko  ${plan.target} : ${(error as Error).message}`);
      failed += 1;
      continue;
    }

    if (backupDir) {
      const target = path.join(process.cwd(), backupDir, plan.target);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content, 'utf8');
    }

    if (apply) await redis.set(key, content);
    console.log(
      `  ${apply ? '+' : '~'} ${kb} ko  ${plan.target}  [${age(plan.uploadedAt)}]${from}`
    );
    restored += 1;
  }

  console.log(
    `\n${restored} ${apply ? 'restaures' : 'a restaurer'}, ${skipped} ignores, ${failed} en echec.` +
      (backupDir ? ` Copies locales dans ${backupDir}/.` : '')
  );
  if (!apply && restored > 0) console.log("Rien n'a ete ecrit. Relancer avec --apply.");
  if (failed > 0) {
    console.log(
      "\nEchecs : si le message dit « Your store is blocked », le quota du magasin\n" +
        'Blob est depasse. Attendre sa remise a zero ou le debloquer, puis relancer.'
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
