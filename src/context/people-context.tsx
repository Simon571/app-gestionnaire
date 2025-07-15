
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Person } from '@/app/personnes/page';

interface Family {
    id: string;
    name: string;
}

interface PeopleContextType {
  people: Person[];
  addPerson: (person: Omit<Person, 'id'>) => Person;
  updatePerson: (person: Person) => void;
  deletePerson: (personId: string) => void;
  families: Family[];
  addFamily: (name: string) => Family;
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined);

export const PeopleProvider = ({ children }: { children: ReactNode }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);

  const addPerson = (personData: Omit<Person, 'id'>): Person => {
    const newPerson: Person = {
      ...personData,
      id: `person-${Date.now()}`
    };
    setPeople(prevPeople => [...prevPeople, newPerson]);
    return newPerson;
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(prevPeople =>
      prevPeople.map(p => (p.id === updatedPerson.id ? updatedPerson : p))
    );
  };
  
  const deletePerson = (personId: string) => {
    setPeople(prevPeople => prevPeople.filter(p => p.id !== personId));
  };

  const addFamily = (name: string): Family => {
    const newFamily = { id: `fam-${Date.now()}`, name };
    setFamilies(prev => [...prev, newFamily]);
    return newFamily;
  };


  return (
    <PeopleContext.Provider value={{ people, addPerson, updatePerson, deletePerson, families, addFamily }}>
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
