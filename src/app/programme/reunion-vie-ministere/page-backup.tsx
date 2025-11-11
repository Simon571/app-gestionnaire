'use client';

import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Printer, Zap, Eraser, Trash2, BookOpen, Download, Save, Calendar } from 'lucide-react';
import { format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, addDays, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePeople } from '@/context/people-context';
import FullMeetingBlock, { JoyeauxData, MinistryAssignment, ChristianLifePart, CongregationBibleStudy, FinalPrayer } from '@/components/vcm/FullMeetingBlock';
import { useToast } from '@/hooks/use-toast';
import { assignPeopleToMeeting } from '@/lib/assignmentEngine';
import { loadVcmForDate, MwbWeek } from '@/lib/vcmLoader';
import { useAppSettings } from '@/context/app-settings-context';
import VcmManager from '@/components/vcm/vcm-manager';
import WeekSelector from '@/components/vcm/week-selector';
import { VcmWeekData } from '@/lib/vcm-import-service';

// --- TYPES ---
type WeeklyMeetingData = {
  joyeauxData: JoyeauxData;
  ministryAssignments: MinistryAssignment[];
  ministryAssignments2: MinistryAssignment[];
  christianLifeParts: ChristianLifePart[];
  bibleStudy: CongregationBibleStudy;
  finalPrayer: FinalPrayer;
  mwbWeek: MwbWeek | null;
};

// --- INITIAL STATES ---
const initialMinistryAssignments: MinistryAssignment[] = [
    { id: 'min1', type: null, studentId: null, partnerId: null, theme: '', duration: null, isSecondaryRoom: false },
    { id: 'min2', type: null, studentId: null, partnerId: null, theme: '', duration: null, isSecondaryRoom: false },
    { id: 'min3', type: null, studentId: null, partnerId: null, theme: '', duration: null, isSecondaryRoom: false },
    { id: 'min4', type: null, studentId: null, partnerId: null, theme: '', duration: null, isSecondaryRoom: false },
];
const initialChristianLifeParts: ChristianLifePart[] = [
    { id: 'life1', type: 'part', participantId: null, theme: '', duration: null },
    { id: 'life2', type: 'part', participantId: null, theme: '', duration: null },
    { id: 'life3', type: 'part', participantId: null, theme: '', duration: null },
];
const initialBibleStudy: CongregationBibleStudy = { conductorId: null, readerId: null, theme: '', duration: 30 };
const initialFinalPrayer: FinalPrayer = { brotherId: null };
const initialJoyeauxData: JoyeauxData = {};

// --- LOCAL STORAGE HELPERS ---
const getWeekStorageKey = (date: Date): string => `meeting-week-${format(date, 'yyyy-MM-dd')}`;

// --- HELPER FUNCTION ---
const safeParseInt = (value: string | undefined | null): number | null => {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }
  const number = parseInt(value, 10);
  return isNaN(number) ? null : number;
};

export default function ReunionVieMinisterePage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedWeek, setSelectedWeek] = React.useState<Date | null>(null);
  const [openMonth, setOpenMonth] = React.useState<number>(getMonth(new Date()));
  const { people, isLoaded } = usePeople();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const [room, setRoom] = React.useState<1 | 2>(1);
  const [showVcmManager, setShowVcmManager] = React.useState(true);
  
  // State for all parts of the meeting
  const [joyeauxData, setJoyeauxData] = React.useState<JoyeauxData>(initialJoyeauxData);
  const [ministryAssignments, setMinistryAssignments] = React.useState<MinistryAssignment[]>(initialMinistryAssignments);
  const [ministryAssignments2, setMinistryAssignments2] = React.useState<MinistryAssignment[]>(initialMinistryAssignments);
  const [christianLifeParts, setChristianLifeParts] = React.useState<ChristianLifePart[]>(initialChristianLifeParts);
  const [bibleStudy, setBibleStudy] = React.useState<CongregationBibleStudy>(initialBibleStudy);
  const [finalPrayer, setFinalPrayer] = React.useState<FinalPrayer>(initialFinalPrayer);
  const [mwbWeek, setMwbWeek] = React.useState<MwbWeek | null>(null);
  const { settings } = useAppSettings();

  // Handler pour les données VCM importées
  const handleVcmDataLoaded = React.useCallback((vcmData: VcmWeekData) => {
    // Convertir les données VCM en format interne
    const convertedJoyeaux: JoyeauxData = {};
    const convertedMinistry: MinistryAssignment[] = [...initialMinistryAssignments];
    const convertedLife: ChristianLifePart[] = [...initialChristianLifeParts];
    const convertedStudy: CongregationBibleStudy = { ...initialBibleStudy };

    // Mapper les parties Joyaux
    vcmData.sections.joyaux.parts.forEach((part, index) => {
      if (part.type === 'discours_principal') {
        convertedJoyeaux.discours = {
          title: part.title,
          minutes: part.duration,
          speakerId: null
        };
      } else if (part.type === 'perles_spirituelles') {
        convertedJoyeaux.pearls = {
          minutes: part.duration,
          conductorId: null
        };
      } else if (part.type === 'lecture_bible') {
        convertedJoyeaux.bible = {
          title: part.title,
          minutes: part.duration,
          readerId: null
        };
      }
    });

    // Mapper les parties Ministère
    vcmData.sections.ministry.parts.forEach((part, index) => {
      if (index < convertedMinistry.length) {
        convertedMinistry[index] = {
          ...convertedMinistry[index],
          type: part.type === 'engage_conversation' ? 'engage_conversation' : 
                part.type === 'entretiens_interet' ? 'entretiens_interet' : null,
          theme: part.title,
          duration: part.duration
        };
      }
    });

    // Mapper les parties Vie Chrétienne
    vcmData.sections.life.parts.forEach((part, index) => {
      if (part.type === 'etude_biblique') {
        convertedStudy.theme = part.title;
        convertedStudy.duration = part.duration;
      } else if (index < convertedLife.length) {
        convertedLife[index] = {
          ...convertedLife[index],
          type: part.type === 'besoins_assemblee' ? 'besoins_assemblee' : 'part',
          theme: part.title,
          duration: part.duration
        };
      }
    });

    // Mettre à jour l'état
    setJoyeauxData(convertedJoyeaux);
    setMinistryAssignments(convertedMinistry);
    setMinistryAssignments2(convertedMinistry.map(m => ({...m, isSecondaryRoom: true})));
    setChristianLifeParts(convertedLife);
    setBibleStudy(convertedStudy);

    toast({
      title: "Programme VCM chargé",
      description: `Données importées pour la semaine du ${vcmData.weekPeriod}`,
    });
  }, [toast]);

  // Basculer entre vue VCM moderne et vue classique
  const toggleVcmView = () => {
    setShowVcmManager(!showVcmManager);
  };

  // --- LOAD and SAVE from/to Local Storage ---
  React.useEffect(() => {
    if (!selectedWeek) {
        setJoyeauxData(initialJoyeauxData);
        setMinistryAssignments(initialMinistryAssignments);
        setMinistryAssignments2(initialMinistryAssignments);
        setChristianLifeParts(initialChristianLifeParts);
        setBibleStudy(initialBibleStudy);
        setFinalPrayer(initialFinalPrayer);
        setMwbWeek(null);
        return;
    };

    const key = getWeekStorageKey(selectedWeek);
    const savedData = localStorage.getItem(key);

    // Helpers to merge with defaults and pad arrays to expected length
    const ensureMinistryArray = (arr: any): MinistryAssignment[] => {
      const base = initialMinistryAssignments;
      if (!Array.isArray(arr) || arr.length === 0) return base;
      return base.map((def, i) => ({ ...def, ...(arr[i] || {}) }));
    };
    const ensureLifeArray = (arr: any): ChristianLifePart[] => {
      const base = initialChristianLifeParts;
      if (!Array.isArray(arr) || arr.length === 0) return base;
      return base.map((def, i) => ({ ...def, ...(arr[i] || {}) }));
    };

    if (savedData) {
      try {
        const data: Partial<WeeklyMeetingData> = JSON.parse(savedData);
        setJoyeauxData({ ...(initialJoyeauxData as any), ...(data.joyeauxData as any) });
        setMinistryAssignments(ensureMinistryArray(data.ministryAssignments));
        setMinistryAssignments2(ensureMinistryArray(data.ministryAssignments2));
        setChristianLifeParts(ensureLifeArray(data.christianLifeParts));
        setBibleStudy({ ...(initialBibleStudy as any), ...(data.bibleStudy as any) });
        setFinalPrayer({ ...(initialFinalPrayer as any), ...(data.finalPrayer as any) });
        setMwbWeek((data.mwbWeek as any) || null);
      } catch (e) {
        console.warn('WeeklyMeetingData corrompu. Réinitialisation aux valeurs par défaut.', e);
        setJoyeauxData(initialJoyeauxData);
        setMinistryAssignments(initialMinistryAssignments);
        setMinistryAssignments2(initialMinistryAssignments);
        setChristianLifeParts(initialChristianLifeParts);
        setBibleStudy(initialBibleStudy);
        setFinalPrayer(initialFinalPrayer);
        setMwbWeek(null);
      }
    } else {
      setJoyeauxData(initialJoyeauxData);
      setMinistryAssignments(initialMinistryAssignments);
      setMinistryAssignments2(initialMinistryAssignments);
      setChristianLifeParts(initialChristianLifeParts);
      setBibleStudy(initialBibleStudy);
      setFinalPrayer(initialFinalPrayer);
      setMwbWeek(null);
    }
  }, [selectedWeek]);

  React.useEffect(() => {
    if (!selectedWeek) return;

    const dataToSave: WeeklyMeetingData = {
      joyeauxData,
      ministryAssignments,
      ministryAssignments2,
      christianLifeParts,
      bibleStudy,
      finalPrayer,
      mwbWeek,
    };
    
    const key = getWeekStorageKey(selectedWeek);
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }, [selectedWeek, joyeauxData, ministryAssignments, ministryAssignments2, christianLifeParts, bibleStudy, finalPrayer, mwbWeek]);

  // --- Handlers for Action Bar ---
  const weekKey = selectedWeek ? format(selectedWeek, 'yyyy-MM-dd') : null;

  // Handlers pour l'interface classique
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

  const handleYearChange = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 12) : addMonths(prev, 12));
  }

  const toggleMonth = (monthIndex: number) => {
    setOpenMonth(prevOpenMonth => (prevOpenMonth === monthIndex ? -1 : monthIndex));
  };

  return (
    <div className="flex gap-6 min-h-screen print-tight">
      {/* Nouvelle interface VCM moderne */}
      {showVcmManager ? (
        <div className="flex-1 space-y-6">
          {/* En-tête avec basculement de vue */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Réunion Vie et Ministère Chrétien</h1>
            <Button variant="outline" onClick={toggleVcmView}>
              Vue classique
            </Button>
          </div>

          {/* Layout à deux colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Colonne 1: Sélecteur de semaine */}
            <div className="lg:col-span-1">
              <WeekSelector
                selectedWeek={selectedWeek}
                onWeekSelect={setSelectedWeek}
                currentMonth={currentDate}
                onMonthChange={setCurrentDate}
              />
            </div>

            {/* Colonne 2-4: Gestionnaire VCM */}
            <div className="lg:col-span-3">
              <VcmManager
                selectedWeek={selectedWeek}
                people={people}
                onDataLoaded={handleVcmDataLoaded}
              />
            </div>
          </div>
        </div>
      ) : (
        // Interface classique existante
        <>
          <Card className="flex-shrink-0 w-[200px] flex flex-col no-print">
            <CardContent className="p-2">
                <div className="flex items-center justify-between px-2 pb-2">
                    <Button variant="ghost" size="icon" onClick={() => handleYearChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="font-bold text-lg">{currentDate.getFullYear()}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleYearChange('next')}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <div>
                    {generateMonths().map((month, index) => (
                       <Collapsible key={index} open={openMonth === index} onOpenChange={() => toggleMonth(index)} className="w-full">
                            <CollapsibleTrigger asChild>
                                 <Button 
                                    variant={selectedWeek && selectedWeek.getMonth() === month.getMonth() ? "secondary" : "ghost"}
                                    className="w-full justify-start capitalize text-sm font-semibold h-9"
                                >
                                    {format(month, 'MMMM yyyy', { locale: fr })}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pl-4">
                                <div className="space-y-0.5">
                                    {getWeeksForMonth(month).map((week, weekIndex) => {
                                        const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
                                        const weekLabel = `${format(week, 'dd')} - ${format(weekEnd, 'dd')}`;
                                        
                                        return (
                                            <Button 
                                                key={weekIndex}
                                                variant={selectedWeek && format(selectedWeek, 'yyyy-MM-dd') === format(week, 'yyyy-MM-dd') ? "default" : "ghost"}
                                                size="sm"
                                                className="w-full justify-start text-xs h-8"
                                                onClick={() => setSelectedWeek(week)}
                                            >
                                                {weekLabel}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            </CardContent>
        </Card>

        <div className="flex-1">
          {/* Bouton pour basculer vers la nouvelle vue */}
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Vue Classique</h1>
            <Button variant="outline" onClick={toggleVcmView}>
              Nouvelle interface VCM
            </Button>
          </div>

          {/* Interface classique existante continue ici... */}
          {selectedWeek ? (
            <FullMeetingBlock
              key={weekKey}
              people={people}
              room={room}
              onChangeRoom={setRoom}
              disabled={busy}
              joyeauxData={joyeauxData}
              onChangeJoyeaux={setJoyeauxData}
              ministryAssignments={ministryAssignments}
              ministryAssignments2={ministryAssignments2}
              onChangeMinistry={setMinistryAssignments}
              onChangeMinistry2={setMinistryAssignments2}
              christianLifeParts={christianLifeParts}
              onChangeChristianLifeParts={setChristianLifeParts}
              bibleStudy={bibleStudy}
              onChangeBibleStudy={setBibleStudy}
              finalPrayer={finalPrayer}
              onChangeFinalPrayer={setFinalPrayer}
              mwbWeek={mwbWeek}
            />
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Sélectionnez une semaine
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Choisissez une semaine dans le calendrier pour voir le programme
              </p>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}