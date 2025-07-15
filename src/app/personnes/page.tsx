

'use client';

import { PeopleForm } from '@/components/people-form';
import { usePeople } from '@/context/people-context';
import React from 'react';

export type ActivityReport = {
  month: string; // "YYYY-MM"
  participated: boolean;
  bibleStudies: number | null;
  isAuxiliaryPioneer: boolean;
  hours: number | null;
  credit: boolean;
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
  }
};


export default function PeoplePage() {
    const { people, addPerson, updatePerson, deletePerson } = usePeople();
    const [selectedPerson, setSelectedPerson] = React.useState<Person | null>(null);

    const handleSavePerson = (personData: Omit<Person, 'id'> & { id?: string }) => {
        if (personData.id) {
            updatePerson(personData as Person);
        } else {
            const newPerson = addPerson(personData);
            setSelectedPerson(newPerson);
        }
    };

    const handleNewPerson = () => {
        setSelectedPerson(null);
    }
    
    const handleDeletePerson = () => {
        if(selectedPerson) {
            deletePerson(selectedPerson.id);
            setSelectedPerson(null);
        }
    }

    return <PeopleForm 
        people={people} 
        selectedPerson={selectedPerson}
        onSelectPerson={setSelectedPerson}
        onSave={handleSavePerson}
        onNew={handleNewPerson}
        onDelete={handleDeletePerson}
    />;
}
