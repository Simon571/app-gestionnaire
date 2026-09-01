/**
 * publish-vcm.ts
 * Depose le programme Vie chretienne et ministere fraichement extrait dans
 * l'application deployee, via POST /api/vcm/program.
 *
 * C'est la deuxieme moitie de la mise a jour continue. L'extraction
 * (`npm run vcm:update:fr`) doit tourner sur un vrai runtime Node : elle
 * telecharge les publications .jwpub et les analyse avec
 * `meeting-schedules-parser`. Elle ne peut donc pas vivre dans une fonction
 * serverless. Elle produit un fichier, ce script le publie, et l'application
 * n'a plus qu'a le servir — sans redeploiement.
 *
 * Usage :
 *   npx tsx scripts/publish-vcm.ts --lang=fr
 *   npx tsx scripts/publish-vcm.ts --lang=fr --url=https://mon-app.vercel.app
 *
 * Variables d'environnement :
 *   VCM_PUBLISH_URL   URL de base de l'application (defaut : http://localhost:3000)
 *   API_ACCESS_TOKEN  jeton de service, envoye dans x-api-token
 */
import { readFile } from 'fs/promises';
import path from 'path';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const lang = (arg('lang') || process.env.VCM_LANG || 'fr').toLowerCase();
  const baseUrl = (
    arg('url') ||
    process.env.VCM_PUBLISH_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const token = (process.env.API_ACCESS_TOKEN || '').trim();

  if (token.length < 16) {
    console.error(
      'API_ACCESS_TOKEN absent ou trop court (16 caracteres minimum).\n' +
        "Le depot serait refuse par l'API."
    );
    process.exit(1);
  }

  // On publie la version normalisee, celle que les clients savent lire.
  const candidates = [
    path.join(process.cwd(), 'public', 'vcm', lang, 'vcm-program.normalized.json'),
    path.join(process.cwd(), 'public', 'vcm', 'vcm-program.normalized.json'),
  ];

  let payload: Record<string, unknown> | null = null;
  let usedPath = '';
  for (const candidate of candidates) {
    try {
      payload = JSON.parse(await readFile(candidate, 'utf8'));
      usedPath = candidate;
      break;
    } catch {
      // Candidat suivant.
    }
  }

  if (!payload || !Array.isArray(payload.weeks) || payload.weeks.length === 0) {
    console.error(
      `Aucun programme exploitable trouve pour la langue "${lang}".\n` +
        `Executer d'abord : npm run vcm:update:${lang}`
    );
    process.exit(1);
  }

  const weeks = payload.weeks as Array<{ startDate?: string | null }>;
  const starts = weeks
    .map((week) => week.startDate)
    .filter((value): value is string => Boolean(value))
    .sort();

  console.log(
    `[VCM] ${usedPath}\n` +
      `[VCM] ${weeks.length} semaines, du ${starts[0] ?? '?'} au ${starts[starts.length - 1] ?? '?'}`
  );

  const response = await fetch(`${baseUrl}/api/vcm/program`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': token,
    },
    body: JSON.stringify({ ...payload, lang }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(`[VCM] Echec HTTP ${response.status} :`, result);
    process.exit(1);
  }

  console.log('[VCM] Publie.', result.coverage ?? '');
}

main().catch((error) => {
  console.error('[VCM] Erreur inattendue :', error);
  process.exit(1);
});
