
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Mail,
  Printer,
  Ban,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { discourseList as initialDiscourseList, type Discourse } from '@/lib/discours-data';

type ScheduleRow = {
  id: number;
  date: Date;
  orateur: string | null;
  assemblee: string;
  discours: string;
  isExternal: boolean;
  isCancelled: boolean;
  president: string | null;
  lecteur: string | null;
  priere: string | null;
  orateur2: string | null;
  hospitalite: string | null;
};

const generateInitialSchedule = (): ScheduleRow[] => {
  const schedule: ScheduleRow[] = [];
  let currentDate = new Date();
  for (let i = 0; i < 52; i++) {
    schedule.push({
      id: i,
      date: new Date(currentDate),
      orateur: null,
      assemblee: '',
      discours: '',
      isExternal: false,
      isCancelled: false,
      president: null,
      lecteur: null,
      priere: null,
      orateur2: null,
      hospitalite: null
    });
    currentDate.setDate(currentDate.getDate() + 7);
  }
  return schedule;
};

type AssignmentType = 
    | 'weekendMeeting.localSpeaker'
    | 'weekendMeeting.president'
    | 'weekendMeeting.wtReader'
    | 'weekendMeeting.finalPrayer'
    | 'weekendMeeting.orateur2'
    | 'weekendMeeting.hospitality';


const ParticipantSelect = ({
  people,
  assignment,
  value,
  onValueChange,
  allSchedules,
  currentWeekDate,
}: {
  people: Person[];
  assignment: AssignmentType;
  value: string | null | undefined;
  onValueChange: (value: string | undefined) => void;
  allSchedules: ScheduleRow[];
  currentWeekDate: Date;
}) => {
  const getAssignmentEligibility = (person: Person, assignmentType: AssignmentType) => {
    if (!person.assignments) return false;
    const [section, field] = assignmentType.split('.');
    return person.assignments[section as keyof Person['assignments']]?.[field as keyof any];
  };

  const findLastAssignmentDate = (personId: string, assignmentType: AssignmentType) => {
    let mostRecentDate: Date | null = null;
    
    allSchedules.forEach(schedule => {
        if (schedule.date >= currentWeekDate) return;
        
        let assigned = false;
        switch(assignmentType) {
            case 'weekendMeeting.localSpeaker': assigned = schedule.orateur === personId; break;
            case 'weekendMeeting.president': assigned = schedule.president === personId; break;
            case 'weekendMeeting.wtReader': assigned = schedule.lecteur === personId; break;
            case 'weekendMeeting.finalPrayer': assigned = schedule.priere === personId; break;
            case 'weekendMeeting.orateur2': assigned = schedule.orateur2 === personId; break;
            case 'weekendMeeting.hospitality': assigned = schedule.hospitalite === personId; break;
        }
        
        if (assigned) {
            if (!mostRecentDate || schedule.date > mostRecentDate) {
                mostRecentDate = schedule.date;
            }
        }
    });
    return mostRecentDate;
  };

  const sortedPeople = React.useMemo(() => {
    const today = new Date();
    return people
      .filter(p => getAssignmentEligibility(p, assignment))
      .map(p => {
        const lastDate = findLastAssignmentDate(p.id, assignment);
        return {
          ...p,
          lastAssignmentDate: lastDate,
          daysSinceLastAssignment: lastDate ? differenceInDays(today, lastDate) : Infinity,
        };
      })
      .sort((a, b) => b.daysSinceLastAssignment - a.daysSinceLastAssignment);
  }, [people, assignment, allSchedules, currentWeekDate]);

  return (
    <Select value={value || 'aucun'} onValueChange={(v) => onValueChange(v === 'aucun' ? undefined : v)}>
      <SelectTrigger className="bg-white h-8 w-full">
        <SelectValue placeholder="Sélectionner" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="aucun">Aucun</SelectItem>
        {sortedPeople.map(p => (
          <SelectItem key={p.id} value={p.id}>
            {p.displayName}
            {p.lastAssignmentDate ? (
              <span className="text-muted-foreground ml-2 text-xs">
                - {format(p.lastAssignmentDate, 'dd/MM/yy', { locale: fr })}
              </span>
            ) : (
               <span className="text-muted-foreground ml-2 text-xs">- Jamais</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const FamilySelect = ({
  value,
  onValueChange,
  allSchedules,
  currentWeekDate,
}: {
  value: string | null | undefined;
  onValueChange: (value: string | undefined) => void;
  allSchedules: ScheduleRow[];
  currentWeekDate: Date;
}) => {
  const { families } = usePeople();

  const findLastAssignmentDate = (familyId: string) => {
    let mostRecentDate: Date | null = null;
    
    allSchedules.forEach(schedule => {
        if (schedule.date >= currentWeekDate) return;
        
        if (schedule.hospitalite === familyId) {
            if (!mostRecentDate || schedule.date > mostRecentDate) {
                mostRecentDate = schedule.date;
            }
        }
    });
    return mostRecentDate;
  };

  const sortedFamilies = React.useMemo(() => {
    const today = new Date();
    return families
      .map(f => {
        const lastDate = findLastAssignmentDate(f.id);
        return {
          ...f,
          lastAssignmentDate: lastDate,
          daysSinceLastAssignment: lastDate ? differenceInDays(today, lastDate) : Infinity,
        };
      })
      .sort((a, b) => b.daysSinceLastAssignment - a.daysSinceLastAssignment);
  }, [families, allSchedules, currentWeekDate]);

  return (
    <Select value={value || 'aucune'} onValueChange={(v) => onValueChange(v === 'aucune' ? undefined : v)}>
      <SelectTrigger className="bg-white h-8 w-full">
        <SelectValue placeholder="Sélectionner une famille" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="aucune">Aucune</SelectItem>
        {sortedFamilies.map(f => (
          <SelectItem key={f.id} value={f.id}>
            {f.name}
            {f.lastAssignmentDate ? (
              <span className="text-muted-foreground ml-2 text-xs">
                - {format(f.lastAssignmentDate, 'dd/MM/yy', { locale: fr })}
              </span>
            ) : (
               <span className="text-muted-foreground ml-2 text-xs">- Jamais</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default function DiscoursPublicsLocalPage() {
    const { people } = usePeople();
    const [scheduleData, setScheduleData] = React.useState(generateInitialSchedule);
    const [selectedWeekIndex, setSelectedWeekIndex] = React.useState<number>(0);
    const [discourseList, setDiscourseList] = React.useState<Discourse[]>(initialDiscourseList);
    
    const selectedWeek = scheduleData[selectedWeekIndex];

    const handleFieldChange = (field: keyof Omit<ScheduleRow, 'id' | 'date'>, value: any) => {
        const newSchedule = [...scheduleData];
        (newSchedule[selectedWeekIndex] as any)[field] = value;
        setScheduleData(newSchedule);
    };

    const handleTableRowClick = (index: number) => {
      setSelectedWeekIndex(index);
    }
    
    const handleNavigation = (direction: 'up' | 'down') => {
        if (direction === 'up' && selectedWeekIndex > 0) {
            setSelectedWeekIndex(selectedWeekIndex - 1);
        } else if (direction === 'down' && selectedWeekIndex < scheduleData.length - 1) {
            setSelectedWeekIndex(selectedWeekIndex + 1);
        }
    }

    return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-primary">Discours publics - Local</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('up')}><ChevronUp className="h-5 w-5"/></Button>
            <span className="font-bold text-red-600 text-lg">{selectedWeek.date.toLocaleDateString('fr-CA')}</span>
            <Button variant="ghost" size="icon" onClick={() => handleNavigation('down')}><ChevronDown className="h-5 w-5"/></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div className="space-y-2 col-span-1 lg:col-span-2">
                 <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <Label htmlFor="orateur">Orateur</Label>
                     <ParticipantSelect
                        people={people}
                        assignment="weekendMeeting.localSpeaker"
                        value={selectedWeek.orateur}
                        onValueChange={(id) => handleFieldChange('orateur', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <Label htmlFor="discours">Discours</Label>
                    <Select value={selectedWeek.discours} onValueChange={(val) => handleFieldChange('discours', val)}>
                        <SelectTrigger id="discours" className="h-8 bg-white">
                            <SelectValue placeholder="Sélectionner un discours" />
                        </SelectTrigger>
                        <SelectContent>
                             {discourseList.map((discourse) => (
                                <SelectItem key={discourse.number} value={discourse.number.toString()} disabled={discourse.title.includes('(Ne pas utiliser)')}>
                                  {discourse.number}. {discourse.title}
                                </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input id="notes" className="h-8 bg-white" />
                </div>
            </div>

            <div className="space-y-2 text-sm">
                 <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label htmlFor="president">Président</Label>
                     <ParticipantSelect
                        people={people}
                        assignment="weekendMeeting.president"
                        value={selectedWeek.president}
                        onValueChange={(id) => handleFieldChange('president', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label htmlFor="lecteur">Lecteur Tour de Garde</Label>
                    <ParticipantSelect
                        people={people}
                        assignment="weekendMeeting.wtReader"
                        value={selectedWeek.lecteur}
                        onValueChange={(id) => handleFieldChange('lecteur', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
                 <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label htmlFor="priere">Prière de fin</Label>
                     <ParticipantSelect
                        people={people}
                        assignment="weekendMeeting.finalPrayer"
                        value={selectedWeek.priere}
                        onValueChange={(id) => handleFieldChange('priere', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
                 <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label htmlFor="orateur2">Orateur 2</Label>
                     <ParticipantSelect
                        people={people}
                        assignment="weekendMeeting.orateur2"
                        value={selectedWeek.orateur2}
                        onValueChange={(id) => handleFieldChange('orateur2', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
                 <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <Label htmlFor="hospitalite">Hospitalité</Label>
                     <FamilySelect
                        value={selectedWeek.hospitalite}
                        onValueChange={(id) => handleFieldChange('hospitalite', id)}
                        allSchedules={scheduleData}
                        currentWeekDate={selectedWeek.date}
                     />
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Mail className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Printer className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Ban className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Users className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><Calendar className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full">
            <Table>
            <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Orateur</TableHead>
                <TableHead>Assemblée</TableHead>
                <TableHead>Discours public</TableHead>
                <TableHead className="w-8 p-1 text-center"><Checkbox /></TableHead>
                <TableHead>Président</TableHead>
                <TableHead>Lecteur Tour de G</TableHead>
                <TableHead>Prière de fin</TableHead>
                <TableHead>Orateur 2</TableHead>
                <TableHead>Hospitalité</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {scheduleData.map((row, index) => {
                  const orateur = people.find(p => p.id === row.orateur);
                  const president = people.find(p => p.id === row.president);
                  const lecteur = people.find(p => p.id === row.lecteur);
                  const priere = people.find(p => p.id === row.priere);
                  const orateur2 = people.find(p => p.id === row.orateur2);
                  const { families } = usePeople();
                  const hospitalite = families.find(f => f.id === row.hospitalite);
                  const discoursTitle = discourseList.find(d => d.number.toString() === row.discours)?.title || '';


                  return (
                    <TableRow key={row.id} onClick={() => handleTableRowClick(index)}>
                        <TableCell>{row.date.toLocaleDateString('fr-CA').replace(/-/g, '/')}</TableCell>
                        <TableCell>{orateur?.displayName || ''}</TableCell>
                        <TableCell>{row.assemblee}</TableCell>
                        <TableCell>{discoursTitle}</TableCell>
                        <TableCell className="p-1 text-center"><Checkbox /></TableCell>
                        <TableCell>{president?.displayName || ''}</TableCell>
                        <TableCell>{lecteur?.displayName || ''}</TableCell>
                        <TableCell>{priere?.displayName || ''}</TableCell>
                        <TableCell>{orateur2?.displayName || ''}</TableCell>
                        <TableCell>{hospitalite?.name || ''}</TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
