
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Person } from '@/app/personnes/page';

interface Family {
    id: string;
    name: string;
}

interface PreachingGroup {
    id: string;
    name: string;
}

import { discourseList as initialDiscourseList, type Discourse } from '@/lib/discours-data';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';
import { apiFetch } from '@/lib/api-client';

interface PeopleContextType {
  people: Person[];
  isLoaded: boolean;
  addPerson: (person: Omit<Person, 'id'>) => Person;
  updatePerson: (person: Person) => void;
  deletePerson: (personId: string) => void;
  replacePeople: (updatedPeople: Person[]) => void;
  families: Family[];
  addFamily: (name: string) => Family;
  updateFamily: (familyId: string, newName: string) => void;
  deleteFamily: (familyId: string) => void;
  preachingGroups: PreachingGroup[];
  addPreachingGroup: (name: string) => PreachingGroup;
  updatePreachingGroup: (groupId: string, newName: string) => void;
  deletePreachingGroup: (groupId: string) => void;
  discourseList: Discourse[];
  updateDiscourseList: (newList: Discourse[]) => void;
  devices: PublisherDeviceRecord[];
  replaceDevices: (records: PublisherDeviceRecord[]) => void;
}

const PeopleContext = createContext<PeopleContextType>({
  people: [], // Valeur par défaut pour people
  isLoaded: false,
  addPerson: () => { throw new Error('PeopleProvider not found'); },
  updatePerson: () => { throw new Error('PeopleProvider not found'); },
  deletePerson: () => { throw new Error('PeopleProvider not found'); },
  replacePeople: () => { throw new Error('PeopleProvider not found'); },
  families: [],
  addFamily: () => { throw new Error('PeopleProvider not found'); },
  updateFamily: () => { throw new Error('PeopleProvider not found'); },
  deleteFamily: () => { throw new Error('PeopleProvider not found'); },
  preachingGroups: [],
  addPreachingGroup: () => { throw new Error('PeopleProvider not found'); },
  updatePreachingGroup: () => { throw new Error('PeopleProvider not found'); },
  deletePreachingGroup: () => { throw new Error('PeopleProvider not found'); },
  discourseList: [],
  updateDiscourseList: () => { throw new Error('PeopleProvider not found'); },
  devices: [],
  replaceDevices: () => { throw new Error('PeopleProvider not found'); },
});

export type PublisherDeviceRecord = {
  personId: string;
  deviceId: string;
  deviceModel: string;
  appVersion: string;
  expirationDate: string;
  personName?: string;
  email?: string;
  alert?: boolean;
};

const defaultDevices: PublisherDeviceRecord[] = [
  { personId: '669429', deviceId: 'DEV-001', personName: 'Jacob BEYA', deviceModel: 'iPhone', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '274610', deviceId: 'DEV-002', personName: 'Bernard BUKASA', deviceModel: 'TECNO MOBILE LIMITED TECNO BE7', appVersion: '3.7.12', expirationDate: '2025/12/05', alert: false },
  { personId: '927596', deviceId: 'DEV-003', personName: 'Nicha BUNSANGA', deviceModel: 'TECNO TECNO KI5k', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '565985', deviceId: 'DEV-004', personName: 'Papy BUNSANGA', deviceModel: 'Xiaomi 23053RN02A', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '125958', deviceId: 'DEV-005', personName: 'Augustine BWANGA', deviceModel: 'samsung SM-A065F', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '985411', deviceId: 'DEV-006', personName: 'Isaac BWANGA', deviceModel: 'iPhone', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '319114', deviceId: 'DEV-007', personName: 'Jessé BWANGA', deviceModel: 'TECNO MOBILE LIMITED TECNO KC8', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '363288', deviceId: 'DEV-008', personName: 'Marie José DIATEKILA', deviceModel: 'TECNO TECNO CL6k', appVersion: '3.7.18', expirationDate: '2025/11/11', alert: false },
  { personId: '372026', deviceId: 'DEV-009', personName: 'Michaël DIATEKILA', deviceModel: 'samsung SM-S911B', appVersion: '3.7.18', expirationDate: '2025/12/10', alert: false },
  { personId: '594653', deviceId: 'DEV-010', personName: 'Zacharie DIATEKILA', deviceModel: 'TECNO TECNO KJ5', appVersion: '3.7.18', expirationDate: '2025/12/10', alert: false },
  { personId: '515553', deviceId: 'DEV-011', personName: 'Dieudonné DIMBO', deviceModel: 'TECNO MOBILE LIMITED TECNO KC8', appVersion: '3.7.15', expirationDate: '2025/12/05', alert: false },
  { personId: '737800', deviceId: 'DEV-012', personName: 'Mireille DIMBO', deviceModel: 'ITEL itel A662L', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '785074', deviceId: 'DEV-013', personName: 'Christophe EFAMBE', deviceModel: 'samsung SM-S711B', appVersion: '3.7.18', expirationDate: '2025/12/05', alert: false },
  { personId: '592898', deviceId: 'DEV-014', personName: 'Galina EFAMBE', deviceModel: 'samsung SM-A137F', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '908065', deviceId: 'DEV-015', personName: 'Isabelle FATUMA', deviceModel: 'iPhone', appVersion: '3.7.18', expirationDate: '2025/12/05', alert: false },
  { personId: '267489', deviceId: 'DEV-016', personName: 'Claude ILANDA', deviceModel: 'TECNO MOBILE LIMITED TECNO KF6i', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '596493', deviceId: 'DEV-017', personName: 'Rachel ILELE', deviceModel: 'ITEL itel A662L', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '999289', deviceId: 'DEV-018', personName: 'Braslin ILUNGA', deviceModel: 'samsung SM-A065F', appVersion: '3.7.18', expirationDate: '2025/12/10', alert: false },
  { personId: '866929', deviceId: 'DEV-019', personName: 'Godé ILUNGA', deviceModel: 'TECNO MOBILE LIMITED TECNO KG6', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '427634', deviceId: 'DEV-020', personName: 'Didier INGINDIA', deviceModel: 'TECNO TECNO KI5k', appVersion: '3.7.18', expirationDate: '2025/12/05', alert: false },
  { personId: '508764', deviceId: 'DEV-021', personName: 'Dienne INGINDIA', deviceModel: 'samsung SM-225F', appVersion: '3.7.18', expirationDate: '2025/12/05', alert: false },
  { personId: '145137', deviceId: 'DEV-022', personName: 'Jonathan IYOMBE', deviceModel: 'samsung SM-M986U', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '340658', deviceId: 'DEV-023', personName: 'Gaddiel KABISALA', deviceModel: 'INFINIX Infinix X678B', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
  { personId: '438772', deviceId: 'DEV-024', personName: 'Nancy KABISALA', deviceModel: 'iPhone', appVersion: '3.7.18', expirationDate: '2025/12/05', alert: false },
  { personId: '998366', deviceId: 'DEV-025', personName: 'Michel KADIMA', deviceModel: 'TECNO TECNO CL6k', appVersion: '3.7.18', expirationDate: '2025/12/12', alert: false },
];
// When data is parsed from JSON, date strings need to be converted back to Date objects.
const reviveDates = (person: any): Person => {
    const dateFields = ['birthDate'];
    const spiritualDateFields = ['functionDate', 'baptismDate', 'preachingStartDate', 'lastVisitDate', 'teleVolunteerDate', 'complexVolunteerDate', 'bethelVolunteerDate', 'customSpiritual7Date'];
    const pioneerDateFields = ['date', 'schoolDate'];

    for (const field of dateFields) {
        if (person[field]) {
            person[field] = new Date(person[field]);
        }
    }

    if (person.spiritual) {
        for (const field of spiritualDateFields) {
            if (person.spiritual[field]) {
                person.spiritual[field] = new Date(person.spiritual[field]);
            }
        }
        if (person.spiritual.pioneer) {
            for (const field of pioneerDateFields) {
                if (person.spiritual.pioneer[field]) {
                    person.spiritual.pioneer[field] = new Date(person.spiritual.pioneer[field]);
                }
            }
        }
    }
    return person as Person;
};


export const PeopleProvider = ({ children }: { children: ReactNode }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [preachingGroups, setPreachingGroups] = useState<PreachingGroup[]>([]);
  const [discourseList, setDiscourseList] = useState<Discourse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [devices, setDevices] = useState<PublisherDeviceRecord[]>([]);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      const storedPeople = localStorage.getItem('people');
      if (storedPeople) {
        let parsedPeople = JSON.parse(storedPeople);
        // Ensure parsedPeople is an array before filtering and mapping
        if (!Array.isArray(parsedPeople)) {
            console.warn("Stored people data is not an array. Resetting to empty array.");
            parsedPeople = [];
        }
        // Clean up any "ghost" entries (people with no name)
        parsedPeople = parsedPeople.filter((p: Person) => p.displayName && p.displayName.trim() !== '');
        // Ensure all loaded people have a PIN
        parsedPeople = parsedPeople.map((p: Person) => {
            if (!p.pin) {
                return { ...p, pin: Math.floor(1000 + Math.random() * 9000).toString() };
            }
            return p;
        });
        setPeople(parsedPeople.map(reviveDates));
      }

      const storedFamilies = localStorage.getItem('families');
      if (storedFamilies) {
        setFamilies(JSON.parse(storedFamilies));
      }
      
      const storedGroups = localStorage.getItem('preachingGroups');
      if (storedGroups) {
        setPreachingGroups(JSON.parse(storedGroups));
      }

      const storedDevices = localStorage.getItem('publisherDevices');
      if (storedDevices) {
        setDevices(JSON.parse(storedDevices));
      } else {
        setDevices(defaultDevices);
      }

      const storedDiscourses = localStorage.getItem('discourseList');
      if (storedDiscourses) {
        setDiscourseList(JSON.parse(storedDiscourses));
      } else {
        setDiscourseList(initialDiscourseList);
      }

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
    setIsLoaded(true); // Mark as loaded
  }, []);

  // Charger la liste depuis l'API (fichier publisher-users) pour intégrer les mises à jour importées
  useEffect(() => {
    if (!isLoaded) return;
    const loadFromApi = async () => {
      try {
        // Load people
        const usersResponse = await apiFetch('api/publisher-app/users/export');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (Array.isArray(usersData.users) && usersData.users.length > 0) {
            setPeople(usersData.users.map(reviveDates));
          }
        }
        
        // Load families from API
        const familiesResponse = await apiFetch('api/families');
        if (familiesResponse.ok) {
          const familiesData = await familiesResponse.json();
          if (Array.isArray(familiesData.families) && familiesData.families.length > 0) {
            setFamilies(familiesData.families);
          }
        }
        
        // Load preaching groups from API
        const groupsResponse = await apiFetch('api/preaching-groups');
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          if (Array.isArray(groupsData.groups) && groupsData.groups.length > 0) {
            setPreachingGroups(groupsData.groups);
          }
        }
      } catch (error) {
        console.error('Failed to load data from API', error);
      }
    };
    loadFromApi();
  }, [isLoaded]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) { // Only save after initial data has been loaded
        try {
            localStorage.setItem('people', JSON.stringify(people));
            localStorage.setItem('families', JSON.stringify(families));
            localStorage.setItem('preachingGroups', JSON.stringify(preachingGroups));
            localStorage.setItem('discourseList', JSON.stringify(discourseList));
            localStorage.setItem('publisherDevices', JSON.stringify(devices));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }
  }, [people, families, preachingGroups, discourseList, devices, isLoaded]);

  // DÉSACTIVÉ: Synchroniser la liste vers l'API (pour Flutter) dès que les personnes changent
  // ATTENTION: Ceci écrasait publisher-users.json avec les données du localStorage
  // qui n'étaient pas complètes, causant la perte de données
  /*
  useEffect(() => {
    if (!isLoaded) return;
    const sync = async () => {
      try {
        setIsSyncingUsers(true);
        // Utiliser auto-sync pour créer automatiquement les jobs desktop_to_mobile
        const response = await apiFetch('api/publisher-app/auto-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: people }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auto-sync success:', data.message);
        } else {
          console.error('Auto-sync failed:', response.status);
        }
      } catch (error) {
        console.error('Sync users to Flutter failed', error);
      } finally {
        setIsSyncingUsers(false);
      }
    };
    sync();
  }, [people, isLoaded]);
  */

  // Synchroniser les familles vers l'API dès qu'elles changent
  useEffect(() => {
    if (!isLoaded || families.length === 0) return;
    const syncFamilies = async () => {
      try {
        await apiFetch('api/families', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ families }),
        });
      } catch (error) {
        console.error('Sync families to API failed', error);
      }
    };
    syncFamilies();
  }, [families, isLoaded]);

  // Synchroniser les groupes de prédication vers l'API dès qu'ils changent
  useEffect(() => {
    if (!isLoaded || preachingGroups.length === 0) return;
    const syncGroups = async () => {
      try {
        await apiFetch('api/preaching-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groups: preachingGroups }),
        });
      } catch (error) {
        console.error('Sync preaching groups to API failed', error);
      }
    };
    syncGroups();
  }, [preachingGroups, isLoaded]);

  const addPerson = (personData: Omit<Person, 'id'>): Person => {
    const newPerson: Person = {
      ...personData,
      id: `person-${Date.now()}`,
      pin: Math.floor(1000 + Math.random() * 9000).toString(), // Generate a random 4-digit PIN
    };
    setPeople(prevPeople => [...prevPeople, reviveDates(newPerson)]);
    
    // Créer un job de sync si la personne a des données importantes
    createSyncJobForPerson(newPerson);
    
    return newPerson;
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(prevPeople =>
      prevPeople.map(p => (p.id === updatedPerson.id ? reviveDates(updatedPerson) : p))
    );
    
    // Synchroniser l'activité vers publisher-preaching.json pour que la page "Activité de prédication" voie les modifications
    if (updatedPerson.activity && updatedPerson.activity.length > 0) {
      syncActivityToPreaching(updatedPerson.id, updatedPerson.activity);
    }
    
    // Créer un job de sync si la personne a des données importantes
    createSyncJobForPerson(updatedPerson);
  };
  
  // Fonction pour synchroniser l'activité vers publisher-preaching.json
  const syncActivityToPreaching = async (userId: string, activity: Person['activity']) => {
    try {
      await apiFetch('api/sync-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, activity }),
      });
    } catch (error) {
      console.error('Failed to sync activity to preaching:', error);
    }
  };
  
  // Fonction pour créer un job de synchronisation
  const createSyncJobForPerson = async (person: Person) => {
    try {
      const hasActivity = person.activity && person.activity.length > 0;
      const hasEmergencyContacts = person.emergency?.contacts && person.emergency.contacts.length > 0;
      
      if (hasActivity || hasEmergencyContacts) {
        await apiFetch('api/publisher-app/create-sync-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person }),
        });
      }
    } catch (error) {
      console.error('Failed to create sync job:', error);
    }
  };
  
  const deletePerson = (personId: string) => {
    setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
  };

  const replacePeople = (updatedPeople: Person[]) => {
  if (!Array.isArray(updatedPeople)) {
    console.warn('replacePeople called with non-array value');
    return;
  }
  setPeople(() => {
    const now = Date.now();
    return updatedPeople.map((incomingPerson, index) => {
      const rawId = typeof incomingPerson.id === 'string' ? incomingPerson.id : incomingPerson.id ? String(incomingPerson.id) : '';
      const ensuredId = rawId.trim() !== ''
        ? rawId
        : `person-${now}-${index}`;
      const rawPin = typeof incomingPerson.pin === 'string' ? incomingPerson.pin : incomingPerson.pin ? String(incomingPerson.pin) : '';
      const ensuredPin = rawPin.trim() !== ''
        ? rawPin
        : Math.floor(1000 + Math.random() * 9000).toString();

      return reviveDates({
        ...incomingPerson,
        id: ensuredId,
        pin: ensuredPin,
      });
    });
  });
  };

  const addFamily = (name: string): Family => {
    const newFamily = { id: `fam-${Date.now()}`, name };
    setFamilies(prev => [...prev, newFamily]);
    return newFamily;
  };

  const updateFamily = (familyId: string, newName: string) => {
    setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, name: newName } : f));
  };

  const deleteFamily = (familyId: string) => {
    // Keep people intact; just remove family associations and the family itself
    setPeople(prev => prev.map(p => p.familyId === familyId ? { ...p, familyId: null } : p));
    setFamilies(prev => prev.filter(f => f.id !== familyId));
  };

  const addPreachingGroup = (name: string): PreachingGroup => {
    const newGroup = { id: `group-${Date.now()}`, name };
    setPreachingGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  const updatePreachingGroup = (groupId: string, newName: string) => {
    setPreachingGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
    // Mettre à jour aussi le groupName dans les personnes assignées à ce groupe
    setPeople(prevPeople => 
      prevPeople.map(p => {
        if (p.spiritual.group === groupId) {
          return { ...p, spiritual: { ...p.spiritual, groupName: newName } };
        }
        return p;
      })
    );
  };

  const deletePreachingGroup = (groupId: string) => {
    // Also unassign people from this group
    setPeople(prevPeople => 
        prevPeople.map(p => {
            if (p.spiritual.group === groupId) {
                return { ...p, spiritual: { ...p.spiritual, group: null } };
            }
            return p;
        })
    );
    setPreachingGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const updateDiscourseList = (newList: Discourse[]) => {
    setDiscourseList(newList);
  };

  const replaceDevices = (records: PublisherDeviceRecord[]) => {
    setDevices(records);
  };


  return (
    <PeopleContext.Provider value={{ people, isLoaded, addPerson, updatePerson, deletePerson, replacePeople, families, addFamily, updateFamily, deleteFamily, preachingGroups, addPreachingGroup, updatePreachingGroup, deletePreachingGroup, discourseList, updateDiscourseList, devices, replaceDevices }}>
      {children}
    </PeopleContext.Provider>
  );
};

export const usePeople = (): PeopleContextType => {
  const context = useContext(PeopleContext);
  if (context === undefined) {
    throw new Error('usePeople must be used within a PeopleProvider');
  }
  return context;
};
