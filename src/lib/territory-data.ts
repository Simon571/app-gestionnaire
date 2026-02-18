
export type Territory = {
  id: string;
  number: string;
  location: string;
  status: 'Attribué' | 'Non attribué' | 'Terminé' | 'En cours' | 'Non travaillé' | 'En retard';
  /** Legacy (display name). Prefer assigneePersonId when possible. */
  assignee?: string;
  /** Preferred stable reference to a person. */
  assigneePersonId?: string;
  assignmentDate?: Date;
  completionDate?: Date;
  lastWorkedDate?: Date;
  type: 'Présentiel' | 'Téléphonique' | 'Courrier';
  notes: string;
};

export const mockTerritories: Territory[] = [];
