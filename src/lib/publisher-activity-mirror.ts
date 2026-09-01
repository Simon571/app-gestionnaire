/**
 * publisher-activity-mirror.ts
 * Recopie un rapport de service dans `publisher-users.json`, tableau `activity[]`.
 *
 * L'application mobile lit l'activite depuis la fiche du proclamateur, pas
 * depuis le magasin de rapports : sans cette recopie, un rapport envoye
 * n'apparait jamais comme envoye sur le telephone.
 *
 * Cette logique etait dupliquee dans `activity/route.ts` (POST et PATCH) et dans
 * `mobile-reports/route.ts`, a chaque fois via un `fs.writeFile` direct sur
 * `data/publisher-users.json`. Cela contournait le magasin, donc le
 * cloisonnement par assemblee, et echouait sur Vercel dont le systeme de
 * fichiers est en lecture seule. On passe desormais par le magasin.
 */
import { readPublisherUsers, writePublisherUsers } from '@/lib/publisher-users-store';
import type { PreachingReportRecord } from '@/lib/publisher-preaching-store';

export interface ActivityEntry {
  month: string;
  participated: boolean;
  bibleStudies: number | null;
  isAuxiliaryPioneer: boolean;
  hours: number | null;
  credit: number | null;
  isLate: boolean;
  remarks: string;
}

function toActivityEntry(record: PreachingReportRecord): ActivityEntry {
  const hours = record.totals?.hours ?? null;
  return {
    month: record.month,
    // « A participe » se deduit des heures quand elles sont renseignees, sinon
    // de la case cochee par le proclamateur.
    participated: hours !== null ? hours > 0 : record.didPreach ?? false,
    bibleStudies: record.totals?.bibleStudies ?? null,
    isAuxiliaryPioneer: Boolean(
      (record.meta as Record<string, unknown> | undefined)?.['isAuxiliaryPioneer']
    ),
    hours,
    credit: record.totals?.credit ?? null,
    isLate: record.isLate ?? false,
    remarks: '',
  };
}

/**
 * Met a jour l'activite du proclamateur concerne. Retourne `false` si la fiche
 * est introuvable ou si l'ecriture echoue : l'appelant ne doit pas perdre le
 * rapport pour autant, il est deja enregistre dans le magasin de rapports.
 */
export async function mirrorReportToPublisherUser(
  record: PreachingReportRecord
): Promise<boolean> {
  try {
    const users = await readPublisherUsers();
    const index = users.findIndex((user) => String(user['id'] ?? '') === record.userId);
    if (index < 0) return false;

    const user = { ...users[index] };
    const activity = Array.isArray(user['activity'])
      ? [...(user['activity'] as ActivityEntry[])]
      : [];
    const entry = toActivityEntry(record);
    const existing = activity.findIndex((item) => item?.month === record.month);
    if (existing >= 0) {
      activity[existing] = { ...activity[existing], ...entry };
    } else {
      activity.push(entry);
    }

    user['activity'] = activity;
    users[index] = user;
    await writePublisherUsers(users);
    return true;
  } catch (error) {
    console.error('publisher-activity-mirror: recopie impossible', error);
    return false;
  }
}
