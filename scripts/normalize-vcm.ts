
// scripts/normalize-vcm.ts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import * as path from "path";

type RawItemStruct = {
  type?: string;
  title?: string;
  theme?: string;
  duration?: number;
  songNumber?: number;
  scriptures?: string;
  notes?: string[];
  numero?: number;
};
type RawItem = string | RawItemStruct;
type RawSection = {
  key?: string;
  title?: string;
  items?: RawItem[];
};
type RawWeek = {
  url?: string;
  sourceUrl?: string;
  weekTitle: string;
  weekTitleLocale?: string;
  startDate?: string | null;
  endDate?: string | null;
  issue?: string | null;
  sections?: RawSection[];
};
type RawShape =
  | { source?: string; count?: number; results: RawWeek[] }
  | { weeks: RawWeek[] };

type VcmItemType = "discours" | "demonstration" | "lecture" | "priere" | "cantique" | "study" | "autre";
type VcmItem = {
  type: VcmItemType;
  title: string;      // ex: "Perles spirituelles"
  theme: string;      // sujet affiché
  duration?: number;  // minutes si détecté
  songNumber?: number;
  scriptures?: string;
  notes?: string[];
  number?: number;
};
type VcmSection = {
  key: "joyaux" | "ministere" | "vie_chretienne" | "cantiques" | "autre";
  title: string;
  items: VcmItem[];
};
type VcmWeek = {
  weekTitle: string;
  weekTitleLocale?: string;
  startDate: string | null;
  endDate: string | null;
  issue?: string | null;
  sourceUrl: string;
  sections: VcmSection[];
};

const INPUT_FILE  = path.resolve(process.cwd(), "export", "vcm-program.json");
const argv = process.argv.slice(2);
const getArg = (k: string, d?: string) => {
  const a = argv.find(x => x.startsWith(`--${k}`));
  if (!a) return d;
  const [, v] = a.split("=");
  return (v || d) as string | undefined;
};
const LANG = (getArg("lang") || process.env.VCM_LANG || "fr").toLowerCase();
const OUT_FILE = path.resolve(process.cwd(), "public", "vcm", LANG, "vcm-program.normalized.json");
const LEGACY_FR_OUTPUT = path.resolve(process.cwd(), "public", "vcm", "vcm-program.normalized.json");
const log = (...a: any[]) => console.log("[VCM-Normalize]", ...a);

// ---------- Helpers dates (sans fuseau) ----------
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const norm = (s: string) =>
  (s || "").toLowerCase().replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const toDay = (d: string) => (d === "1er" ? 1 : parseInt(d, 10));

const monthMapFR: Record<string, number> = {
  "janvier":1,"février":2,"fevrier":2,"mars":3,"avril":4,"mai":5,"juin":6,
  "juillet":7,"août":8,"aout":8,"septembre":9,"octobre":10,"novembre":11,
  "décembre":12,"decembre":12,
  "janv":1,"févr":2,"fevr":2,"avr":4,"juill":7,"sept":9,"oct":10,"nov":11,"déc":12,"dec":12
};
const monthMapEN: Record<string, number> = {
  "january":1,"jan":1,
  "february":2,"feb":2,
  "march":3,"mar":3,
  "april":4,"apr":4,
  "may":5,
  "june":6,"jun":6,
  "july":7,"jul":7,
  "august":8,"aug":8,
  "september":9,"sep":9,"sept":9,
  "october":10,"oct":10,
  "november":11,"nov":11,
  "december":12,"dec":12
};
const monthMap: Record<string, number> = LANG === 'en' ? monthMapEN : monthMapFR;

function guessBaseYear(title: string, url: string): number {
  const mt = title.match(/\b(19|20)\d{2}\b/);
  if (mt) return parseInt(mt[0], 10);
  const mu = url.match(/\b(19|20)\d{2}\b/g);
  if (mu && mu.length) return parseInt(mu[mu.length - 1], 10);
  return new Date().getFullYear();
}

// ---------- Lecture entrée ----------
function readRawShape(): RawShape {
  return JSON.parse(readFileSync(INPUT_FILE, "utf-8")) as RawShape;
}

function extractWeeks(raw: RawShape): RawWeek[] {
  if ("results" in raw && Array.isArray(raw.results)) return raw.results;
  if ("weeks" in raw && Array.isArray(raw.weeks)) return raw.weeks;
  throw new Error("Format d’entrée inattendu: ni results[] ni weeks[]");
}

function updateRawShape(raw: RawShape, weeks: RawWeek[]): RawShape {
  if ("results" in raw && Array.isArray(raw.results)) {
    raw.results = weeks;
    return raw;
  }
  if ("weeks" in raw && Array.isArray(raw.weeks)) {
    raw.weeks = weeks;
    return raw;
  }
  throw new Error("Format d’entrée inattendu pour mise à jour");
}

// ---------- Parsing titres de semaines ----------
function parseWeekDates(weekTitleRaw: string, urlForYear?: string) {
  const s = norm(weekTitleRaw.replace(/programme.*?du\s+/i, ""));
  const baseYear = guessBaseYear(weekTitleRaw, urlForYear || "");

  // A) Cross-month e.g., FR "29 septembre – 5 octobre 2025"; EN "September 29 – October 5, 2025"
  let m = s.match(
    LANG === 'en'
      ? /(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(?:to|[-–])\s*(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(19|20)\d{2})?/
      : /(\d{1,2}|1er)\s+(janv(?:ier)?|févr(?:ier)?|fevr(?:ier)?|mars|avr(?:il)?|mai|juin|juill(?:et)?|août|aout|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?)\s*(?:au|[-–])\s*(\d{1,2})\s+(janv(?:ier)?|févr(?:ier)?|fevr(?:ier)?|mars|avr(?:il)?|mai|juin|juill(?:et)?|août|aout|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?)(?:\s+(19|20)\d{2})?/
  );
  if (m) {
    const [, d1, mo1, d2, mo2, yOpt] = m;
    const mm1 = monthMap[mo1.replace(/\.$/, "")] ?? monthMap[mo1];
    const mm2 = monthMap[mo2.replace(/\.$/, "")] ?? monthMap[mo2];
    const y1 = yOpt ? parseInt(yOpt, 10) : baseYear;
    const y2 = yOpt ? parseInt(yOpt, 10) : (mm2 < mm1 ? y1 + 1 : y1);
    return { startDate: iso(y1, mm1, toDay(d1)), endDate: iso(y2, mm2, parseInt(d2, 10)) };
  }

  // B) Same-month: FR "08 – 14 septembre 2025"; EN "September 8–14, 2025"
  m = s.match(
    LANG === 'en'
      ? /(\d{1,2})\s*(?:to|[-–])\s*(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+(19|20)\d{2})?/
      : /(\d{1,2}|1er)\s*(?:au|[-–])\s*(\d{1,2})\s+(janv(?:ier)?|févr(?:ier)?|fevr(?:ier)?|mars|avr(?:il)?|mai|juin|juill(?:et)?|août|aout|sept(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?)(?:\s+(19|20)\d{2})?/
  );
  if (m) {
    const [, d1, d2, mo, yOpt] = m;
    const mm = monthMap[mo.replace(/\.$/, "")] ?? monthMap[mo];
    const y = yOpt ? parseInt(yOpt, 10) : baseYear;
    return { startDate: iso(y, mm, toDay(d1)), endDate: iso(y, mm, parseInt(d2, 10)) };
  }

  // C) Abbrev month
  m = LANG === 'en'
    ? s.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(sep|sept|oct|nov|dec)\.?/)
    : s.match(/(\d{1,2}|1er)\s*[-–]\s*(\d{1,2})\s*(sept|oct|nov|d[ée]c)\.?/);
  if (m) {
    const [, d1, d2, mo] = m;
    const mm = monthMap[mo];
    return { startDate: iso(baseYear, mm, toDay(d1)), endDate: iso(baseYear, mm, parseInt(d2, 10)) };
  }

  // D) "1er-7 septembre" (sans année, mois complet)
  m = s.match(/(\d{1,2}|1er)\s*[-–]\s*(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/);
  if (m) {
    const [, d1, d2, mo] = m;
    const mm = monthMap[mo];
    return { startDate: iso(baseYear, mm, toDay(d1)), endDate: iso(baseYear, mm, parseInt(d2, 10)) };
  }

  // E) "27 octobre – 2 novembre" (sans année, sur 2 mois)
  m = s.match(/(\d{1,2}|1er)\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s*(?:au|[-–])\s*(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/);
  if (m) {
    const [, d1, mo1, d2, mo2] = m;
    const mm1 = monthMap[mo1], mm2 = monthMap[mo2];
    const y1 = baseYear;
    const y2 = mm2 < mm1 ? y1 + 1 : y1;
    return { startDate: iso(y1, mm1, toDay(d1)), endDate: iso(y2, mm2, parseInt(d2, 10)) };
  }

  return { startDate: null, endDate: null };
}

// ---------- Mappings items ----------
function mapKey(title: string): VcmSection["key"] {
  const t = (title || "").toLowerCase();
  if (t.includes('perles spirituelles') || t.includes('lecture de la bible') || t.startsWith('1.')) {
    return "joyaux";
  }
  if (t.includes('engage la conversation') || t.includes('entretiens l’intérêt') || t.includes('fais des disciples') || t.includes('explique tes croyances')) {
    return "ministere";
  }
  if (
    t.includes('besoins de l’assemblée') ||
    t.includes('besoins de l\'assemblée') ||
    t.includes('etude biblique de l’assemblée') ||
    t.includes('étude biblique de l’assemblée') ||
    t.includes('l’organisation de dieu à l’œuvre') ||
    t.includes('vie chrétienne') ||
    t.includes('vie chretienne') ||
    t.includes('christian life')
  ) {
    return "vie_chretienne";
  }
  if (/cantique|chant|prière|priere|conclusion/.test(t)) {
    return "autre";
  }
  // Fallback pour les autres discours numérotés
  if (/^\d+\./.test(t)) {
      return "vie_chretienne";
  }
  return "autre";
}
function extractDuration(s: string): number | undefined {
  const m = s.match(/(\d{1,3})\s*(?:min|minutes)\b/i);
  return m ? parseInt(m[1], 10) : undefined;
}
function extractSong(s: string): number | undefined {
  const m = s.match(/(?:cantique|chant)\s*(?:n[°ºo]\s*)?(\d{1,3})/i);
  return m ? parseInt(m[1], 10) : undefined;
}
function extractScriptures(s: string): string | undefined {
  const m = s.match(/[1-3]?\s?[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)*\s+\d{1,3}:\d{1,3}(?:[-–]\d{1,3})?/);
  return m ? m[0] : undefined;
}

function isChristianLifeSection(section?: RawSection): boolean {
  if (!section) return false;
  const key = norm(section.key || "");
  if (key.includes("vie") && key.includes("chret")) return true;
  const title = norm(section.title || "");
  if (!title) return false;
  return (
    title.includes("vie chret") ||
    title.includes("vie chrét") ||
    title.includes("christian life") ||
    title.includes("vie et ministere") ||
    title.includes("vie et ministère")
  );
}

function sanitizeChristianLifeSection(section: RawSection): void {
  if (!section?.items) return;
  let nextNumber = 7;

  for (const item of section.items) {
    if (!item || typeof item === "string") continue;

    if (typeof item.title === "string") {
      item.title = stripLeadingNumber(item.title);
    }
    if (typeof item.theme === "string") {
      item.theme = stripLeadingNumber(item.theme);
    }

    const combined = norm(`${item.title || ""} ${item.theme || ""}`);
    const typeHint = norm(item.type || "");

    const isStudy = /etude biblique|étude biblique|congregation bible study/.test(combined) || typeHint.includes("study");
    if (isStudy) {
      item.type = item.type || "study";
      if (LANG === "fr") {
        item.title = "Étude biblique de l’assemblée";
      }
      item.numero = nextNumber++;
      continue;
    }

    const isTalk = typeHint.includes("discours") || /discours|discussion|talk/.test(combined);
    if (isTalk) {
      item.numero = nextNumber++;
    }
  }
}

function preprocessWeek(week: RawWeek): void {
  if (!Array.isArray(week.sections)) return;
  for (const section of week.sections) {
    if (isChristianLifeSection(section)) {
      sanitizeChristianLifeSection(section);
    }
  }
}

function guessType(title: string, text: string): VcmItem["type"] {
  const t = (title + " " + text).toLowerCase();
  if (t.includes("étude biblique") || t.includes("etude biblique") || t.includes("congregation bible study") || t.includes("study")) return "study";
  if (t.includes("lecture")) return "lecture";
  if (t.includes("prière") || t.includes("priere")) return "priere";
  if (t.includes("cantique") || t.includes("chant")) return "cantique";
  if (t.includes("démonstration") || t.includes("demonstration")) return "demonstration";
  if (t.includes("discours")) return "discours";
  return "autre";
}

function normalizeItemType(raw?: string): VcmItemType | undefined {
  if (!raw) return undefined;
  const t = raw.toLowerCase();
  if (t.includes("study") || t.includes("étude") || t.includes("etude")) return "study";
  if (t.includes("prière") || t.includes("priere") || t.includes("prayer")) return "priere";
  if (t.includes("cantique") || t.includes("song") || t.includes("chant")) return "cantique";
  if (t.includes("démonstration") || t.includes("demonstration") || t.includes("demo")) return "demonstration";
  if (t.includes("lecture") || t.includes("reading")) return "lecture";
  if (t.includes("discours") || t.includes("talk")) return "discours";
  return undefined;
}

function normalizeItem(raw: RawItem, sectionTitle: string): VcmItem {
  if (typeof raw === "string") {
    return {
      type: guessType(sectionTitle || "", raw),
      title: sectionTitle || "",
      theme: toTheme(raw),
      duration: extractDuration(raw),
      songNumber: extractSong(raw),
      scriptures: extractScriptures(raw),
      number: undefined,
    };
  }

  const theme = raw.theme || raw.title || "";
  const notes = Array.isArray(raw.notes) ? raw.notes.filter(Boolean) : undefined;
  const normalizedType = normalizeItemType(raw.type) || guessType(raw.title || sectionTitle || "", theme);

  return {
    type: normalizedType,
    title: raw.title || sectionTitle || "",
    theme,
    duration: typeof raw.duration === "number" ? raw.duration : undefined,
    songNumber: typeof raw.songNumber === "number" ? raw.songNumber : undefined,
    scriptures: raw.scriptures,
    notes,
    number: typeof raw.numero === "number" ? raw.numero : undefined,
  };
}

function normalizeSection(section: RawSection): VcmSection {
  const title = section.title || "";
  const key = (section.key as VcmSection["key"]) || mapKey(title);
  const items = (section.items || []).map((item) => normalizeItem(item, title));
  return { key, title, items };
}

const NUMBERED_SECTION_KEYS: ReadonlyArray<VcmSection["key"]> = [
  "joyaux",
  "ministere",
  "vie_chretienne",
];

function stripLeadingNumber(input: string): string {
  return (input || "").replace(/^\s*\d+\.\s*/, "").trim();
}

function normalizeForCompare(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function decorateSectionsForDisplay(sections: VcmSection[]): void {
  const numberedKeys = new Set(NUMBERED_SECTION_KEYS);
  let nextNumber = 1;

  for (const section of sections) {
    if (!numberedKeys.has(section.key)) continue;

    for (const item of section.items) {
      if (!item) continue;
      const originalTitle = item.title || "";
      const originalTheme = item.theme || "";

      if (section.key === "ministere") {
        item.number = undefined;
        item.title = originalTitle;
        item.theme = originalTheme;
        continue;
      }
      if (item.type === "cantique" || item.type === "priere") continue;

      let baseTitle = stripLeadingNumber(originalTitle);
      if (!baseTitle) {
        baseTitle = stripLeadingNumber(originalTheme);
      }
      if (!baseTitle) {
        baseTitle = section.title || originalTheme || "";
      }

      let currentNumber = typeof item.number === "number" && item.number > 0 ? item.number : undefined;
      if (!currentNumber || currentNumber < nextNumber) {
        currentNumber = nextNumber;
      }
      item.number = currentNumber;
      nextNumber = currentNumber + 1;

      if (section.key === "joyaux") {
        // Aucun changement d'affichage nécessaire pour les joyaux.
        continue;
      }

      const minutesPart = typeof item.duration === "number" && item.duration > 0 ? `(${item.duration} min)` : "";

      const isStudy = /étude\s+biblique\s+de\s+l['’]assemblée/i.test(originalTitle) || /étude\s+biblique\s+de\s+l['’]assemblée/i.test(originalTheme);
      if (isStudy) {
        const detail = originalTheme.trim() || baseTitle;
        const display = [detail, minutesPart].filter(Boolean).join(detail && minutesPart ? " " : "").trim();
        const finalText = display || baseTitle;
        item.title = baseTitle || "Étude biblique de l’assemblée";
        item.theme = finalText;
        continue;
      }

      const minutesSegment = minutesPart ? ` ${minutesPart}` : "";
      const sameAsBase = normalizeForCompare(originalTheme) === normalizeForCompare(baseTitle);
      const detailPart = !sameAsBase && originalTheme ? ` ${originalTheme.trim()}` : "";
      const display = `${baseTitle}${minutesSegment}${detailPart}`.replace(/\s+/g, " ").trim();

      item.title = baseTitle;
      item.theme = display;
    }
  }
}
function toTheme(text: string): string {
  return text
    .replace(/(\d{1,3}\s*(?:min|minutes)\b)/gi, "")
    .replace(/(?:cantique|chant)\s*(?:n[°ºo]\s*)?\d{1,3}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Normalisation ----------
function normalizeWeek(w: RawWeek): VcmWeek {
  const sourceUrl = w.sourceUrl || w.url || "";
  const dates = parseWeekDates(w.weekTitle, sourceUrl);
  const startDate = (w.startDate ?? dates.startDate) ?? null;
  const endDate = (w.endDate ?? dates.endDate) ?? null;
  const sections: VcmSection[] = (w.sections || []).map((section) => normalizeSection(section));

  decorateSectionsForDisplay(sections);

  return {
    weekTitle: w.weekTitle,
    weekTitleLocale: w.weekTitleLocale,
    startDate,
    endDate,
    issue: w.issue ?? null,
    sourceUrl,
    sections,
  };
}

// ---------- Main ----------
(function main() {
  try {
    log("Lancement de la normalisation...");
  const rawShape = readRawShape();
  const rawWeeks = extractWeeks(rawShape);
  log(`Semaines brutes: ${rawWeeks.length}`);
  rawWeeks.forEach(preprocessWeek);

  const weeks = rawWeeks.map(normalizeWeek);
    const out = { weeks };

    mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf-8");
    log("Normalisation terminée. Fichier de sortie généré :", OUT_FILE);
    if (LANG === 'fr') {
      mkdirSync(path.dirname(LEGACY_FR_OUTPUT), { recursive: true });
      writeFileSync(LEGACY_FR_OUTPUT, JSON.stringify(out, null, 2), "utf-8");
      log("Copie FR legacy mise à jour :", LEGACY_FR_OUTPUT);
    }
  } catch (e) {
    console.error("[VCM-Normalize] Erreur:", (e as Error).message);
    process.exit(1);
  }
})();
