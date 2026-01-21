'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Send, Loader2 } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { usePeople } from "@/context/people-context";
import LinkToPublisher from '@/components/publisher/link-to-publisher';
import { parse, addDays } from 'date-fns';
import { useSyncToFlutter } from '@/hooks/use-sync-to-flutter';

// Function to generate a given number of weeks starting from a specific date
const generateWeeks = (startDate: Date, count: number) => {
  const weeks = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    weeks.push(currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  return weeks;
};

// Function to get the initial start date (next Monday)
const getInitialStartDate = () => {
    let currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const daysUntilMonday = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek) % 7;
    currentDate.setDate(currentDate.getDate() + daysUntilMonday);
    return currentDate;
}

export default function DiscoursPublicsExterieurPage() {
  const { people } = usePeople();
  const { syncDiscoursPublics, isSyncing } = useSyncToFlutter();
  
  const localSpeakers = useMemo(() => {
    return people.filter(p => p.assignments?.weekendMeeting?.localSpeaker);
  }, [people]);

  const [weeks, setWeeks] = useState(() => generateWeeks(getInitialStartDate(), 52));
  const [assignments, setAssignments] = useState<Record<string, Record<string, boolean>>>({});
  
  const initialColumnCount = Math.max(4, localSpeakers.length);
  const [columns, setColumns] = useState<string[]>(() => Array(initialColumnCount).fill(''));

  const observer = useRef<IntersectionObserver>();
  const loader = useRef<HTMLTableRowElement>(null);

  const loadMoreWeeks = useCallback(() => {
    const lastWeekStr = weeks[weeks.length - 1];
    if (!lastWeekStr) return;
    
    // The date format is dd/MM/yyyy
    const lastDate = parse(lastWeekStr, 'dd/MM/yyyy', new Date());
    const nextDate = addDays(lastDate, 7);
    
    const newWeeks = generateWeeks(nextDate, 52);
    setWeeks(prevWeeks => [...prevWeeks, ...newWeeks]);
  }, [weeks]);

  useEffect(() => {
    const currentLoader = loader.current;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreWeeks();
      }
    });

    if (currentLoader) {
      observer.current.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.current?.unobserve(currentLoader);
      }
    };
  }, [loadMoreWeeks]);


  const handleColumnChange = (columnIndex: number, speakerId: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = speakerId === 'none' ? '' : speakerId;
    setColumns(newColumns);
  };

  const handleCheckboxChange = (speakerId: string, week: string) => {
    if (!speakerId) return;
    setAssignments(prev => {
      const newAssignments = { ...prev };
      if (!newAssignments[week]) {
        newAssignments[week] = {};
      }
      newAssignments[week][speakerId] = !newAssignments[week]?.[speakerId];
      return newAssignments;
    });
  };

  // Synchronisation automatique quand les données changent
  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      // Sauvegarder dans localStorage
      try {
        localStorage.setItem('programme-discours-publics-exterieur', JSON.stringify({ 
          columns, 
          assignments, 
          savedAt: new Date().toISOString() 
        }));
      } catch (e) { /* ignore */ }
      
      // Préparer les données pour la synchronisation
      const speakerSchedule = columns.map((speakerId, colIndex) => {
        if (!speakerId) return null;
        const speaker = people.find(p => p.id === speakerId);
        const unavailableWeeks = Object.entries(assignments)
          .filter(([week, speakerAssignments]) => speakerAssignments[speakerId])
          .map(([week]) => week);
        return {
          speakerId,
          speakerName: speaker?.displayName || '',
          unavailableWeeks
        };
      }).filter(Boolean);

      // Synchroniser vers Flutter
      await syncDiscoursPublics({
        generatedAt: new Date().toISOString(),
        type: 'exterieur',
        speakers: speakerSchedule
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [columns, assignments, people, syncDiscoursPublics]);

  const addColumn = () => {
    setColumns(c => [...c, '']);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center no-print">
            <div>
                <CardTitle>Discours publics - Extérieur</CardTitle>
                <CardDescription>
                Sélectionnez un orateur pour chaque colonne et cochez les semaines où ils sont absents. La liste des semaines se charge automatiquement.
                </CardDescription>
            </div>
            <LinkToPublisher
              type={'discours_publics'}
              label="Enregistrer & Envoyer"
              getPayload={() => ({ generatedAt: new Date().toISOString(), weeks, assignments, columns })}
              save={() => { try { localStorage.setItem('programme-discours-publics-exterieur', JSON.stringify({ weeks, assignments, columns, savedAt: new Date().toISOString() })); } catch {} }}
            />
            <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-5 w-5"/></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="print-only hidden my-4">
            <h2 className="text-xl font-bold text-center">Discours publics - Extérieur</h2>
        </div>
        <div className="overflow-x-auto h-[calc(100vh-250px)] printable-area">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 sticky top-0 left-0 bg-background z-20">Semaine</TableHead>
                {columns.map((speakerId, index) => (
                  <TableHead key={index} className="min-w-[200px] sticky top-0 bg-background z-10">
                    <Select
                      value={speakerId || 'none'}
                      onValueChange={(value) => handleColumnChange(index, value)}
                    >
                      <SelectTrigger className="no-print">
                        <SelectValue placeholder="Choisir un orateur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <em>Aucun</em>
                        </SelectItem>
                        {localSpeakers.map(speaker => (
                          <SelectItem key={speaker.id} value={speaker.id}>
                            {speaker.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="print-only">{localSpeakers.find(s => s.id === speakerId)?.displayName || ''}</span>
                  </TableHead>
                ))}
                <TableHead className="sticky top-0 right-0 bg-background z-10 no-print">
                    <Button onClick={addColumn} size="sm">Ajouter</Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={week} ref={weekIndex === weeks.length - 1 ? loader : null}>
                  <TableCell className="sticky left-0 bg-background z-10">{week}</TableCell>
                  {columns.map((speakerId, index) => (
                    <TableCell key={index} className="text-center">
                      <Checkbox
                        checked={assignments[week]?.[speakerId] || false}
                        onCheckedChange={() => handleCheckboxChange(speakerId, week)}
                        disabled={!speakerId}
                      />
                    </TableCell>
                  ))}
                   <TableCell className="sticky right-0 bg-background no-print"></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}