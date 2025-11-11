import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { loadPub } from "meeting-schedules-parser/dist/node/index.cjs";
import type { MWBSchedule } from "meeting-schedules-parser";

type VcmItemType =
  | "discours"
  | "demonstration"
  | "lecture"
  | "priere"
  | "cantique"
  | "study"
  | "autre";

type RawItem = {
  type: VcmItemType;
  title: string;
  theme?: string;
  duration?: number;
  numero?: number;
  songNumber?: number;
  scriptures?: string;
  notes?: string[];
};

type RawSection = {
  key: "joyaux" | "ministere" | "vie_chretienne" | "cantiques" | "autre";
  title: string;
  items: RawItem[];
};

type RawWeek = {
  issue: string;
  jwLang: string;
  weekTitle: string;
  weekTitleLocale?: string;
  startDate: string;
  endDate: string;
  sourceUrl: string;
  url: string;
  weeklyBibleReading?: string;
  sections: RawSection[];
};

type OutputShape = {
  source: string;
  lang: string;
  scrapedAt: string;
  count: number;
  weeks: RawWeek[];
};

type LanguageConfig = {
  jwLang: string;
  locale: string;
  sections: {
    joyaux: string;
    ministere: string;
    vie: string;
    songs: string;
  };
  labels: {
    openingSong: string;
    middleSong: string;
    closingSong: string;
    bibleReading: string;
    gems: string;
    talk: string;
    congregationStudy: string;
  };
};

type WeekBuilderContext = {
  issue: string;
  jwLang: string;
  sourceUrl: string;
  config: LanguageConfig;
};

type MeetingWeek = MWBSchedule;

type FetchLike = typeof fetch;

const argv = process.argv.slice(2);

const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  fr: {
    jwLang: "F",
    locale: "fr-FR",
    sections: {
      joyaux: "Joyaux de la Parole de Dieu",
      ministere: "Applique-toi au ministère",
      vie: "Vie chrétienne",
      songs: "Cantiques",
    },
    labels: {
      openingSong: "Cantique d'ouverture",
      middleSong: "Cantique intermédiaire",
      closingSong: "Cantique de conclusion",
      bibleReading: "Lecture de la Bible",
      gems: "Perles spirituelles",
      talk: "Discours",
      congregationStudy: "Étude biblique de l’assemblée",
    },
  },
  en: {
    jwLang: "E",
    locale: "en-US",
    sections: {
      joyaux: "Treasures From God’s Word",
      ministere: "Apply Yourself to the Field Ministry",
      vie: "Living as Christians",
      songs: "Songs",
    },
    labels: {
      openingSong: "Opening Song",
      middleSong: "Middle Song",
      closingSong: "Concluding Song",
      bibleReading: "Bible Reading",
      gems: "Spiritual Gems",
      talk: "Talk",
      congregationStudy: "Congregation Bible Study",
    },
  },
};

const getArg = (key: string, def?: string) => {
  const prefix = `--${key}`;
  const found = argv.find(arg => arg === prefix || arg.startsWith(`${prefix}=`));
  if (!found) return def;
  if (found === prefix) return "true";
  const [, value] = found.split("=");
  return value ?? def;
};

const log = (...args: unknown[]) => console.log("[VCM]", ...args);

const LANG = (getArg("lang") || process.env.VCM_LANG || "fr").toLowerCase();
if (!(LANG in LANGUAGE_CONFIG)) {
  console.error(`[VCM] Langue non supportée: ${LANG}`);
  process.exit(1);
}
const CONFIG = LANGUAGE_CONFIG[LANG];

const FORCE = getArg("force") === "true";
const START_ARG = getArg("from");
const END_ARG = getArg("to");
const OUT_NAME = (getArg("out") || "vcm-program").replace(/\.json$/i, "");

const today = new Date();
const defaultStart = startOfWeek(today);
const defaultEnd = addDays(defaultStart, 42);
const startDate = START_ARG ? parseISODate(START_ARG) : defaultStart;
const endDate = END_ARG ? parseISODate(END_ARG) : defaultEnd;

if (!startDate || !endDate) {
  console.error("[VCM] Impossible d'interpréter les dates fournies. Utilisez le format YYYY-MM-DD.");
  process.exit(1);
}

if (endDate < startDate) {
  console.error("[VCM] La date de fin est antérieure à la date de début.");
  process.exit(1);
}

const exportDir = path.join(process.cwd(), "export");
mkdirSync(exportDir, { recursive: true });

const issueIds = computeIssueIds(startDate, endDate);

async function main() {
  log(`Scraping via JWPUB (${LANG.toUpperCase()})...`);
  const weeks: RawWeek[] = [];

  for (const issue of issueIds) {
    try {
      const { filePath, sourceUrl } = await ensureJwpub(issue, CONFIG.jwLang, exportDir, FORCE);
      log(`Lecture ${path.basename(filePath)}...`);
      const entries = (await loadPub(filePath)) as MeetingWeek[];
      for (const entry of entries) {
        const start = parseMeetingDate(entry.mwb_week_date);
        if (!start) continue;
        const end = addDays(start, 6);
        if (!rangesOverlap(start, end, startDate, endDate)) continue;
        const week = buildWeek(entry, { issue, jwLang: CONFIG.jwLang, sourceUrl, config: CONFIG });
        weeks.push(week);
      }
    } catch (error) {
      console.warn(`[VCM] Échec pour l’édition ${issue}: ${(error as Error).message}`);
    }
  }

  weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const output: OutputShape = {
    source: "https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS",
    lang: LANG,
    scrapedAt: new Date().toISOString(),
    count: weeks.length,
    weeks,
  };

  const outPath = path.join(exportDir, `${OUT_NAME}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  log(`Écriture terminée (${weeks.length} semaines) -> ${path.relative(process.cwd(), outPath)}`);
}

function buildWeek(entry: MeetingWeek, ctx: WeekBuilderContext): RawWeek {
  const start = parseMeetingDate(entry.mwb_week_date)!;
  const end = addDays(start, 6);
  const sections: RawSection[] = [];

  const joyaux = buildJoyauxSection(entry, ctx);
  if (joyaux.items.length) sections.push(joyaux);

  const ministere = buildMinistereSection(entry, ctx);
  if (ministere.items.length) sections.push(ministere);

  const vie = buildVieSection(entry, ctx);
  if (vie.items.length) sections.push(vie);

  const songs = buildSongsSection(entry, ctx);
  if (songs.items.length) sections.push(songs);

  return {
    issue: ctx.issue,
    jwLang: ctx.jwLang,
    weekTitle: formatWeekTitle(start, end, ctx.config.locale),
    weekTitleLocale: normalizeText(entry.mwb_week_date_locale),
    startDate: toISODate(start),
    endDate: toISODate(end),
    sourceUrl: ctx.sourceUrl,
    url: ctx.sourceUrl,
    weeklyBibleReading: normalizeText(entry.mwb_weekly_bible_reading),
    sections,
  };
}

function buildJoyauxSection(entry: MeetingWeek, ctx: WeekBuilderContext): RawSection {
  const { labels, sections } = ctx.config;
  const items: RawItem[] = [];

  const talkTheme = normalizeText(entry.mwb_tgw_talk) || cleanTitle(entry.mwb_tgw_talk_title);
  if (talkTheme) {
    items.push({
      type: "discours",
      title: labels.talk,
      theme: talkTheme,
      duration: 10,
      numero: extractNumero(entry.mwb_tgw_talk_title),
    });
  }

  const gemsTheme = cleanTitle(entry.mwb_tgw_gems_title);
  if (gemsTheme) {
    items.push({
      type: "demonstration",
      title: labels.gems,
      theme: gemsTheme,
      duration: 10,
      numero: extractNumero(entry.mwb_tgw_gems_title),
    });
  }

  const bibleReading = normalizeText(entry.mwb_tgw_bread) || labels.bibleReading;
  if (bibleReading) {
    items.push({
      type: "lecture",
      title: labels.bibleReading,
      theme: bibleReading,
      duration: 4,
      numero: extractNumero(entry.mwb_tgw_bread_title),
      scriptures: normalizeText(entry.mwb_weekly_bible_reading) || undefined,
    });
  }

  return { key: "joyaux", title: sections.joyaux, items };
}

function buildMinistereSection(entry: MeetingWeek, ctx: WeekBuilderContext): RawSection {
  const items: RawItem[] = [];
  const maxParts = Number(entry.mwb_ayf_count ?? 0);

  for (let idx = 1; idx <= maxParts; idx++) {
    const text = normalizeText(entry[`mwb_ayf_part${idx}` as keyof MeetingWeek]);
    const title = cleanTitle(entry[`mwb_ayf_part${idx}_title` as keyof MeetingWeek]);
    const duration = entry[`mwb_ayf_part${idx}_time` as keyof MeetingWeek];
    const typeHint = entry[`mwb_ayf_part${idx}_type` as keyof MeetingWeek];

    if (!text && !title) continue;

    items.push({
      type: mapAyfType(typeHint, title, text),
      title: title || ctx.config.sections.ministere,
      theme: text || title,
      duration: typeof duration === "number" ? duration : undefined,
      numero: extractNumero(title),
    });
  }

  return { key: "ministere", title: ctx.config.sections.ministere, items };
}

function buildVieSection(entry: MeetingWeek, ctx: WeekBuilderContext): RawSection {
  const items: RawItem[] = [];

  const lc = entry as Record<string, unknown>;
  const parts = [1, 2, 3].map(index => ({
    text: normalizeText(lc[`mwb_lc_part${index}`]),
    time: lc[`mwb_lc_part${index}_time`] as number | undefined,
    title: cleanTitle(lc[`mwb_lc_part${index}_title`]),
    content: normalizeText(lc[`mwb_lc_part${index}_content`]),
  }));

  for (const part of parts) {
    if (!part.text && !part.title) continue;
    const notes = part.content ? [part.content] : undefined;
    items.push({
      type: "discours",
      title: part.title || ctx.config.sections.vie,
      theme: part.text || part.title,
      duration: typeof part.time === "number" ? part.time : undefined,
      numero: extractNumero(part.title),
      notes,
    });
  }

  const studyTheme = normalizeText(entry.mwb_lc_cbs);
  const studyTitle = cleanTitle(entry.mwb_lc_cbs_title) || ctx.config.labels.congregationStudy;
  if (studyTheme || studyTitle) {
    items.push({
      type: "study",
      title: studyTitle,
      theme: studyTheme || studyTitle,
      duration: 30,
      numero: extractNumero(entry.mwb_lc_cbs_title),
    });
  }

  return { key: "vie_chretienne", title: ctx.config.sections.vie, items };
}

function buildSongsSection(entry: MeetingWeek, ctx: WeekBuilderContext): RawSection {
  const { labels } = ctx.config;
  const items: RawItem[] = [];

  const songs: Array<{ label: string; value: unknown }> = [
    { label: labels.openingSong, value: entry.mwb_song_first },
    { label: labels.middleSong, value: entry.mwb_song_middle },
    { label: labels.closingSong, value: entry.mwb_song_conclude },
  ];

  for (const song of songs) {
    const num = parseSongNumber(song.value);
    if (!num) continue;
    items.push({
      type: "cantique",
      title: song.label,
      theme: `${song.label} ${num}`,
      songNumber: num,
    });
  }

  return { key: "cantiques", title: ctx.config.sections.songs, items };
}

async function ensureJwpub(issue: string, jwLang: string, outDir: string, force: boolean) {
  const filename = `mwb_${jwLang}_${issue}.jwpub`;
  const dest = path.join(outDir, filename);
  if (!force && existsSync(dest)) {
    return { filePath: dest, sourceUrl: dest };
  }

  const apiUrl = new URL("https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS");
  apiUrl.searchParams.set("issue", issue);
  apiUrl.searchParams.set("output", "json");
  apiUrl.searchParams.set("pub", "mwb");
  apiUrl.searchParams.set("fileformat", "JWPUB");
  apiUrl.searchParams.set("alllangs", "0");
  apiUrl.searchParams.set("langwritten", jwLang);
  apiUrl.searchParams.set("txtCMSLang", jwLang);

  const fetchImpl = await resolveFetch();

  const res = await fetchImpl(apiUrl);
  if (!res.ok) throw new Error(`API GETPUBMEDIALINKS ${issue} -> ${res.status}`);
  const data = (await res.json()) as any;
  const fileEntry = data?.files?.[jwLang]?.JWPUB?.[0];
  if (!fileEntry?.file?.url) throw new Error(`URL JWPUB introuvable pour ${issue}`);
  const fileUrl = fileEntry.file.url as string;

  log(`Téléchargement ${filename}`);
  const fileRes = await fetchImpl(fileUrl);
  if (!fileRes.ok) throw new Error(`Téléchargement échoué ${fileRes.status}`);
  const buffer = Buffer.from(await fileRes.arrayBuffer());
  writeFileSync(dest, buffer);
  return { filePath: dest, sourceUrl: fileUrl };
}

function computeIssueIds(start: Date, end: Date): string[] {
  const set = new Set<string>();
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const limit = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= limit) {
    set.add(issueIdForDate(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return Array.from(set).sort();
}

function issueIdForDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const normalized = month % 2 === 0 ? month - 1 : month;
  return `${year}${String(normalized).padStart(2, "0")}`;
}

function parseMeetingDate(raw?: string): Date | null {
  if (!raw) return null;
  const [yyyy, mm, dd] = raw.split("/").map(Number);
  if (!yyyy || !mm || !dd) return null;
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

function parseISODate(raw: string): Date | null {
  const [yyyy, mm, dd] = raw.split("-").map(Number);
  if (!yyyy || !mm || !dd) return null;
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

function startOfWeek(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

function formatWeekTitle(start: Date, end: Date, locale: string): string {
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });
  const yearFormatter = new Intl.DateTimeFormat(locale, { year: "numeric" });

  const startDay = dayFormatter.format(start);
  const endDay = dayFormatter.format(end);
  const startMonth = monthFormatter.format(start);
  const endMonth = monthFormatter.format(end);
  const startYear = yearFormatter.format(start);
  const endYear = yearFormatter.format(end);

  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay}-${endDay} ${startMonth} ${startYear}`;
  }

  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
}

function cleanTitle(value?: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  return text.replace(/^[\d.\s]+/, "").trim();
}

function normalizeText(value?: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || undefined;
}

function extractNumero(value?: unknown): number | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  const match = text.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseSongNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/(\d{1,3})/);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}

function mapAyfType(typeHint: unknown, title: unknown, text: unknown): VcmItemType {
  const parts = [typeHint, title, text]
    .filter(v => typeof v === "string")
    .map(v => (v as string).toLowerCase());

  if (parts.some(t => t.includes("discours"))) return "discours";
  if (parts.some(t => t.includes("étude biblique") || t.includes("etude biblique") || t.includes("bible study"))) return "study";
  if (parts.some(t => t.includes("prière") || t.includes("priere") || t.includes("prayer"))) return "priere";
  if (parts.some(t => t.includes("cantique") || t.includes("chant") || t.includes("song"))) return "cantique";
  if (parts.some(t => t.includes("lecture") || t.includes("reading"))) return "lecture";
  return "demonstration";
}

async function resolveFetch(): Promise<FetchLike> {
  if (typeof fetch === "function") return fetch;
  const mod = await import("node-fetch");
  return mod.default as unknown as FetchLike;
}

main().catch(err => {
  console.error("[VCM] Erreur inattendue:", (err as Error).message);
  process.exit(1);
});
