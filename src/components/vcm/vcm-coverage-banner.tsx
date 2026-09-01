'use client';

/**
 * VcmCoverageBanner
 * Avertit quand le cahier « Vie chretienne et ministere » n'est plus a jour.
 *
 * Le probleme constate : le programme livre s'arretait a la semaine du
 * 31 aout 2026 et personne ne le voyait — la page affichait simplement
 * « aucun programme trouve », sans dire pourquoi ni quoi faire. Le magasin
 * calcule desormais une couverture ; ce bandeau la rend visible.
 *
 * Il ne s'affiche que lorsqu'il y a quelque chose a signaler : semaine en cours
 * non couverte, ou moins de deux semaines de marge.
 */
import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { loadVcmCoverage } from '@/lib/vcmLoader';

type Coverage = Awaited<ReturnType<typeof loadVcmCoverage>>;

function frenchDate(iso: string | null): string {
  if (!iso) return '?';
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function VcmCoverageBanner() {
  const [coverage, setCoverage] = React.useState<Coverage>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadVcmCoverage()
      .then((value) => {
        if (!cancelled) setCoverage(value);
      })
      .catch(() => {
        // Un bandeau d'avertissement ne doit jamais casser la page qu'il coiffe.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!coverage) return null;
  if (!coverage.stale && !coverage.missingCurrentWeek) return null;

  const message = coverage.missingCurrentWeek
    ? `La semaine en cours n'est pas couverte : le cahier s'arrete au ${frenchDate(coverage.lastWeek)}.`
    : `Il ne reste que ${coverage.weeksAhead} semaine${coverage.weeksAhead > 1 ? 's' : ''} de programme, jusqu'au ${frenchDate(coverage.lastWeek)}.`;

  return (
    <div
      role="status"
      className="no-print flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">Cahier à mettre à jour</p>
        <p>{message}</p>
        <p className="text-amber-800">
          La mise à jour hebdomadaire automatique s’en charge normalement. Pour la
          déclencher tout de suite : <code>npm run vcm:refresh</code>.
        </p>
      </div>
    </div>
  );
}

export default VcmCoverageBanner;
