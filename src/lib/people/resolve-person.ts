import type { Person } from '@/app/personnes/page';

export function createPeopleById(people: Person[]) {
  return new Map(people.map((p) => [p.id, p] as const));
}

export function findPersonIdByDisplayName(people: Person[], displayName: string): string | undefined {
  const normalized = displayName.trim().toLocaleLowerCase('fr');
  if (!normalized) return undefined;

  const match = people.find((p) => p.displayName.trim().toLocaleLowerCase('fr') === normalized);
  return match?.id;
}

export function resolvePersonDisplayName(
  peopleById: Map<string, Person>,
  personIdOrName: string | undefined | null
): string {
  if (!personIdOrName) return '';
  const byId = peopleById.get(personIdOrName);
  return byId?.displayName ?? personIdOrName;
}
