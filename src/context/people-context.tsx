
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
import { getApiBase } from '@/lib/api-base';

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

const defaultDevices: PublisherDeviceRecord[] = [];
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

  // Version-based cache clear: when the app version changes, clear old cached data
  // This prevents stale personal data from persisting across MSI upgrades or web deployments
  const APP_DATA_VERSION = '2.0.0'; // Bump this to force a cache clear on next load

  // Load data from localStorage on initial mount
  useEffect(() => {
    try {
      // Check if the data version has changed — if so, clear all cached data
      const storedVersion = localStorage.getItem('appDataVersion');
      if (storedVersion !== APP_DATA_VERSION) {
        console.log(`App data version changed (${storedVersion} → ${APP_DATA_VERSION}). Clearing cached data.`);
        localStorage.removeItem('people');
        localStorage.removeItem('families');
        localStorage.removeItem('preachingGroups');
        localStorage.removeItem('publisherDevices');
        localStorage.removeItem('discourseList');
        localStorage.setItem('appDataVersion', APP_DATA_VERSION);
        // Don't load anything — start fresh
        setIsLoaded(true);
        return;
      }

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
        // Dédupliquer par ID (évite la triplication si des cycles de sync ont dupliqué les entrées)
        const seenIds = new Set<string>();
        parsedPeople = parsedPeople.filter((p: Person) => {
          if (!p.id || seenIds.has(p.id)) return false;
          seenIds.add(p.id);
          return true;
        });
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

  // Charger la liste depuis l'API uniquement si localStorage EST VIDE (évite d'écraser les données locales).
  // En mode MSI (PORTAL_MODE=0), le MSI EST la source de vérité → on ne charge jamais depuis l'API.
  useEffect(() => {
    if (!isLoaded) return;
    if (process.env.NEXT_PUBLIC_PORTAL_MODE === '0') return; // MSI : source de vérité locale
    if (people.length > 0) return; // localStorage avait déjà des données → ne pas écraser avec le Blob
    const loadFromApi = async () => {
      try {
        const apiBase = getApiBase();
        // Récupérer l'assemblyId pour ne charger QUE les utilisateurs de cette assemblée
        let assemblyId = 'DEFAULT';
        try {
          const raw = localStorage.getItem('appSettings');
          if (raw) assemblyId = (JSON.parse(raw) as Record<string, string>)?.assemblyId || 'DEFAULT';
        } catch (_) {}
        // Load people — filtré par assemblyId pour éviter de charger d'autres assemblées
        const usersResponse = await fetch(`${apiBase}/api/publisher-app/users/export?assemblyId=${assemblyId}`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (Array.isArray(usersData.users) && usersData.users.length > 0) {
            setPeople(usersData.users.map(reviveDates));
          }
        }
        
        // Load families from API
        const familiesResponse = await fetch(`${apiBase}/api/families`);
        if (familiesResponse.ok) {
          const familiesData = await familiesResponse.json();
          if (Array.isArray(familiesData.families) && familiesData.families.length > 0) {
            setFamilies(familiesData.families);
          }
        }
        
        // Load preaching groups from API
        const groupsResponse = await fetch(`${apiBase}/api/preaching-groups`);
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

  // Synchroniser la liste vers publisher-users.json (lu par Flutter) dès que les personnes changent.
  // On utilise un délai de 2 secondes pour ne pas surcharger l'API à chaque frappe clavier.
  useEffect(() => {
    if (!isLoaded || people.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        setIsSyncingUsers(true);
        const apiBase = getApiBase();
        // Lire l'assemblyId depuis les paramètres de l'application (localStorage)
        let assemblyId = '';
        try {
          const raw = localStorage.getItem('appSettings');
          if (raw) assemblyId = (JSON.parse(raw) as Record<string, unknown>)?.['assemblyId'] as string ?? '';
        } catch (_) {}
        if (!assemblyId) {
          // Aucun assemblyId configuré → utiliser 'DEFAULT' comme identifiant d'assemblée
          assemblyId = 'DEFAULT';
        }
        const response = await fetch(`${apiBase}/api/publisher-app/users/web-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: people, assemblyId }),
        });
        if (!response.ok) {
          console.error('web-sync failed:', response.status);
        }
      } catch (error) {
        console.error('Sync users to Flutter failed', error);
      } finally {
        setIsSyncingUsers(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [people, isLoaded]);

  // Synchroniser les familles vers l'API dès qu'elles changent
  useEffect(() => {
    if (!isLoaded || families.length === 0) return;
    const syncFamilies = async () => {
      try {
        const apiBase = getApiBase();
        await fetch(`${apiBase}/api/families`, {
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
        const apiBase = getApiBase();
        await fetch(`${apiBase}/api/preaching-groups`, {
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
      const apiBase = getApiBase();
      await fetch(`${apiBase}/api/sync-activity`, {
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
        const apiBase = getApiBase();
        await fetch(`${apiBase}/api/publisher-app/create-sync-job`, {
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
