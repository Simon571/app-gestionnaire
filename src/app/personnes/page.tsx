'use client';

import { PeopleList } from '@/components/people-list';
import { PeopleForm } from '@/components/people-form';
import { usePeople } from '@/context/people-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, RefreshCw } from 'lucide-react';
import React from 'react';
import { apiFetch } from '@/lib/api-client';

export type ActivityReport = {
  month: string; // "YYYY-MM"
  participated: boolean;
  bibleStudies: number | null;
  isAuxiliaryPioneer: boolean;
  hours: number | null;
  credit: number | null;
  isLate: boolean;
  remarks: string;
}

export type EmergencyContact = {
    id: string;
    name: string;
    isCongregationMember: boolean;
    mobile: string;
    phone: string;
    email: string;
    relationship: string;
    notes: string;
}

export type Person = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  displayName: string;
  homePhone: string;
  mobilePhone: string;
  workPhone: string;
  address: string;
  linkFamily: boolean;
  latitude: string;
  longitude: string;
  email1: string;
  email2: string;
  pin?: string;
  gender: 'male' | 'female' | null;
  birthDate?: Date;
  familyId: string | null;
  isHeadOfFamily: boolean;
  other: boolean;
  child: boolean;
  otherInfo: string;
  agedOrInfirm: boolean;
  deaf: boolean;
  blind: boolean;
  incarcerated: boolean;
  disableAppAccess: boolean;
  deletePersonalInfo: boolean;
  notes: string;
  absences: any[]; // Define a proper type later
  departed: boolean;
  activity: ActivityReport[];
  spiritual: {
      group: string | null;
      groupName: string | null;
      roleInGroup: 'member' | 'overseer' | 'assistant';
      functionDate?: Date;
      function: 'elder' | 'servant' | 'publisher' | 'unbaptized' | null;
      baptismDate?: Date;
      preachingStartDate?: Date;
      lastVisitDate?: Date;
      pioneer: {
          status: 'aux-permanent' | 'permanent' | 'special' | 'missionary' | null;
          date?: Date;
          sfl: boolean;
          schoolDate?: Date;
      },
      active: boolean;
      regular: boolean;
      tgPaper: boolean;
      cvmPaper: boolean;
      anointed: boolean;
      kingdomHallKey: string | null;
      teleVolunteerDate?: Date;
      complexVolunteerDate?: Date;
      bethelVolunteerDate?: Date;
      customSpiritual7Date?: Date;
      otherInfo1: string;
      otherInfo2: string;
      otherInfo3: string;
      directReports: boolean;
      noLocalReport: boolean;
      isDeleted: boolean;
  };
  assignments: {
    gems: {
        president: boolean;
        prayers: boolean;
        spiritualGems: boolean;
        secondaryRoomCounselor: boolean;
        talks: boolean;
        bibleReading: boolean;
    };
    ministry: {
        student: boolean;
        firstContact: boolean;
        returnVisit: boolean;
        bibleStudy: boolean;
        explainBeliefs: boolean;
        hall: string;
        interlocutor: boolean;
        discourse: boolean;
        languageGroupOnly: boolean;
        engageConversation: boolean;
        maintainInterest: boolean;
        makeDisciples: boolean;
    };
    christianLife: {
        interventions: boolean;
        congregationBibleStudy: boolean;
        reader: boolean;
    };
    weekendMeeting: {
        localSpeaker: boolean;
        externalSpeaker: boolean;
        discourseNumbers: string;
        frequency: string;
        president: boolean;
        finalPrayer: boolean;
        hospitality: boolean;
        wtReader: boolean;
        orateur2: boolean;
        groupLangueUniquement: boolean;
    };
    preaching: {
        publicWitnessing: boolean;
        leadMeetings: boolean;
        substituteDriver: string;
        keyPerson: boolean;
        meetingPrayers: boolean;
    };
    services: {
        meeting: string;
        attendanceCount: boolean;
        doorAttendant: boolean;
        soundSystem: boolean;
        rovingMic: boolean;
        stageMic: boolean;
        sanitary: boolean;
        hallAttendant: boolean;
        mainDoorAttendant: boolean;
        customService1: boolean;
        customService1Label: string;
        maintenance: boolean;
        doorAttendantAlt: boolean;
        stageMicAlt: boolean;
        hallAttendantAlt: boolean;
        mainDoorAttendantAlt: boolean;
    };
    cleaning: {
        hallCleaning: boolean;
        hallCleaningAfterMeeting: boolean;
        customCleaning1: boolean;
        customCleaning1Label: string;
        customCleaning2: boolean;
        customCleaning2Label: string;
        greenSpaces: boolean;
        lawn: boolean;
    }
  };
  emergency: {
      personName: string;
      notes: string;
      disasterAccommodations: boolean;
      contacts: EmergencyContact[];
  };
  sharingPermissions?: {
    [key: string]: 'edit' | 'view' | 'none';
  }
};

const createPersonFromName = (name: string, _index: number): Person => {
    const trimmedName = name.trim();
    const tokens = trimmedName.split(/\s+/).filter(Boolean);
    const firstName = tokens[0] || trimmedName;
    const lastName = tokens.length > 1 ? tokens[tokens.length - 1] : '';
    const middleName = tokens.length > 2 ? tokens.slice(1, -1).join(' ') : '';

    return {
        id: '',
        firstName,
        middleName,
        lastName,
        suffix: '',
        displayName: trimmedName,
        homePhone: '',
        mobilePhone: '',
        workPhone: '',
        address: '',
        linkFamily: false,
        latitude: '',
        longitude: '',
        email1: '',
        email2: '',
        gender: null,
        birthDate: undefined,
        familyId: null,
        isHeadOfFamily: false,
        other: false,
        child: false,
        otherInfo: '',
        agedOrInfirm: false,
        deaf: false,
        blind: false,
        incarcerated: false,
        disableAppAccess: false,
        deletePersonalInfo: false,
        notes: '',
        absences: [],
        departed: false,
        activity: [],
        spiritual: {
            group: null,
            groupName: null,
            roleInGroup: 'member',
            functionDate: undefined,
            function: null,
            baptismDate: undefined,
            preachingStartDate: undefined,
            lastVisitDate: undefined,
            pioneer: {
                status: null,
                date: undefined,
                sfl: false,
                schoolDate: undefined,
            },
            active: false,
            regular: false,
            tgPaper: false,
            cvmPaper: false,
            anointed: false,
            kingdomHallKey: null,
            teleVolunteerDate: undefined,
            complexVolunteerDate: undefined,
            bethelVolunteerDate: undefined,
            customSpiritual7Date: undefined,
            otherInfo1: '',
            otherInfo2: '',
            otherInfo3: '',
            directReports: false,
            noLocalReport: false,
            isDeleted: false,
        },
        assignments: {
            gems: {
                president: false,
                prayers: false,
                spiritualGems: false,
                secondaryRoomCounselor: false,
                talks: false,
                bibleReading: false,
            },
            ministry: {
                student: false,
                firstContact: false,
                returnVisit: false,
                bibleStudy: false,
                explainBeliefs: false,
                hall: '',
                interlocutor: false,
                discourse: false,
                languageGroupOnly: false,
                engageConversation: false,
                maintainInterest: false,
                makeDisciples: false,
            },
            christianLife: {
                interventions: false,
                congregationBibleStudy: false,
                reader: false,
            },
            weekendMeeting: {
                localSpeaker: false,
                externalSpeaker: false,
                discourseNumbers: '',
                frequency: '',
                president: false,
                finalPrayer: false,
                hospitality: false,
                wtReader: false,
                orateur2: false,
                groupLangueUniquement: false,
            },
            preaching: {
                publicWitnessing: false,
                leadMeetings: false,
                substituteDriver: '',
                keyPerson: false,
                meetingPrayers: false,
            },
            services: {
                meeting: '',
                attendanceCount: false,
                doorAttendant: false,
                soundSystem: false,
                rovingMic: false,
                stageMic: false,
                sanitary: false,
                hallAttendant: false,
                mainDoorAttendant: false,
                customService1: false,
                customService1Label: '',
                maintenance: false,
                doorAttendantAlt: false,
                stageMicAlt: false,
                hallAttendantAlt: false,
                mainDoorAttendantAlt: false,
            },
            cleaning: {
                hallCleaning: false,
                hallCleaningAfterMeeting: false,
                customCleaning1: false,
                customCleaning1Label: '',
                customCleaning2: false,
                customCleaning2Label: '',
                greenSpaces: false,
                lawn: false,
            },
        },
        emergency: {
            personName: '',
            notes: '',
            disasterAccommodations: false,
            contacts: [],
        },
        sharingPermissions: {},
    };
};

const parsePeopleImport = (content: string): Person[] => {
    try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
            throw new Error('JSON must be an array');
        }

        if (parsed.every(item => typeof item === 'string')) {
            return (parsed as string[])
                .map(name => name.trim())
                .filter(name => name.length > 0)
                .map((name, index) => createPersonFromName(name, index));
        }

        const hasInvalidEntry = parsed.some(item => {
            if (!item || typeof item !== 'object') {
                return true;
            }
            const personCandidate = item as Partial<Person>;
            return typeof personCandidate.displayName !== 'string' || personCandidate.displayName.trim() === '';
        });

        if (hasInvalidEntry) {
            throw new Error('Invalid person entry detected');
        }

        return parsed as Person[];
    } catch (jsonError) {
        const names = content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => !/^liste\s+des\s+proclameurs?/i.test(line));

        if (names.length === 0) {
            throw jsonError;
        }

        return names.map((name, index) => createPersonFromName(name, index));
    }
};


export default function PeoplePage() {
    const { people, addPerson, updatePerson, deletePerson, replacePeople } = usePeople();
    const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);
    const [activeTab, setActiveTab] = React.useState('informations');
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Utiliser un état local pour la liste des personnes
    const [peopleList, setPeopleList] = React.useState<Person[]>([]);

    React.useEffect(() => {
        // Mettre à jour l'état local lorsque les personnes du contexte changent
        if (Array.isArray(people)) {
            setPeopleList(people);
        } else {
            // Si people n'est pas un tableau (ce qui ne devrait pas arriver après nos corrections),
            // initialiser avec un tableau vide pour éviter les erreurs.
            setPeopleList([]);
        }
    }, [people]); // Dépendance à la variable people du contexte

    console.log("People in PeoplePage (from context):", people);
    console.log("PeopleList (local state):", peopleList);

    const handleSavePerson = (personData: Omit<Person, 'id'> & { id?: string }) => {
        if (personData.id) {
            updatePerson(personData as Person);
            toast({
                title: "Mise à jour réussie",
                description: `Les informations de ${personData.displayName} ont été mises à jour.`,
            });
        } else {
            const newPerson = addPerson(personData);
            setSelectedPerson(newPerson); // Select the newly created person
            setActiveTab('informations');
            toast({
                title: "Personne ajoutée",
                description: `${newPerson.displayName} a été ajouté(e) à la liste.`,
            });
        }
    };

    const handleNewPerson = () => {
        setSelectedPerson(null);
        setActiveTab('informations');
    }
    
    const handleDeletePerson = () => {
        if(selectedPerson) {
            const name = selectedPerson.displayName;
            deletePerson(selectedPerson.id);
            setSelectedPerson(null);
            setActiveTab('informations');
            toast({
                title: "Personne supprimée",
                description: `${name} a été supprimé(e) de la liste.`,
                variant: "destructive",
            });
        }
    }

    const handleSelectPerson = (person: Person) => {
        setSelectedPerson(person);
        // Reset tab to 'informations' each time a new person is selected
        setActiveTab('informations');
    };

    const handleExportPeople = () => {
        try {
            const serialized = JSON.stringify(peopleList, null, 2);
            const blob = new Blob([serialized], { type: 'application/json' });
            const downloadUrl = URL.createObjectURL(blob);
            const tempLink = document.createElement('a');
            tempLink.href = downloadUrl;
            tempLink.download = `personnes-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            URL.revokeObjectURL(downloadUrl);
            toast({
                title: "Export terminé",
                description: `${peopleList.length} personne(s) exportée(s) avec succès.`,
            });
        } catch (error) {
            console.error('Failed to export people list', error);
            toast({
                title: "Erreur d'export",
                description: "Impossible d'exporter la liste des personnes.",
                variant: 'destructive',
            });
        }
    };

    const handleImportButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportPeople = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error('File content is not text');
                }
                const importedPeople = parsePeopleImport(content);

                replacePeople(importedPeople);
                setSelectedPerson(null);
                setActiveTab('informations');
                toast({
                    title: "Import réussi",
                    description: `${importedPeople.length} personne(s) importée(s) avec succès.`,
                });
            } catch (error) {
                console.error('Failed to import people list', error);
                toast({
                    title: "Erreur d'import",
                    description: "Le fichier sélectionné est invalide ou corrompu.",
                    variant: 'destructive',
                });
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file, 'utf-8');
    };

    const handleSyncFromPublisherApp = async () => {
        try {
            const response = await apiFetch('api/sync-publisher-users-to-people');
            if (!response.ok) {
                throw new Error('Échec de la synchronisation');
            }

            const data = await response.json();
            const publisherUsers = data.people || [];

            // Fusionner avec les personnes existantes (ne pas écraser)
            const existingIds = new Set(peopleList.map(p => p.id));
            const newPeople = publisherUsers.filter((p: Person) => !existingIds.has(p.id));

            if (newPeople.length > 0) {
                const merged = [...peopleList, ...newPeople];
                replacePeople(merged);
                toast({
                    title: "Synchronisation réussie",
                    description: `${newPeople.length} nouvelle(s) personne(s) importée(s) depuis Publisher App.`,
                });
            } else {
                toast({
                    title: "Aucune nouvelle personne",
                    description: "Tous les utilisateurs Publisher App sont déjà dans la liste.",
                });
            }
        } catch (error) {
            console.error('Sync from publisher app failed:', error);
            toast({
                title: "Erreur de synchronisation",
                description: "Impossible de synchroniser depuis Publisher App.",
                variant: 'destructive',
            });
        }
    };

    const handleRepairPublisherApp = async () => {
        try {
            // Envoyer les données du localStorage vers publisher-users.json
            const response = await apiFetch('api/repair-publisher-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ people: peopleList }),
            });

            if (!response.ok) {
                throw new Error('Échec de la réparation');
            }

            const data = await response.json();
            toast({
                title: "Réparation réussie",
                description: `${data.count} utilisateur(s) synchronisé(s) vers Publisher App avec groupes.`,
            });
        } catch (error) {
            console.error('Repair publisher app failed:', error);
            toast({
                title: "Erreur de réparation",
                description: "Impossible de réparer Publisher App. Vérifiez la console.",
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6 p-4 min-h-screen">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-3xl font-bold">Personnes</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={handleRepairPublisherApp} className="flex items-center gap-2 bg-orange-50">
                            <RefreshCw className="h-4 w-4 text-orange-600" />
                            <span className="text-orange-600">Réparer Publisher App</span>
                        </Button>
                        <Button variant="outline" onClick={handleSyncFromPublisherApp} className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Sync Publisher App
                        </Button>
                        <Button variant="outline" onClick={handleImportButtonClick} className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Importer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportPeople}
                            disabled={peopleList.length === 0}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Exporter
                        </Button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,text/plain,.json,.txt"
                        className="hidden"
                        onChange={handleImportPeople}
                    />
                </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div>
                    <PeopleList 
                        people={peopleList}
                        selectedPerson={selectedPerson}
                        onSelectPerson={handleSelectPerson}
                        onNewPerson={handleNewPerson}
                    />
                </div>

                <div className="lg:col-span-2">
                    <PeopleForm 
                        key={selectedPerson?.id || 'new'} // Add key to force re-render
                        selectedPerson={selectedPerson}
                        onSave={handleSavePerson}
                        onNew={handleNewPerson}
                        onDelete={handleDeletePerson}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
            </div>
        </div>
    );
}
