
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

export const mockTerritories: Territory[] = [
  {
    id: 'T001',
    number: '001',
    location: 'Centre-ville Nord',
    status: 'Attribué',
    assignee: 'Jean Dupont',
    assignmentDate: new Date('2024-05-10'),
    lastWorkedDate: new Date('2024-06-15'),
    type: 'Présentiel',
    notes: 'Secteur résidentiel avec quelques commerces.',
  },
  {
    id: 'T002',
    number: '002',
    location: 'Quartier des Fleurs',
    status: 'En cours',
    assignee: 'Marie Martin',
    assignmentDate: new Date('2024-04-20'),
    lastWorkedDate: new Date('2024-07-01'),
    type: 'Présentiel',
    notes: 'Beaucoup de jeunes familles.',
  },
  {
    id: 'T003',
    number: '003',
    location: 'Les Hauts-Plateaux',
    status: 'Terminé',
    assignee: 'Paul Garcia',
    assignmentDate: new Date('2024-01-15'),
    completionDate: new Date('2024-05-25'),
    lastWorkedDate: new Date('2024-05-20'),
    type: 'Présentiel',
    notes: 'Territoire terminé avec succès.',
  },
  {
    id: 'T004',
    number: '004',
    location: 'Zone Industrielle',
    status: 'Non attribué',
    type: 'Courrier',
    notes: 'Principalement des entreprises, à faire par courrier.',
  },
  {
    id: 'T005',
    number: '005',
    location: 'Sud-Est Rural',
    status: 'En retard',
    assignee: 'Lucie Bernard',
    assignmentDate: new Date('2023-11-01'),
    lastWorkedDate: new Date('2024-01-10'),
    type: 'Présentiel',
    notes: 'Territoire vaste, nécessite une voiture.',
  },
  {
    id: 'T006',
    number: '006',
    location: 'Lignes téléphoniques 1-500',
    status: 'Non travaillé',
    type: 'Téléphonique',
    notes: 'Nouveau bloc de numéros à appeler.',
  },
  {
    id: 'T007',
    number: '007',
    location: 'Centre-ville Sud',
    status: 'Attribué',
    assignee: 'Jean Dupont',
    assignmentDate: new Date('2024-07-05'),
    type: 'Présentiel',
    notes: 'Immeubles de grande hauteur.',
  },
    {
    id: 'T008',
    number: '008',
    location: 'Quartier Ouest',
    status: 'En cours',
    assignee: 'Sophie Lefebvre',
    assignmentDate: new Date('2024-06-01'),
    lastWorkedDate: new Date('2024-07-02'),
    type: 'Présentiel',
    notes: '',
  },
  {
    id: 'T009',
    number: '009',
    location: 'Collines Vertes',
    status: 'Terminé',
    assignee: 'Pierre Dubois',
    assignmentDate: new Date('2024-02-10'),
    completionDate: new Date('2024-06-18'),
    lastWorkedDate: new Date('2024-06-15'),
    type: 'Présentiel',
    notes: 'Bien couvert.',
  },
  {
    id: 'T010',
    number: '010',
    location: 'Nouveaux Appartements',
    status: 'Non attribué',
    type: 'Présentiel',
    notes: 'Complexe résidentiel récemment construit.',
  },
];
