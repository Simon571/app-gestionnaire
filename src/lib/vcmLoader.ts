import { JoyeauxData, MinistryAssignment, ChristianLifePart, CongregationBibleStudy, FinalPrayer } from "@/components/vcm/FullMeetingBlock";
import { parseISO, isWithinInterval, endOfDay } from 'date-fns';

// Types reflecting vcm-program.normalized.json structure
type VcmItem = {
  type: string;
  title: string;
  theme: string;
  duration?: number;
  songNumber?: number;
  scriptures?: string;
};
type VcmSection = {
  key: string;
  title: string;
  items: VcmItem[];
};
type VcmWeekRaw = {
  weekTitle: string;
  startDate: string | null;
  endDate: string | null;
  sourceUrl: string;
  sections: VcmSection[];
};
type VcmProgram = {
  weeks: VcmWeekRaw[];
};

// User-defined MwbWeek type
export type MinistryAssignmentType = "engage_conversation" | "entretiens_interet" | "explique_croyances" | "discours" | "aucun";

export type MwbWeek = {
  dateISO: string;
  sourceUrl: string;
  discours: { title: string; minutes: string };
  perles:   { minutes: string };
  lecture:  { title: string; minutes: string };
  ministry: Array<{ type: MinistryAssignmentType; title: string; minutes: string }>;
  living:   Array<{ title: string; minutes: string }>;
  study:    { title: string; minutes: string };
};

// Resolve best URL for VCM JSON depending on locale
async function fetchVcmProgram(): Promise<VcmProgram | null> {
  const langs: string[] = [];
  try {
    const htmlLang = typeof document !== 'undefined' ? (document.documentElement.lang || '').slice(0,2) : '';
    const navLang = typeof navigator !== 'undefined' ? (navigator.language || '').slice(0,2) : '';
    [htmlLang, navLang].forEach(l => { if (l && !langs.includes(l)) langs.push(l); });
  } catch {}
  if (!langs.length) langs.push('fr');

  const candidates: string[] = [];
  for (const l of langs) {
    candidates.push(`/vcm/${l}/vcm-program.normalized.json`);
  }
  // Legacy FR path for backward compatibility
  candidates.push('/vcm/vcm-program.normalized.json');

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }
  console.error('Failed to fetch any VCM program JSON from candidates:', candidates);
  return null;
}

// Main function to fetch and process VCM data
export type LoadMatch = 'exact' | 'nearest';

export async function loadVcmForDate(selectedDate: Date, opts?: { allowNearest?: boolean }): Promise<{ week: MwbWeek | null; matchedFrom?: LoadMatch }> {
  try {
    const program = await fetchVcmProgram();
    if (!program) return { week: null };
    
    const targetWeekRaw = program.weeks.find(week => {
        if (!week.startDate || !week.endDate) return false;
        const interval = { start: parseISO(week.startDate), end: endOfDay(parseISO(week.endDate)) };
        return isWithinInterval(selectedDate, interval);
    });

    if (targetWeekRaw) {
      return { week: mapRawWeekToMwbWeek(targetWeekRaw), matchedFrom: 'exact' };
    }

    if (opts?.allowNearest) {
      // Cherche la semaine la plus proche dans le même mois/année, sinon globale
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const candidates = program.weeks.filter(w => w.startDate && w.endDate).map(w => ({
        raw: w,
        start: parseISO(w.startDate!),
        end: endOfDay(parseISO(w.endDate!)),
      }));
      const sameMonth = candidates.filter(c => c.start.getMonth() === month && c.start.getFullYear() === year);
      const pool = (sameMonth.length ? sameMonth : candidates);
      let best = null as null | typeof pool[number];
      let bestDist = Number.POSITIVE_INFINITY;
      for (const c of pool) {
        // distance en jours au début de la semaine
        const dist = Math.abs((+c.start) - (+selectedDate));
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      if (best) {
        console.warn('VCM week exact match not found; using nearest:', best.raw.weekTitle);
        return { week: mapRawWeekToMwbWeek(best.raw), matchedFrom: 'nearest' };
      }
    }

    console.warn(`No VCM data found for selected week: ${selectedDate}`);
    return { week: null };
  } catch (error) {
    console.error("Error loading or parsing VCM data:", error);
    return { week: null };
  }
}

// Mapper function to transform a raw VCM week into the MwbWeek shape
function buildMinistryTitle(item: VcmItem): string {
  const label = (item.title || '').trim();
  const detail = (item.theme || '').trim();
  if (label && detail) {
    const detailLower = detail.toLowerCase();
    if (detailLower.startsWith(label.toLowerCase())) {
      return detail;
    }
    return `${label} — ${detail}`;
  }
  return label || detail || '';
}

function buildStudyDetail(item: VcmItem): string {
  const theme = (item.theme || '').trim();
  const withoutNumber = theme.replace(/^\s*\d+\.\s*/, '').trim();
  const durationTail = withoutNumber.match(/\(\d+\s*min\)[\s\S]*/i);
  if (durationTail) {
    return durationTail[0].trim();
  }
  const withoutLabel = withoutNumber.replace(/^étude\s+biblique\s+de\s+l['’]assemblée[:\s-]*/i, '').trim();
  return withoutLabel || withoutNumber || theme;
}

function mapRawWeekToMwbWeek(weekRaw: VcmWeekRaw): MwbWeek {
    const mwbWeek: MwbWeek = {
        dateISO: weekRaw.startDate || '',
        sourceUrl: weekRaw.sourceUrl,
        discours: { title: '', minutes: '' },
        perles: { minutes: '' },
        lecture: { title: '', minutes: '' },
        ministry: [],
        living: [],
        study: { title: '', minutes: '' },
    };

  for (const section of weekRaw.sections) {
    if (section.key === 'joyaux') {
      let pearlsSet = false;
      for (const item of section.items) {
        const theme = (item.theme || '').toLowerCase();
        const isDiscours = item.type === 'discours' || theme.includes('discours') || theme.includes('talk');
        const isGems = /perles\s+spirituelles|spiritual\s+gems/i.test(theme);
        const isBibleReading = /lecture\s+de\s+la\s+bible|bible\s+reading/i.test(theme);

        if (isDiscours) {
          mwbWeek.discours = { title: item.theme || '', minutes: (item.duration ?? 0).toString() };
        } else if (isGems) {
          mwbWeek.perles = { minutes: (item.duration ?? 0).toString() };
          pearlsSet = true;
        } else if (isBibleReading) {
          mwbWeek.lecture = { title: item.theme || '', minutes: (item.duration ?? 0).toString() };
        }
      }
      // Fallback perles: si non détecté explicitement, prendre le premier item pertinent non discours/lecture/cantique/prière
      if (!mwbWeek.perles.minutes) {
        const fallback = section.items.find(it => {
        const t = (it.theme || '').toLowerCase();
        const notSong = it.type !== 'cantique' && !/cantique|chant|song/i.test(t);
        const notPrayer = it.type !== 'priere' && !/prière|priere|prayer/i.test(t);
        const notLecture = it.type !== 'lecture' && !/lecture|bible\s+reading/i.test(t);
        const notTalk = it.type !== 'discours' && !/discours|talk/i.test(t);
        return notSong && notPrayer && notLecture && notTalk && (it.duration ?? 0) > 0;
        });
        if (fallback) {
        mwbWeek.perles = { minutes: (fallback.duration ?? 0).toString() };
        }
      }
    } else if (section.key === 'ministere') {
      mwbWeek.ministry = section.items
        .filter(item => item.type !== 'cantique')
        .map(item => ({
          type: guessMinistryType(item.theme) || 'aucun',
          title: buildMinistryTitle(item),
      minutes: (item.duration ?? 0).toString(),
        }));
    } else if (section.key === 'vie_chretienne') {
            for (const item of section.items) {
        const theme = (item.theme || '').toLowerCase();
        const isStudy = /étude\s+biblique|congregation\s+bible\s+study/i.test(theme);
        const isPrayer = /prière|priere|prayer/i.test(theme);
        const isSong = item.type === 'cantique' || /cantique|chant|song/i.test(theme);

        if (isStudy) {
          mwbWeek.study = { title: buildStudyDetail(item), minutes: (item.duration ?? 0).toString() };
        } else if (!isSong && !isPrayer) {
                    mwbWeek.living.push({
                        title: item.theme || '',
            minutes: (item.duration ?? 0).toString(),
                    });
                }
            }
        }
    }

    return mwbWeek;
}

function guessMinistryType(theme: string): MinistryAssignmentType | null {
  const t = (theme || '').toLowerCase();
  if (t.includes('conversation') || t.includes('first call') || t.includes('conversation starter')) return 'engage_conversation';
  if (t.includes('intérêt') || t.includes('interet') || t.includes('nouvelle visite') || t.includes('return visit')) return 'entretiens_interet';
  if (t.includes('croyances') || t.includes('enseigner') || t.includes('teach the truth') || t.includes('explain')) return 'explique_croyances';
  if (t.includes('discours') || t.includes('talk')) return 'discours';
  return 'aucun';
}