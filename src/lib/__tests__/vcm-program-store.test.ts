/**
 * computeCoverage : c'est ce calcul qui decide si l'utilisateur voit un
 * avertissement « cahier a mettre a jour ». Une erreur ici et le programme
 * s'epuise en silence — exactement la panne constatee (donnees arretees au
 * 31 aout alors que la semaine du 31 aout etait en cours).
 */
import { describe, it, expect } from 'vitest';
import { computeCoverage } from '@/lib/vcm-program-store';
import type { VcmWeek } from '@/lib/vcmTypes';

/** Lundi de la semaine contenant `date`, au format ISO court. */
function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

function week(start: Date): VcmWeek {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    weekTitle: `Semaine du ${iso(start)}`,
    startDate: iso(start),
    endDate: iso(end),
    sourceUrl: '',
    sections: [],
  };
}

/** `count` semaines consecutives a partir du lundi de `now`. */
function weeksFrom(now: Date, count: number): VcmWeek[] {
  const first = mondayOf(now);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(first);
    start.setDate(start.getDate() + index * 7);
    return week(start);
  });
}

const now = new Date(2026, 8, 1); // mardi 1er septembre 2026

describe('computeCoverage', () => {
  it('signale un magasin vide', () => {
    const coverage = computeCoverage(null, now);
    expect(coverage.weekCount).toBe(0);
    expect(coverage.weeksAhead).toBe(0);
    expect(coverage.missingCurrentWeek).toBe(true);
    expect(coverage.stale).toBe(true);
    expect(coverage.lastWeek).toBeNull();
  });

  it('considere perime un cahier qui s arrete a la semaine en cours', () => {
    // Le cas reel : la derniere semaine est celle qu on est en train de vivre,
    // donc il n y a plus rien pour preparer la reunion suivante.
    const coverage = computeCoverage({ weeks: weeksFrom(now, 1) }, now);
    expect(coverage.missingCurrentWeek).toBe(false);
    expect(coverage.weeksAhead).toBe(1);
    expect(coverage.stale).toBe(true);
  });

  it('considere a jour un cahier couvrant plusieurs semaines a venir', () => {
    const coverage = computeCoverage({ weeks: weeksFrom(now, 6) }, now);
    expect(coverage.weekCount).toBe(6);
    expect(coverage.weeksAhead).toBe(6);
    expect(coverage.missingCurrentWeek).toBe(false);
    expect(coverage.stale).toBe(false);
  });

  it('detecte une semaine en cours manquante malgre des semaines futures', () => {
    const all = weeksFrom(now, 4);
    const coverage = computeCoverage({ weeks: all.slice(1) }, now);
    expect(coverage.missingCurrentWeek).toBe(true);
    expect(coverage.stale).toBe(false);
  });

  it('ignore les semaines sans date de debut', () => {
    const weeks = [...weeksFrom(now, 3), { ...week(mondayOf(now)), startDate: null }];
    const coverage = computeCoverage({ weeks }, now);
    expect(coverage.weekCount).toBe(3);
  });

  it('remonte les horodatages du fichier', () => {
    const coverage = computeCoverage(
      { weeks: weeksFrom(now, 3), scrapedAt: '2026-09-01T04:17:00.000Z', storedAt: '2026-09-01T04:20:00.000Z' },
      now
    );
    expect(coverage.scrapedAt).toBe('2026-09-01T04:17:00.000Z');
    expect(coverage.storedAt).toBe('2026-09-01T04:20:00.000Z');
  });
});
