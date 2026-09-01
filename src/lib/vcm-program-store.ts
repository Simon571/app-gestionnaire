/**
 * vcm-program-store.ts
 * Programme Vie chretienne et ministere : stockage et etat de fraicheur.
 *
 * POURQUOI UN MAGASIN
 * -------------------
 * Le programme etait servi depuis un fichier statique de `public/vcm/`,
 * regenere a la main par `npm run vcm:update:fr`. Il ne pouvait donc changer
 * qu'au prix d'un nouveau deploiement, et devenait faux des que la couverture
 * arrivait a son terme — situation constatee : les donnees livrees s'arretaient
 * a la semaine du 31 aout 2026.
 *
 * Le programme est desormais range dans le stockage persistant, **hors
 * cloisonnement** : le cahier est le meme pour toutes les assemblees, seules les
 * attributions de personnes leur sont propres (`vcm-assignments-store`). Il peut
 * ainsi etre rafraichi sans redeploiement, par `POST /api/vcm/program`.
 *
 * Le fichier statique reste le filet de securite : si le magasin est vide (ou
 * pour le MSI hors ligne), c'est lui qui repond.
 */
import path from 'path';
import { blobReadGlobal, blobWriteGlobal } from '@/lib/blob-store';
import type { VcmWeek } from '@/lib/vcmTypes';

const BLOB_PATH = 'platform/vcm-program.json';
const LOCAL_PATH = path.join(process.cwd(), 'data', 'platform', 'vcm-program.json');

export interface VcmProgramFile {
  weeks: VcmWeek[];
  /** Langue du cahier ('fr', 'en'). */
  lang?: string;
  /** Horodatage de la derniere extraction reussie. */
  scrapedAt?: string;
  /** Horodatage du depot dans le magasin. */
  storedAt?: string;
  source?: string;
}

export interface VcmCoverage {
  weekCount: number;
  firstWeek: string | null;
  lastWeek: string | null;
  /** Semaines encore couvertes a partir d'aujourd'hui. */
  weeksAhead: number;
  /** Vrai si la semaine en cours n'est pas couverte. */
  missingCurrentWeek: boolean;
  /**
   * Vrai s'il reste moins de deux semaines de programme : c'est le seuil a
   * partir duquel un rafraichissement devient urgent, une reunion se preparant
   * au moins une semaine a l'avance.
   */
  stale: boolean;
  scrapedAt: string | null;
  storedAt: string | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALE_THRESHOLD_WEEKS = 2;

/** Lundi (00:00, heure locale) de la semaine contenant `date`. */
function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7; // 0 = lundi
  copy.setDate(copy.getDate() - offset);
  return copy;
}

/**
 * Debut de journee **locale** d'une date `AAAA-MM-JJ`.
 *
 * `Date.parse('2026-08-31')` renvoie minuit UTC, alors que `startOfWeek`
 * travaille en heure locale : hors UTC les deux ne coincidaient jamais, et la
 * semaine en cours etait signalee absente meme quand elle etait presente.
 */
function parseLocalDay(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? NaN : startOfDay(new Date(parsed)).getTime();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** `AAAA-MM-JJ` en heure locale, pour ne pas reculer d'un jour a l'affichage. */
function isoDay(time: number): string {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function computeCoverage(
  file: VcmProgramFile | null,
  now: Date = new Date()
): VcmCoverage {
  const weeks = (file?.weeks ?? []).filter((week) => Boolean(week.startDate));
  const starts = weeks
    .map((week) => parseLocalDay(week.startDate as string))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  const currentWeekStart = startOfWeek(now).getTime();
  const last = starts.length ? starts[starts.length - 1] : null;
  // `Math.round` et non `floor` : un changement d'heure fait des semaines de
  // 6 j 23 h, qui feraient perdre une semaine au compte.
  const weeksAhead =
    last === null
      ? 0
      : Math.max(0, Math.round((last - currentWeekStart) / (7 * MS_PER_DAY)) + 1);

  return {
    weekCount: weeks.length,
    firstWeek: starts.length ? isoDay(starts[0]) : null,
    lastWeek: last === null ? null : isoDay(last),
    weeksAhead,
    missingCurrentWeek: !starts.some((start) => start === currentWeekStart),
    stale: weeksAhead < STALE_THRESHOLD_WEEKS,
    scrapedAt: file?.scrapedAt ?? null,
    storedAt: file?.storedAt ?? null,
  };
}

/** Programme range dans le magasin, ou `null` s'il n'y en a pas encore. */
export async function readStoredVcmProgram(): Promise<VcmProgramFile | null> {
  try {
    const raw = await blobReadGlobal(BLOB_PATH, LOCAL_PATH);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VcmProgramFile;
    return Array.isArray(parsed?.weeks) ? parsed : null;
  } catch (error) {
    console.error('vcm-program-store: lecture impossible', error);
    return null;
  }
}

/**
 * Remplace le programme.
 *
 * Un depot vide est refuse : une extraction ratee renverrait `weeks: []`, et
 * l'accepter effacerait un programme valide.
 */
export async function writeStoredVcmProgram(
  file: VcmProgramFile
): Promise<VcmProgramFile> {
  if (!Array.isArray(file.weeks) || file.weeks.length === 0) {
    throw new Error('Programme vide refuse : le programme en place est conserve.');
  }
  const stored: VcmProgramFile = { ...file, storedAt: new Date().toISOString() };
  await blobWriteGlobal(BLOB_PATH, LOCAL_PATH, JSON.stringify(stored, null, 2));
  return stored;
}
