'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Printer,
  Share2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Bot,
  AlertTriangle,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { add, format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { usePeople } from '@/context/people-context';

const initialRoles = [
  'Comptage_Assistance', 'Accueil à la porte', 'Sonorisation',
  'Micros baladeur', 'Micros Estrade', 'Sanitaire',
  'Accueil dans la salle', 'Accueil à la grande porte', 'Entretien',
];

const initialRolePersonCounts: { [key: string]: number } = {
  Comptage_Assistance: 2, 'Accueil à la porte': 2, Sonorisation: 2,
  'Micros baladeur': 4, 'Micros Estrade': 2, Sanitaire: 2,
  'Accueil dans la salle': 2, 'Accueil à la grande porte': 2, Entretien: 1,
};

const generateWeeks = (startDate: Date, numWeeks: number) => {
  const weeks = [];
  for (let i = 0; i < numWeeks; i++) {
    const weekStart = addWeeks(startDate, i);
    const weekEnd = endOfWeek(weekStart, { locale: fr });
    
    const formatRange = (start: Date, end: Date) => {
      const startMonth = format(start, 'MMMM', { locale: fr });
      const endMonth = format(end, 'MMMM', { locale: fr });
      const startDay = format(start, 'dd', { locale: fr });
      const endDay = format(end, 'dd', { locale: fr });

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}–${endDay}`;
      }
      return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
    };

    weeks.push(formatRange(weekStart, weekEnd));
  }
  return weeks;
};

const getCurrentWeekString = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: fr });
    const weekEnd = endOfWeek(now, { locale: fr });
    const startMonth = format(weekStart, 'MMMM', { locale: fr });
    const endMonth = format(weekEnd, 'MMMM', { locale: fr });
    const startDay = format(weekStart, 'dd', { locale: fr });
    const endDay = format(weekEnd, 'dd', { locale: fr });

    if (startMonth === endMonth) {
        return `${startMonth} ${startDay}–${endDay}`;
    }
    return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
};

const generateInitialServiceData = (rolesToUse: string[]) => {
  const startDate = startOfWeek(new Date(), { locale: fr });
  const weekStrings = generateWeeks(startDate, 24);
  
  return weekStrings.map(week => ({
      week,
      ...rolesToUse.reduce((acc, role) => ({ ...acc, [role]: [] }), {})
  }));
};

export default function ServicesPage() {
  const { people } = usePeople();
  const [roles, setRoles] = useState(initialRoles);
  const [rolePersonCounts, setRolePersonCounts] = useState(initialRolePersonCounts);
  const [serviceData, setServiceData] = useState(() => generateInitialServiceData(initialRoles));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekString());

  const peopleOptions: Option[] = people.map(p => ({
    value: p.id,
    label: p.displayName,
  }));

  const preachingGroups = useMemo(() => {
    const groupMap: Record<string, any[]> = {};
    people.forEach(person => {
        const groupId = person.spiritual.group || 'unassigned';
        if (groupId === 'unassigned') return;
        if (!groupMap[groupId]) {
            groupMap[groupId] = [];
        }
        groupMap[groupId].push(person);
    });
    const sortedGroupIds = Object.keys(groupMap).sort();
    return sortedGroupIds.map((groupId, index) => ({
      id: groupId,
      name: `Groupe ${index + 1}`
    }));
  }, [people]);

  const preachingGroupOptions: Option[] = preachingGroups.map(g => ({
    value: g.id,
    label: g.name,
  }));

  const handleAssignmentChange = (role: string, selectedIds: string[]) => {
    setServiceData(currentData => {
        return currentData.map(weekData => {
            if (weekData.week === selectedWeek) {
                let selectedNames: string[];
                if (role === 'Entretien') {
                    selectedNames = selectedIds.map(id => {
                        const group = preachingGroups.find(g => g.id === id);
                        return group ? group.name : '';
                    }).filter(Boolean);
                } else {
                    selectedNames = selectedIds.map(id => {
                        const person = people.find(p => p.id === id);
                        return person ? person.displayName : '';
                    }).filter(Boolean);
                }
                return { ...weekData, [role]: selectedNames };
            }
            return weekData;
        });
    });
  };

  const handleAddService = (newRoleName: string, personCount: number) => {
    const sanitizedRoleName = newRoleName.replace(/ /g, '_');
    if (roles.includes(sanitizedRoleName)) {
      alert('Ce service existe déjà.');
      return;
    }
    setRoles(prev => [...prev, sanitizedRoleName]);
    setRolePersonCounts(prev => ({ ...prev, [sanitizedRoleName]: personCount }));
    setServiceData(prevData => prevData.map(week => ({
        ...week,
        [sanitizedRoleName]: []
    })));
  };

  const handleDeleteService = (roleToDelete: string) => {
    setRoles(prev => prev.filter(role => role !== roleToDelete));
    setRolePersonCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[roleToDelete];
        return newCounts;
    });
    setServiceData(prevData => {
        const newData = prevData.map(week => {
            const newWeekData = { ...week };
            delete (newWeekData as any)[roleToDelete];
            return newWeekData;
        });
        return newData;
    });
  };

  const handleClearWeek = () => {
    setServiceData(currentData => {
      return currentData.map(weekData => {
        if (weekData.week === selectedWeek) {
          const clearedWeekData = { ...weekData };
          roles.forEach(role => {
            (clearedWeekData as any)[role] = [];
          });
          return clearedWeekData;
        }
        return weekData;
      });
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const weekStart = startOfWeek(date, { locale: fr });
    const weekEnd = endOfWeek(date, { locale: fr });
    const startMonth = format(weekStart, 'MMMM', { locale: fr });
    const endMonth = format(weekEnd, 'MMMM', { locale: fr });
    const startDay = format(weekStart, 'dd', { locale: fr });
    const endDay = format(weekEnd, 'dd', { locale: fr });

    let weekString: string;
    if (startMonth === endMonth) {
        weekString = `${startMonth} ${startDay}–${endDay}`;
    } else {
        weekString = `${startMonth} ${startDay}–${endMonth} ${endDay}`;
    }
    
    setSelectedWeek(weekString);
  };

  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
        firstMount.current = false;
        return;
    }

    const timer = setTimeout(() => {
        console.log('Sauvegarde automatique des données...', serviceData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [serviceData]);

  const selectedWeekData = serviceData.find(w => w.week === selectedWeek);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card>
      <CardHeader className="no-print">
        <CardTitle>Organisation Hebdomadaire des Affectations de Service</CardTitle>
        <CardDescription>
          Planifiez et visualisez les affectations de service pour chaque semaine.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 border rounded-lg bg-muted/40 no-print">
          <div className="flex items-center gap-2">
            <Label htmlFor="week-select" className="sr-only">Semaine</Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger id="week-select" className="w-[200px]">
                <SelectValue placeholder="Sélectionner une semaine" />
              </SelectTrigger>
              <SelectContent>
                {serviceData.map(d => <SelectItem key={d.week} value={d.week}>{d.week}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                onInteractOutside={(e) => {
                  e.preventDefault();
                }}
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <AddServiceDialog onAddService={handleAddService} />
            <Button variant="outline" onClick={handleClearWeek}>
              <Trash2 className="mr-2 h-4 w-4" />
              Effacer
            </Button>
            <AutomaticAssignmentDialog rolePersonCounts={rolePersonCounts} />
            <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mb-8 no-print">
            <h3 className="text-lg font-semibold mb-4 text-red-500 text-center">{selectedWeek}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {roles.map(role => {
                    const isEntretien = role === 'Entretien';
                    const options = isEntretien ? preachingGroupOptions : peopleOptions;
                    const assignedNames = (selectedWeekData?.[role as keyof typeof selectedWeekData] as unknown as string[]) || [];
                    
                    let selectedIds: string[];
                    if (isEntretien) {
                        selectedIds = preachingGroups
                            .filter(g => assignedNames.includes(g.name))
                            .map(g => g.id);
                    } else {
                        selectedIds = people
                            .filter(p => assignedNames.includes(p.displayName))
                            .map(p => p.id);
                    }

                    return (
                        <div key={role} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Label>{role.replace(/_/g, ' ')}</Label>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteService(role)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <MultiSelect
                                options={options}
                                selected={selectedIds}
                                onChange={(ids) => handleAssignmentChange(role, ids)}
                                placeholder="Sélectionner..."
                            />
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="overflow-x-auto printable-area">
          <h3 className="text-xl font-bold mb-4 text-center print-only hidden">{`Programme des services - Semaine du ${selectedWeek}`}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date</TableHead>
                {roles.map(role => <TableHead key={role}>{role.replace(/_/g, ' ')}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceData.map((weekData) => (
                <TableRow
                  key={weekData.week}
                  className={weekData.week === getCurrentWeekString() ? 'bg-yellow-100/70' : ''}
                >
                  <TableCell className="font-medium">{weekData.week}</TableCell>
                  {roles.map(role => (
                    <TableCell key={role}>
                      <div className="flex flex-col gap-1">
                        {(((weekData[role as keyof typeof weekData] as unknown) as string[]) || []).map((person, i) => (
                          <span key={i} className="h-6">{person}</span>
                        ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function AddServiceDialog({ onAddService }: { onAddService: (name: string, count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [personCount, setPersonCount] = useState(1);

  const handleAdd = () => {
    if (newRoleName.trim()) {
      onAddService(newRoleName.trim(), personCount);
      setNewRoleName('');
      setPersonCount(1);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau service</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role-name" className="text-right">
              Nom
            </Label>
            <Input
              id="role-name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Entretien"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="person-count" className="text-right">
              Personnes
            </Label>
            <Input
              id="person-count"
              type="number"
              value={personCount}
              onChange={(e) => setPersonCount(parseInt(e.target.value, 10) || 1)}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd}>Ajouter le service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AutomaticAssignmentDialog({ rolePersonCounts }: { rolePersonCounts: { [key: string]: number } }) {
  const [open, setOpen] = useState(false);

  const handleAutomaticAssignment = () => {
    console.log('Lancement de la saisie automatique...');
    setOpen(false);
    alert('Saisie automatique effectuée (simulation) !');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bot className="mr-2 h-4 w-4" />
          Saisie automatique
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Paramètres de la saisie automatique</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            <Label className="font-semibold">Choisir les rôles et le nombre de personnes</Label>
            {Object.entries(rolePersonCounts).map(([role, maxCount]) => (
              <div key={role} className="flex items-center justify-between">
                <Label htmlFor={role} className="flex-1">{role.replace(/_/g, ' ')}</Label>
                <div className="flex items-center gap-4">
                  {[...Array(maxCount)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Checkbox id={`${role}-${i + 1}`} />
                      <Label htmlFor={`${role}-${i + 1}`} className="text-sm font-normal">{i + 1}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="weeks-count">Semaines pour l'attribution</Label>
              <Select>
                <SelectTrigger id="weeks-count"><SelectValue placeholder="Nombre de semaines" /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map(w => <SelectItem key={w} value={String(w)}>{w} semaines</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="attribution-criteria">Commandé par</Label>
              <Select>
                <SelectTrigger id="attribution-criteria"><SelectValue placeholder="Critère d'attribution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Service récent</SelectItem>
                  <SelectItem value="rotation">Rotation</SelectItem>
                  <SelectItem value="random">Aléatoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox id="check-existing" defaultChecked />
            <Label htmlFor="check-existing" className="font-normal">Vérifier l’attribution existante</Label>
          </div>

          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action va écraser toutes les futures affectations pour les rôles et semaines sélectionnés.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">❌ Annuler</Button>
          </DialogClose>
          <Button type="button" onClick={handleAutomaticAssignment}>🟦 Saisie automatique</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}