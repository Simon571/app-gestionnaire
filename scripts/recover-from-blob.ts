/**
 * scripts/recover-from-blob.ts
 *
 * Remet en service les donnees restees dans Vercel Blob.
 *
 * Contexte : la base Upstash de production a disparu, et avec elle tout ce qui
 * y avait ete ecrit. Vercel Blob detient encore les memes donnees : ce script
 * les telecharge et les reecrit la ou l'application les cherche desormais.
 *
 * Deux destinations, selon l'hebergement :
 *
 *   --to=redis   (defaut) Redis Upstash, pour un deploiement Vercel.
 *   --to=files             les fichiers du dossier data/, pour un serveur
 *                          propre — aucun compte Upstash n'est alors requis.
 *
 *   npm run recover:blob                                  (simulation, Redis)
 *   npm run recover:blob -- --apply
 *   npm run recover:blob -- --to=files --apply
 *   npm run recover:blob -- --apply --backup=sauvegarde
 *   npm run recover:blob -- --apply --id=ASSEMB-XXXX --force
 *
 * Prerequis : BLOB_READ_WRITE_TOKEN dans tous les cas ; en plus
 * UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN pour `--to=redis`
 * (`vercel env pull`).
 *
 * Le blob n'est jamais modifie, et une destination deja remplie n'est jamais
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
const destinationName = (arg('to') || 'redis').trim();

if (destinationName !== 'redis' && destinationName !== 'files') {
  console.error(`--to=${destinationName} inconnu. Valeurs possibles : redis, files.`);
  process.exit(1);
}

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
  { prefix: 'publisher-preaching/reports/', target: 'data/publisher-preaching.json' },
  {
    prefix: 'publisher-preaching/submissions/',
    target: 'data/publisher-preaching-submissions.json',
  },
] as const;

/** Reste d'un essai, sans interet. */
const IGNORED = new Set(['data/debug-test.json']);

/**
 * Les donnees de plateforme ne sont pas cloisonnees par assemblee : le registre
 * est commun a toutes (cf. `blobReadGlobal` dans blob-store.ts).
 */
const isGlobal = (target: string): boolean => target.startsWith('platform/');

/** `data/families.json` -> `app:tenants:<id>:data:families.json`, comme blob-store. */
function redisKeyFor(target: string): string {
  const scoped = isGlobal(target) ? target : `tenants:${tenantId}:${target}`;
  return `app:${scoped}`.replace(/\//g, ':');
}

/**
 * `data/families.json` -> `data/tenants/<id>/families.json`.
 *
 * Reproduit exactement `scopedPaths` de blob-store : le segment de l'assemblee
 * s'insere *sous* `data/`, pas avant. Se tromper ici ecrirait des fichiers que
 * l'application ne lira jamais.
 */
function filePathFor(target: string): string {
  const sousData = target.startsWith('data/') ? target.slice('data/'.length) : target;
  const relatif = isGlobal(target)
    ? path.join('data', target)
    : path.join('data', 'tenants', tenantId, sousData);
  return path.join(process.cwd(), relatif);
}

/** Ou ecrire les donnees recuperees. */
interface Destination {
  readonly nom: string;
  /** Ce qui sera ecrit, affiche a l'utilisateur. */
  cible(target: string): string;
  /** Deja rempli ? Une destination remplie n'est pas ecrasee sans --force. */
  rempli(target: string): Promise<boolean>;
  ecrire(target: string, content: string): Promise<void>;
}

async function redisDestination(): Promise<Destination> {
  const url = cleanEnv(process.env.UPSTASH_REDIS_REST_URL);
  const token = cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url.startsWith('https://') || !token) {
    throw new Error(
      'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents. ' +
        'Sur un serveur propre, utiliser --to=files.'
    );
  }

  const { Redis } = await import('@upstash/redis');
  const redis = new Redis({ url, token });

  return {
    nom: `Redis (${new URL(url).host})`,
    cible: (target) => redisKeyFor(target),
    rempli: async (target) => Boolean(await redis.exists(redisKeyFor(target))),
    ecrire: async (target, content) => {
      await redis.set(redisKeyFor(target), content);
    },
  };
}

function filesDestination(): Destination {
  return {
    nom: `fichiers (${path.relative(process.cwd(), filePathFor('data/'))}…)`,
    cible: (target) => path.relative(process.cwd(), filePathFor(target)).replace(/\\/g, '/'),
    rempli: async (target) => {
      try {
        const stat = await fs.stat(filePathFor(target));
        return stat.size > 0;
      } catch {
        return false;
      }
    },
    ecrire: async (target, content) => {
      const destination = filePathFor(target);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, content, 'utf8');
    },
  };
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
  const destination =
    destinationName === 'files' ? filesDestination() : await redisDestination();

  console.log(`Assemblee cible : ${tenantId}`);
  console.log(`Destination     : ${destination.nom}`);
  console.log(apply ? 'Mode : APPLICATION\n' : 'Mode : SIMULATION (--apply pour ecrire)\n');

  const plans = await buildPlan();
  let restored = 0;
  let skipped = 0;
  let failed = 0;

  for (const plan of plans) {
    const kb = (plan.size / 1024).toFixed(1).padStart(8);
    const from = plan.origin === plan.target ? '' : `  (depuis ${plan.origin})`;

    if ((await destination.rempli(plan.target)) && !force) {
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

    if (apply) await destination.ecrire(plan.target, content);
    console.log(
      `  ${apply ? '+' : '~'} ${kb} ko  ${plan.target}  [${age(plan.uploadedAt)}]` +
        `${from}\n${' '.repeat(15)}-> ${destination.cible(plan.target)}`
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
