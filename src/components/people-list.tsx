
'use client';

import React from 'react';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from './ui/scroll-area';
import { User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { mainFilters, roles } from '@/components/people-form';

interface PeopleListProps {
  people: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
  onNewPerson: () => void;
}

export function PeopleList({ people, selectedPerson, onSelectPerson, onNewPerson }: PeopleListProps) {
  // Add a check to ensure people is an array
  if (!Array.isArray(people)) {
    console.error("PeopleList received non-array people prop:", people);
    return null; // Or render a fallback UI
  }
  const { preachingGroups } = usePeople();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('all');
  const [selectedMainFilter, setSelectedMainFilter] = React.useState('all');
  const [selectedGroup, setSelectedGroup] = React.useState('all-groups');

  // Trier les personnes par ordre alphabétique du `displayName`
  const sortedPeople = [...people].sort((a, b) => a.displayName.localeCompare(b.displayName));

  const filteredPeople = sortedPeople.filter(p => {
    const nameMatch = p.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;

    const roleMatch = () => {
         if (selectedRole === 'all') return true;
         const [section, field] = selectedRole.split('.');
         return p.assignments && (p.assignments as any)[section] && (p.assignments as any)[section][field];
    };

    const mainFilterMatch = () => {
        const spiritual = p.spiritual;
        if (!spiritual) return false;

        switch(selectedMainFilter) {
            case 'all': return true;
            case 'families': return true; // This should be handled separately, maybe a different view.
            case 'all_publishers': return spiritual.function && ['publisher', 'servant', 'elder', 'unbaptized'].includes(spiritual.function);
            case 'active_publishers': return spiritual.active;
            case 'irregular_publishers': return spiritual.active && !spiritual.regular;
            case 'inactive_publishers': return !spiritual.active;
            case 'unbaptized_publishers': return spiritual.function === 'unbaptized';
            case 'not_publishers': return !spiritual.function;
            case 'baptized': return !!spiritual.baptismDate;
            case 'elders': return spiritual.function === 'elder';
            case 'servants': return spiritual.function === 'servant';
            case 'appointed_brothers': return p.gender === 'male' && (spiritual.function === 'elder' || spiritual.function === 'servant');
            case 'active_unappointed_brothers': return p.gender === 'male' && spiritual.active && !spiritual.function;
            case 'brothers': return p.gender === 'male';
            case 'sisters': return p.gender === 'female';
            case 'all_pioneers': return !!spiritual.pioneer.status;
            case 'regular_pioneers': return spiritual.pioneer.status === 'permanent';
            case 'auxiliary_pioneers': return spiritual.pioneer.status === 'aux-permanent';
            case 'special_pioneers': return spiritual.pioneer.status === 'special';
            case 'missionaries': return spiritual.pioneer.status === 'missionary';
            case 'group_overseers': return spiritual.roleInGroup === 'overseer';
            case 'group_assistants': return spiritual.roleInGroup === 'assistant';
            case 'family_heads': return p.isHeadOfFamily;
            case 'aged_or_infirm': return p.agedOrInfirm;
            case 'child': return p.child;
            case 'blind': return p.blind;
            case 'deaf': return p.deaf;
            case 'incarcerated': return p.incarcerated;
            case 'other_personal_info': return !!p.otherInfo;
            case 'anointed': return spiritual.anointed;
            case 'kh_key': return !!spiritual.kingdomHallKey;
            case 'tele_volunteer': return !!spiritual.teleVolunteerDate;
            case 'complex_volunteer': return !!spiritual.complexVolunteerDate;
            case 'bethel_volunteer': return !!spiritual.bethelVolunteerDate;
            case 'other_theocratic_info_4': return !!spiritual.otherInfo1;
            case 'other_theocratic_info_5': return !!spiritual.otherInfo2;
            case 'other_theocratic_info_6': return !!spiritual.otherInfo3;
            case 'custom_spiritual_7': return !!spiritual.customSpiritual7Date;
            case 'direct_reports': return spiritual.directReports;
            case 'sent_back': return spiritual.isDeleted;
            case 'deleted': return spiritual.isDeleted;
            case 'departed': return p.departed;
            default: return true;
        }
    };
    
    const groupMatch = () => {
        if (selectedGroup === 'all-groups') return true;
        return p.spiritual.group === selectedGroup;
    };

    return roleMatch() && mainFilterMatch() && groupMatch();
  });

  return (
    <Card className="h-full flex flex-col max-h-[calc(100vh-120px)]">
      <CardHeader className="flex flex-col items-start justify-between shrink-0">
        <div className="flex flex-row items-center justify-between w-full">
            <CardTitle>Personnes ({filteredPeople.length})</CardTitle>
            <Button onClick={onNewPerson}>Nouveau</Button>
        </div>
        <div className="p-2 space-y-2 border rounded-md w-full mt-2">
            <div className="grid grid-cols-2 gap-2">
                <Select value={selectedMainFilter} onValueChange={setSelectedMainFilter}>
                    <SelectTrigger><SelectValue placeholder="Filtre principal" /></SelectTrigger>
                    <SelectContent>
                       <ScrollArea className="h-[40vh]">
                           {Object.entries(mainFilters).map(([key, value]) => (
                                <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                       </ScrollArea>
                    </SelectContent>
                </Select>
                 <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
                    <SelectContent>
                         <ScrollArea className="h-[40vh]">
                             {Object.entries(roles).map(([key, value]) => (
                                <SelectItem key={key} value={key}>{value}</SelectItem>
                             ))}
                         </ScrollArea>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger><SelectValue placeholder="Groupe" /></SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[40vh]">
                            <SelectItem value="all-groups">Tous les groupes</SelectItem>
                            {preachingGroups
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-2">
                    <Input placeholder="Rechercher par nom" className="h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                 </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
            <div className="p-2">
            {filteredPeople.map((person) => (
                <Button
                key={person.id}
                variant={selectedPerson?.id === person.id ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => onSelectPerson(person)}
                >
                <User className="mr-2 h-4 w-4" />
                {person.displayName}
                </Button>
            ))}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
