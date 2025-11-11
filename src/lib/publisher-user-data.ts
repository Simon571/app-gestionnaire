
export type PublisherDevice = {
  id: string;
  model: string;
  osVersion: string;
  appVersion: string;
  lastSync: Date;
};

export type PublisherUser = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  pin: string;
  delegate?: string;
  status: 'Actif' | 'Inactif' | 'Non connecté';
  group: string;
  devices: PublisherDevice[];
};

export const mockPublisherUsers: PublisherUser[] = [
  {
    id: 'USR-001',
    lastName: 'Martin',
    firstName: 'Jean',
    email: 'jean.martin@example.com',
    pin: '1234',
    status: 'Actif',
    group: 'Groupe 1',
    delegate: 'Sophie Dubois',
    devices: [
      { id: 'DEV-A1', model: 'iPhone 14', osVersion: 'iOS 17.5', appVersion: '2.1.0', lastSync: new Date('2024-07-09T10:00:00Z') },
      { id: 'DEV-A2', model: 'iPad Pro', osVersion: 'iPadOS 17.5', appVersion: '2.1.0', lastSync: new Date('2024-07-09T11:30:00Z') },
    ],
  },
  {
    id: 'USR-002',
    lastName: 'Bernard',
    firstName: 'Lucie',
    email: 'lucie.bernard@example.com',
    pin: '5678',
    status: 'Actif',
    group: 'Groupe 2',
    devices: [
      { id: 'DEV-B1', model: 'Galaxy S23', osVersion: 'Android 14', appVersion: '2.0.5', lastSync: new Date('2024-07-08T20:15:00Z') },
    ],
  },
  {
    id: 'USR-003',
    lastName: 'Dubois',
    firstName: 'Sophie',
    email: 'sophie.dubois@example.com',
    pin: '9012',
    status: 'Inactif',
    group: 'Groupe 1',
    devices: [],
  },
  {
    id: 'USR-004',
    lastName: 'Petit',
    firstName: 'Thomas',
    email: 'thomas.petit@example.com',
    pin: '3456',
    status: 'Non connecté',
    group: 'Groupe 3',
    devices: [],
  },
    {
    id: 'USR-005',
    lastName: 'Garcia',
    firstName: 'Paul',
    email: 'paul.garcia@example.com',
    pin: '7890',
    status: 'Actif',
    group: 'Groupe 2',
    devices: [
      { id: 'DEV-C1', model: 'Pixel 8', osVersion: 'Android 14', appVersion: '2.1.0', lastSync: new Date('2024-07-09T08:45:00Z') },
    ],
  },
  {
    id: 'USR-006',
    lastName: 'Lefebvre',
    firstName: 'Chloé',
    email: 'chloe.lefebvre@example.com',
    pin: '1122',
    status: 'Non connecté',
    group: 'Groupe 1',
    devices: [],
  },
];
