
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Diamond,
  Handshake,
  Heart,
  Star,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, addDays, getMonth, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';

type AssignmentType = 
  | 'gems-president' 
  | 'gems-prayer'
  | 'gems-talk'
  | 'gems-spiritualGems'
  | 'gems-bibleReading'
  | 'ministry-student'
  | 'ministry-assistant'
  | 'christian-life-talk'
  | 'christian-life-study-leader'
  | 'christian-life-study-reader';


type MinistryPart = {
    type: string | undefined;
    studentId: string | undefined | null;
    assistantId: string | undefined | null;
}

type ChristianLifePart = {
    type: 'needs' | 'part' | undefined;
    theme: string;
    participantId: string | undefined | null;
    duration: number;
};

type WeekProgram = {
    [key: string]: string | undefined | null | MinistryPart[] | ChristianLifePart[];
    ministryParts?: MinistryPart[];
    christianLifeParts?: ChristianLifePart[];
}

const ministryPartOptions = [
    { value: 'none', label: 'Aucun' },
    { value: 'first-contact', label: 'Premier contact' },
    { value: 'return-visit', label: 'Nouvelle visite' },
    { value: 'bible-study', label: 'Cours biblique' },
    { value: 'student-talk', label: 'Discours d’élève' },
    { value: 'video', label: 'Vidéo' },
    { value: 'talk', label: 'Discours' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'explain-beliefs-talk', label: 'Explique tes croyances -Discours' },
    { value: 'explain-beliefs-demo', label: 'Explique tes croyances – Démo' },
];

const SectionHeader = ({ icon: Icon, title, color }: { icon: React.ElementType, title: string, color: string }) => (
    <div className={`flex items-center p-1 rounded-t-sm text-white text-sm font-bold ${color}`}>
        <Icon className="h-4 w-4 mx-2" />
        <h3 className="flex-grow">{title}</h3>
    </div>
);

const ParticipantSelect = ({
  people,
  assignment,
  value,
  onValueChange,
  programs,
  weekKey,
}: {
  people: Person[];
  assignment: AssignmentType;
  value: string | null | undefined;
  onValueChange: (value: string | undefined) => void;
  programs: {[weekKey: string]: WeekProgram};
  weekKey: string;
}) => {
  const getAssignmentEligibility = (person: Person, assignmentType: AssignmentType) => {
    if (!person.assignments) return false;
    switch (assignmentType) {
      case 'gems-president':
        return person.assignments.gems.president || person.assignments.weekendMeeting.president;
      case 'gems-prayer':
        return person.assignments.gems.prayers || person.assignments.weekendMeeting.finalPrayer;
      case 'gems-talk':
        return person.assignments.gems.talks;
      case 'gems-spiritualGems':
        return person.assignments.gems.spiritualGems;
      case 'gems-bibleReading':
        return person.assignments.gems.bibleReading;
      case 'ministry-student':
        return person.assignments.ministry.student;
      case 'ministry-assistant':
        return person.assignments.ministry.interlocutor;
      case 'christian-life-talk':
        return person.assignments.gems.talks || person.assignments.christianLife.interventions;
      case 'christian-life-study-leader':
        return person.assignments.christianLife.congregationBibleStudy;
       case 'christian-life-study-reader':
        return person.assignments.christianLife.reader;
      default:
        return false;
    }
  };

  const findLastAssignmentDate = (personId: string, assignmentType: AssignmentType) => {
    let mostRecentDate: Date | null = null;

    Object.keys(programs).forEach(wk => {
      if (parseISO(wk) >= parseISO(weekKey)) return;

      const program = programs[wk];
      let assigned = false;

      if (assignmentType.startsWith('ministry-')) {
          const ministryParts = program?.ministryParts || [];
          if (assignmentType === 'ministry-student') {
              assigned = ministryParts.some(p => p.studentId === personId);
          } else if (assignmentType === 'ministry-assistant') {
              assigned = ministryParts.some(p => p.assistantId === personId);
          }
      } else if (assignmentType.startsWith('christian-life-')) {
          const christianLifeParts = program?.christianLifeParts || [];
          if (assignmentType === 'christian-life-talk') {
              assigned = christianLifeParts.some(p => p.participantId === personId);
          } else if(assignmentType === 'christian-life-study-leader') {
            assigned = program['cbs-leader'] === personId;
          } else if(assignmentType === 'christian-life-study-reader') {
            assigned = program['cbs-reader'] === personId;
          }
      } else {
         assigned = program?.[assignmentType] === personId;
      }

      if (assigned) {
          const d = parseISO(wk);
          if (!mostRecentDate || d > mostRecentDate) {
              mostRecentDate = d;
          }
      }
    });

    return mostRecentDate;
  };

  const sortedPeople = React.useMemo(() => {
    return people
      .filter(p => getAssignmentEligibility(p, assignment))
      .map(p => {
        const lastDate = findLastAssignmentDate(p.id, assignment);
        return {
          ...p,
          lastAssignmentDate: lastDate,
          daysSinceLastAssignment: lastDate ? differenceInDays(new Date(), lastDate) : Infinity,
        };
      })
      .sort((a, b) => b.daysSinceLastAssignment - a.daysSinceLastAssignment);
  }, [people, assignment, programs, weekKey]);

  return (
    <Select value={value || ''} onValueChange={(v) => onValueChange(v === 'none' ? undefined : v)}>
      <SelectTrigger className="bg-white h-8 w-full">
        <SelectValue placeholder="Aucun" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun</SelectItem>
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


export default function ReunionVieMinisterePage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedWeek, setSelectedWeek] = React.useState<Date | null>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [openMonth, setOpenMonth] = React.useState<number>(getMonth(new Date()));
  const [programs, setPrograms] = React.useState<{[weekKey: string]: WeekProgram}>({});
  
  const { people } = usePeople();

  const generateMonths = () => {
    const year = currentDate.getFullYear();
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  };
  
  const getWeeksForMonth = (month: Date) => {
    const firstDayOfMonth = startOfMonth(month);
    let currentWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const weeks = [];

    while (currentWeekStart.getMonth() === month.getMonth() || weeks.length < 4) {
        if (currentWeekStart.getMonth() !== month.getMonth() && weeks.length > 0) break;
        weeks.push(currentWeekStart);
        currentWeekStart = addDays(currentWeekStart, 7);
    }
    
    return weeks;
  }
  
  const selectedWeekKey = selectedWeek ? format(selectedWeek, 'yyyy-MM-dd') : '';
  const currentProgram = programs[selectedWeekKey] || {};
  const ministryParts = currentProgram.ministryParts || Array(4).fill({ type: 'none', studentId: null, assistantId: null });
  const christianLifeParts = currentProgram.christianLifeParts || [{ type: undefined, theme: '', participantId: null, duration: 15 }];

  React.useEffect(() => {
    if (selectedWeekKey && !programs[selectedWeekKey]?.ministryParts) {
      handleMinistryPartsChange(Array(4).fill({ type: 'none', studentId: null, assistantId: null }));
    }
    if (selectedWeekKey && !programs[selectedWeekKey]?.christianLifeParts) {
      handleChristianLifePartsChange([{ type: undefined, theme: '', participantId: null, duration: 15 }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeekKey]);

  const handleAssignmentChange = (part: string, personId: string | undefined) => {
    if (!selectedWeekKey) return;

    setPrograms(prev => ({
        ...prev,
        [selectedWeekKey]: {
            ...prev[selectedWeekKey],
            [part]: personId,
        }
    }));
  };

  const handleMinistryPartsChange = (newParts: MinistryPart[]) => {
      if (!selectedWeekKey) return;
      setPrograms(prev => ({
          ...prev,
          [selectedWeekKey]: {
              ...prev[selectedWeekKey],
              ministryParts: newParts,
          }
      }));
  }
  
  const handleChristianLifePartsChange = (newParts: ChristianLifePart[]) => {
      if (!selectedWeekKey) return;
      setPrograms(prev => ({
          ...prev,
          [selectedWeekKey]: {
              ...prev[selectedWeekKey],
              christianLifeParts: newParts,
          }
      }));
  }

  const handleMinistryPartFieldChange = (index: number, field: keyof MinistryPart, value: string | undefined | null) => {
      const newParts = [...ministryParts];
      newParts[index] = { ...newParts[index], [field]: value };
      handleMinistryPartsChange(newParts);
  };
  
  const handleChristianLifePartFieldChange = (index: number, field: keyof ChristianLifePart, value: any) => {
      const newParts = [...christianLifeParts];
      newParts[index] = { ...newParts[index], [field]: value };
      handleChristianLifePartsChange(newParts);
  };


  const handleYearChange = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 12) : addMonths(prev, 12));
  }
  
  const addMinistryPart = () => handleMinistryPartsChange([...ministryParts, { type: 'none', studentId: null, assistantId: null }]);
  const removeMinistryPart = () => handleMinistryPartsChange(ministryParts.slice(0, -1));
  
  const addChristianLifePart = () => handleChristianLifePartsChange([...christianLifeParts, { type: 'part', theme: '', participantId: null, duration: 15 }]);
  const removeChristianLifePart = (index: number) => handleChristianLifePartsChange(christianLifeParts.filter((_, i) => i !== index));

  const weekRangeLabel = selectedWeek 
    ? `${format(selectedWeek, 'dd')} - ${format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'dd MMMM', { locale: fr })}` 
    : format(new Date(), 'MMMM dd-dd', { locale: fr });

  const toggleMonth = (monthIndex: number) => {
    setOpenMonth(prevOpenMonth => (prevOpenMonth === monthIndex ? -1 : monthIndex));
  };


  return (
    <div className="grid grid-cols-[220px_1fr] gap-4 h-full">
        {/* Left Sidebar for Months */}
        <Card className="flex flex-col">
            <CardContent className="p-2">
                <div className="flex items-center justify-between px-2 pb-2">
                    <Button variant="ghost" size="icon" onClick={() => handleYearChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-bold">{currentDate.getFullYear()}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleYearChange('next')}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1">
                    {generateMonths().map((month, index) => (
                       <Collapsible key={index} open={openMonth === index} onOpenChange={() => toggleMonth(index)} className="w-full">
                            <CollapsibleTrigger asChild>
                                 <Button 
                                    variant={selectedWeek && selectedWeek.getMonth() === month.getMonth() ? "secondary" : "ghost"}
                                    className="w-full justify-start capitalize"
                                >
                                    {format(month, 'MMMM yyyy', { locale: fr })}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="py-1 pl-4">
                                <div className="space-y-1">
                                    {getWeeksForMonth(month).map((week, weekIndex) => {
                                        const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
                                        const weekLabel = `${format(week, 'dd')} - ${format(weekEnd, 'dd')}`;
                                        
                                        return (
                                             <Button 
                                                key={weekIndex}
                                                variant={selectedWeek?.getTime() === week.getTime() ? "default" : "ghost"}
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => setSelectedWeek(week)}
                                             >
                                                {weekLabel}
                                             </Button>
                                        )
                                    })}
                                </div>
                            </CollapsibleContent>
                       </Collapsible>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card>
            <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon"><Star className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        <Checkbox id="brouillon" />
                        <Label htmlFor="brouillon">Brouillon</Label>
                    </div>
                    <div className="text-lg font-bold text-primary capitalize">{weekRangeLabel}</div>
                    <div className="flex items-center gap-2">
                        <Label>Cantiques</Label>
                        <Input className="w-20 h-8" />
                        <Input className="w-20 h-8" />
                        <Input className="w-20 h-8" />
                    </div>
                </div>

                {/* Joyaux de la Parole de Dieu */}
                <div className="bg-muted p-2 rounded-md">
                    <SectionHeader icon={Diamond} title="Joyaux de la Parole de Dieu" color="bg-cyan-600" />
                    <div className="p-2 space-y-3">
                        <div className="grid grid-cols-2 gap-x-8 items-center">
                            <div className="flex items-center gap-2">
                                <Label className="w-24">Président</Label>
                                 <ParticipantSelect people={people} assignment="gems-president" value={currentProgram['gems-president']} onValueChange={(id) => handleAssignmentChange('gems-president', id)} programs={programs} weekKey={selectedWeekKey} />
                            </div>
                             <div className="flex items-center gap-2">
                                <Label className="w-24">Prière du début</Label>
                                <ParticipantSelect people={people} assignment="gems-prayer" value={currentProgram['gems-prayer']} onValueChange={(id) => handleAssignmentChange('gems-prayer', id)} programs={programs} weekKey={selectedWeekKey}/>
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-x-8 items-center">
                            <div className="flex items-center gap-2">
                                <Label className="w-24">Discours</Label>
                                <ParticipantSelect people={people} assignment="gems-talk" value={currentProgram['gems-talk']} onValueChange={(id) => handleAssignmentChange('gems-talk', id)} programs={programs} weekKey={selectedWeekKey} />
                                <Input type="number" className="w-16 h-8 bg-white" defaultValue="10" />
                                <Label className="text-xs">min.</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="w-24">Perles spirituelles</Label>
                                 <ParticipantSelect people={people} assignment="gems-spiritualGems" value={currentProgram['gems-spiritualGems']} onValueChange={(id) => handleAssignmentChange('gems-spiritualGems', id)} programs={programs} weekKey={selectedWeekKey} />
                                 <Button variant="ghost" size="icon"><BookOpen className="h-4 w-4" /></Button>
                                <Input type="number" className="w-16 h-8 bg-white" defaultValue="10" />
                                <Label className="text-xs">min.</Label>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="w-24">Lecture de la Bible</Label>
                             <ParticipantSelect people={people} assignment="gems-bibleReading" value={currentProgram['gems-bibleReading']} onValueChange={(id) => handleAssignmentChange('gems-bibleReading', id)} programs={programs} weekKey={selectedWeekKey} />
                             <Button variant="ghost" size="icon"><BookOpen className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                 {/* Applique-toi au ministère */}
                <div className="bg-muted p-2 rounded-md">
                    <SectionHeader icon={Handshake} title="Applique-toi au ministère" color="bg-orange-500" />
                    <div className="p-2 space-y-2">
                         <div className="flex items-center justify-end gap-2">
                             <Label className="text-sm">Nombre habituel</Label>
                             <Select defaultValue="4" onValueChange={val => handleMinistryPartsChange(Array(parseInt(val, 10)).fill({ type: 'none', studentId: null, assistantId: null }))}>
                                 <SelectTrigger className="w-16 h-8 bg-white"><SelectValue/></SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="1">1</SelectItem>
                                     <SelectItem value="2">2</SelectItem>
                                     <SelectItem value="3">3</SelectItem>
                                     <SelectItem value="4">4</SelectItem>
                                     <SelectItem value="5">5</SelectItem>
                                     <SelectItem value="6">6</SelectItem>
                                 </SelectContent>
                             </Select>
                             <Button size="icon" className="h-8 w-8" onClick={addMinistryPart}><Plus /></Button>
                             <Button size="icon" className="h-8 w-8" onClick={removeMinistryPart}><Minus /></Button>
                         </div>
                        {ministryParts.map((part, index) => (
                           <div key={index} className="grid grid-cols-[200px_1fr_1fr] gap-2 items-center">
                               <Select value={part.type} onValueChange={v => handleMinistryPartFieldChange(index, 'type', v === 'none' ? undefined : v)}>
                                   <SelectTrigger className="bg-white h-8"><SelectValue placeholder="Aucun" /></SelectTrigger>
                                   <SelectContent>
                                        {ministryPartOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                   </SelectContent>
                               </Select>
                               <ParticipantSelect 
                                   people={people} 
                                   assignment="ministry-student" 
                                   value={part.studentId} 
                                   onValueChange={(id) => handleMinistryPartFieldChange(index, 'studentId', id)}
                                   programs={programs}
                                   weekKey={selectedWeekKey}
                               />
                               <ParticipantSelect 
                                   people={people}
                                   assignment="ministry-assistant"
                                   value={part.assistantId}
                                   onValueChange={(id) => handleMinistryPartFieldChange(index, 'assistantId', id)}
                                   programs={programs}
                                   weekKey={selectedWeekKey}
                               />
                           </div>
                        ))}
                    </div>
                </div>

                {/* Vie chrétienne */}
                <div className="bg-muted p-2 rounded-md">
                    <SectionHeader icon={Heart} title="Vie chrétienne" color="bg-red-600" />
                    <div className="p-2 space-y-2">
                        {christianLifeParts.map((part, index) => (
                            <div key={index} className="grid grid-cols-[200px_1fr_1fr_auto_auto] gap-2 items-center">
                                <Select value={part.type} onValueChange={v => handleChristianLifePartFieldChange(index, 'type', v === 'none' ? undefined : v as any)}>
                                    <SelectTrigger className="bg-white h-8">
                                        <SelectValue placeholder="Type de partie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="needs">Besoins de l'assemblée</SelectItem>
                                        <SelectItem value="part">Partie Vie Chrétienne</SelectItem>
                                    </SelectContent>
                                </Select>
                                <ParticipantSelect 
                                    people={people} 
                                    assignment="christian-life-talk" 
                                    value={part.participantId} 
                                    onValueChange={(id) => handleChristianLifePartFieldChange(index, 'participantId', id)}
                                    programs={programs}
                                    weekKey={selectedWeekKey}
                                />
                                <Input 
                                    className="bg-white h-8"
                                    placeholder="Thème du devoir"
                                    value={part.theme}
                                    onChange={(e) => handleChristianLifePartFieldChange(index, 'theme', e.target.value)}
                                />
                                <Input 
                                    type="number" 
                                    className="w-16 h-8 bg-white" 
                                    value={part.duration}
                                    onChange={(e) => handleChristianLifePartFieldChange(index, 'duration', parseInt(e.target.value, 10))}
                                />
                                <Label className="text-xs">min.</Label>
                                {index > 0 && <Button variant="ghost" size="icon" onClick={() => removeChristianLifePart(index)}><Minus className="h-4 w-4"/></Button>}
                            </div>
                        ))}
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={addChristianLifePart}><Plus className="mr-2 h-4 w-4"/>Ajouter une partie</Button>
                        </div>
                         <div className="grid grid-cols-[200px_1fr_auto_auto_1fr_1fr] gap-2 items-center pt-2 border-t mt-2">
                            <Label>Étude biblique de l'assemblée</Label>
                             <ParticipantSelect people={people} assignment="christian-life-study-leader" value={currentProgram['cbs-leader']} onValueChange={(id) => handleAssignmentChange('cbs-leader', id)} programs={programs} weekKey={selectedWeekKey}/>
                             <Input type="number" className="w-16 h-8 bg-white" defaultValue={30} />
                            <Label className="text-xs">min.</Label>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">EBA Lecteur</Label>
                                <ParticipantSelect people={people} assignment="christian-life-study-reader" value={currentProgram['cbs-reader']} onValueChange={(id) => handleAssignmentChange('cbs-reader', id)} programs={programs} weekKey={selectedWeekKey}/>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Prière finale</Label>
                                <ParticipantSelect people={people} assignment="gems-prayer" value={currentProgram['final-prayer']} onValueChange={(id) => handleAssignmentChange('final-prayer', id)} programs={programs} weekKey={selectedWeekKey}/>
                            </div>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
