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
  Trash2,
  Send,
  Loader2,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { usePeople } from '@/context/people-context';
import LinkToPublisher from '@/components/publisher/link-to-publisher';
import { useSyncToFlutter } from '@/hooks/use-sync-to-flutter';

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
        return startMonth + ' ' + startDay + '-' + endDay;
      }
      return startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay;
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
    return startMonth + ' ' + startDay + '-' + endDay;
  }
  return startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay;
};

interface CleaningData {
  week: string;
  reunionSemaine: string;
  reunionWeekend: string;
}

const generateInitialCleaningData = (): CleaningData[] => {
  const startDate = startOfWeek(new Date(), { locale: fr });
  const weekStrings = generateWeeks(startDate, 52);

  return weekStrings.map(week => ({
    week,
    reunionSemaine: '',
    reunionWeekend: '',
  }));
};

export default function CleaningPage() {
  const { people, preachingGroups: contextGroups } = usePeople();
  const { syncNettoyage, isSyncing } = useSyncToFlutter();
  const [cleaningData, setCleaningData] = useState<CleaningData[]>(() => generateInitialCleaningData());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekString());

  // Utiliser preachingGroups du contexte
  const preachingGroups = contextGroups;


  const preachingGroupOptions: Option[] = preachingGroups.map(g => ({
    value: g.id,
    label: g.name,
  }));

  const handleAssignmentChange = (field: 'reunionSemaine' | 'reunionWeekend', selectedIds: string[]) => {
    setCleaningData(currentData => {
      const newData = currentData.map(weekData => {
        if (weekData.week === selectedWeek) {
          const selectedNames = selectedIds.map(id => {
            const group = preachingGroups.find(g => g.id === id);
            return group ? group.name : '';
          }).filter(Boolean);
          return { ...weekData, [field]: selectedNames.join(', ') };
        }
        return weekData;
      });
      
      // Auto-sync to Flutter
      const currentWeekData = newData.find(w => w.week === selectedWeek);
      if (currentWeekData) {
        syncNettoyage({
          date: selectedDate?.toISOString() || new Date().toISOString(),
          groups: preachingGroups.filter(g => selectedIds.includes(g.id)),
          assignments: newData,
        });
      }
      
      return newData;
    });
  };

  const handleClearWeek = () => {
    setCleaningData(currentData => {
      return currentData.map(weekData => {
        if (weekData.week === selectedWeek) {
          return { ...weekData, reunionSemaine: '', reunionWeekend: '' };
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
      weekString = startMonth + ' ' + startDay + '-' + endDay;
    } else {
      weekString = startMonth + ' ' + startDay + ' - ' + endMonth + ' ' + endDay;
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
      console.log('Sauvegarde automatique des donnees...', cleaningData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cleaningData]);

  const selectedWeekData = cleaningData.find(w => w.week === selectedWeek);

  const getSelectedGroupIds = (groupNames: string) => {
    if (!groupNames) return [];
    const names = groupNames.split(', ').filter(Boolean);
    return preachingGroups
      .filter(g => names.includes(g.name))
      .map(g => g.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation du Nettoyage</CardTitle>
        <CardDescription>
          Repartition du nettoyage par groupe de predication pour chaque reunion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 border rounded-lg bg-muted/40">
          <div className="flex items-center gap-2">
            <Label htmlFor="week-select" className="sr-only">Semaine</Label>
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger id="week-select" className="w-[200px]">
                <SelectValue placeholder="Selectionner une semaine" />
              </SelectTrigger>
              <SelectContent>
                {cleaningData.map(d => <SelectItem key={d.week} value={d.week}>{d.week}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" onInteractOutside={(e) => { e.preventDefault(); }}>
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClearWeek}>
              <Trash2 className="mr-2 h-4 w-4" />
              Effacer
            </Button>
            <AutomaticAssignmentDialog
              preachingGroups={preachingGroups}
              cleaningData={cleaningData}
              setCleaningData={setCleaningData}
            />
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <LinkToPublisher
              type={'nettoyage'}
              label="Enregistrer & Envoyer"
              getPayload={() => {
                const generatedAt = new Date().toISOString();
                const weekData = cleaningData.find(w => w.week === selectedWeek);
                return {
                  generatedAt,
                  selectedWeek,
                  reunionSemaine: weekData?.reunionSemaine || '',
                  reunionWeekend: weekData?.reunionWeekend || '',
                  cleaningData: cleaningData.slice(0, 12),
                };
              }}
              save={() => localStorage.setItem('programme-nettoyage', JSON.stringify({ cleaningData, savedAt: new Date().toISOString() }))}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Semaine</TableHead>
              <TableHead>Reunion de semaine</TableHead>
              <TableHead>Reunion de week-end</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className={selectedWeekData ? 'bg-muted/50' : ''}>
              <TableCell className="font-medium">{selectedWeek}</TableCell>
              <TableCell>
                <MultiSelect
                  options={preachingGroupOptions}
                  selected={getSelectedGroupIds(selectedWeekData?.reunionSemaine || '')}
                  onChange={(ids) => handleAssignmentChange('reunionSemaine', ids)}
                  placeholder="Selectionner groupe(s)..."
                />
              </TableCell>
              <TableCell>
                <MultiSelect
                  options={preachingGroupOptions}
                  selected={getSelectedGroupIds(selectedWeekData?.reunionWeekend || '')}
                  onChange={(ids) => handleAssignmentChange('reunionWeekend', ids)}
                  placeholder="Selectionner groupe(s)..."
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Apercu du programme</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Semaine</TableHead>
                <TableHead>Reunion de semaine</TableHead>
                <TableHead>Reunion de week-end</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cleaningData.slice(0, 12).map((weekData) => (
                <TableRow key={weekData.week} className={weekData.week === selectedWeek ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{weekData.week}</TableCell>
                  <TableCell>{weekData.reunionSemaine || '-'}</TableCell>
                  <TableCell>{weekData.reunionWeekend || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface AutomaticAssignmentDialogProps {
  preachingGroups: { id: string; name: string }[];
  cleaningData: CleaningData[];
  setCleaningData: React.Dispatch<React.SetStateAction<CleaningData[]>>;
}

function AutomaticAssignmentDialog({ preachingGroups, cleaningData, setCleaningData }: AutomaticAssignmentDialogProps) {
  const [weeksToAssign, setWeeksToAssign] = useState(12);
  const [groupsTotal, setGroupsTotal] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const handleAutomaticAssignment = () => {
    if (preachingGroups.length === 0) {
      alert('Aucun groupe de predication disponible.');
      return;
    }

    setCleaningData(currentData => {
      const newData = [...currentData];
      const numGroups = preachingGroups.length;
      let groupIndex = 0;

      for (let i = 0; i < weeksToAssign && i < newData.length; i++) {
        if (groupsTotal === 1) {
          // 1 groupe: meme groupe pour semaine et week-end
          const groupName = preachingGroups[groupIndex % numGroups].name;
          newData[i] = {
            ...newData[i],
            reunionSemaine: groupName,
            reunionWeekend: groupName,
          };
          groupIndex++;
        } else if (groupsTotal === 2) {
          // 2 groupes: 1 groupe semaine, 1 autre week-end
          const groupSemaine = preachingGroups[groupIndex % numGroups].name;
          const groupWeekend = preachingGroups[(groupIndex + 1) % numGroups].name;
          newData[i] = {
            ...newData[i],
            reunionSemaine: groupSemaine,
            reunionWeekend: groupWeekend,
          };
          groupIndex += 2;
        } else if (groupsTotal === 4) {
          // 4 groupes: 2 groupes semaine, 2 autres week-end
          const group1Semaine = preachingGroups[groupIndex % numGroups].name;
          const group2Semaine = preachingGroups[(groupIndex + 1) % numGroups].name;
          const group1Weekend = preachingGroups[(groupIndex + 2) % numGroups].name;
          const group2Weekend = preachingGroups[(groupIndex + 3) % numGroups].name;
          newData[i] = {
            ...newData[i],
            reunionSemaine: group1Semaine + ', ' + group2Semaine,
            reunionWeekend: group1Weekend + ', ' + group2Weekend,
          };
          groupIndex += 4;
        }
      }

      return newData;
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bot className="mr-2 h-4 w-4" />
          Saisie automatique
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repartition automatique par groupes</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cette action va repartir les groupes de predication en rotation sur les semaines selectionnees.
              Les attributions existantes seront remplacees.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="weeks-count">Nombre de semaines a repartir</Label>
            <Input
              id="weeks-count"
              type="number"
              min={1}
              max={52}
              value={weeksToAssign}
              onChange={(e) => setWeeksToAssign(parseInt(e.target.value) || 12)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre de groupes pour les deux reunions</Label>
            <Select value={String(groupsTotal)} onValueChange={(v) => setGroupsTotal(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 groupe (meme groupe semaine et week-end)</SelectItem>
                <SelectItem value="2">2 groupes (1 semaine, 1 week-end)</SelectItem>
                <SelectItem value="4">4 groupes (2 semaine, 2 week-end)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Groupes disponibles: {preachingGroups.map(g => g.name).join(', ') || 'Aucun'}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleAutomaticAssignment}>
            Repartir les groupes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




