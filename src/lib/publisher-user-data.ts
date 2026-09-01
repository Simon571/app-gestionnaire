
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
  /**
   * Fonction dans l'assemblee, telle qu'enregistree sur la fiche de la personne.
   * Le type l'omettait alors que les donnees la portent depuis longtemps ; elle
   * determine desormais les droits de la session (`elder`, `servant`, sinon
   * proclamateur).
   */
  spiritual?: {
    function?: string;
    [key: string]: unknown;
  };
};

export const mockPublisherUsers: PublisherUser[] = [];
