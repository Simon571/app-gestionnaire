
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

export const mockPublisherUsers: PublisherUser[] = [];
