'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Zap,
  Eraser,
  Trash2,
  Printer,
  Globe,
  ChevronDown,
  ChevronsUpDown,
  Diamond,
  Users,
  Heart,
  Plus,
  Minus,
  Save,
  Check,
  X
} from 'lucide-react';
import { format, addDays, startOfWeek, getWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePeople } from '@/context/people-context';
import { useToast } from '@/hooks/use-toast';
import type { Person } from '@/app/personnes/page';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Générateur de numéros de cantiques (1-200)
function generateSongNumbers() {
  return Array.from({ length: 200 }, (_, i) => (i + 1).toString());
}

// Types pour les données VCM
interface MinistryPart {
  type: string;
  studentId: string | null;
  assistantId: string | null;
}

interface ChristianLifePart {
  theme: string;
  participantId: string | null;
  duration: number;
}

interface VCMWeekData {
  ministryParts: MinistryPart[];
  christianLifeParts: ChristianLifePart[];
}

// Types pour les données normalisées du site JW
interface VCMItem {
  type: string;
  title: string;
  theme: string;
  duration?: number;
  songNumber?: number;
  scriptures?: string;
}

interface VCMSection {
  key: string;
  title: string;
  items: VCMItem[];
}

interface VCMWeek {
  weekTitle: string;
  startDate: string | null;
  endDate: string | null;
  sourceUrl: string;
  sections: VCMSection[];
}

interface VCMNormalizedData {
  weeks: VCMWeek[];
}

const DEFAULT_SONGS = {
  opening: '42',
  middle: '160',
  closing: '34',
} as const;

const formatPersonName = (person: Person) => {
  const fallback = [person.firstName, person.middleName, person.lastName, person.suffix]
    .filter(Boolean)
    .join(' ')
    .trim();
  return (person.displayName && person.displayName.trim()) || fallback || 'Sans nom';
};

type PersonOption = {
  value: string;
  label: string;
};

interface PersonSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: PersonOption[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
  emptyLabel?: string;
  valueLabel?: string | null;
}

const PersonSelect = ({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false,
  emptyLabel = 'Aucune personne disponible',
  valueLabel = null,
}: PersonSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const selectedOption = React.useMemo(
    () => options.find(option => option.value === value) ?? null,
    [options, value]
  );

  const displayLabel = React.useMemo(() => {
    if (valueLabel && value) {
      return valueLabel;
    }
    return selectedOption?.label ?? null;
  }, [selectedOption?.label, value, valueLabel]);

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (value === selectedValue) {
        onChange(null);
        return;
      }
      onChange(selectedValue);
    },
    [onChange, value]
  );

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-44 h-6 justify-between text-xs truncate px-2',
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
        >
          <span className="truncate text-left">
            {displayLabel || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder="Rechercher..." className="text-xs" />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  className="text-xs"
                  onSelect={() => {
                    handleSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-3 w-3',
                      selectedOption?.value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
              {value && (
                <CommandItem
                  value="__clear__"
                  className="text-xs text-red-600"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <X className="mr-2 h-3 w-3" />
                  Effacer la sélection
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const WEEK_FORMAT = 'yyyy-MM-dd';
const STORAGE_KEY = 'vcm-manager-schedule';
const MINISTRY_TYPE_OPTIONS: string[] = [
  'Aucun',
  'Premier contact',
  'Nouvelle visite',
  'Cours biblique',
  "Discours d'élève",
  'Vidéo',
  'Discours',
  'Discussion',
  'Engage la conversation',
  "Entretiens l'intérêt",
  'Fais des disciples',
  'Explique tes croyances - Discours',
  'Explique tes croyances - Démo',
  'Engagement',
  "Entretien d'intérêt",
  'Autre'
];

// Interface exacte du modèle VCM jw.org
export default function ReunionVieMinisterePage() {
  const [selectedWeek, setSelectedWeek] = React.useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentHall, setCurrentHall] = React.useState<1 | 2>(1);
  const [songs, setSongs] = React.useState(() => ({ ...DEFAULT_SONGS }));
  const [assignments, setAssignments] = React.useState<Record<string, string>>({});
  const [habitualAttendance, setHabitualAttendance] = React.useState('2');
  const [vcmWeekData, setVcmWeekData] = React.useState<VCMWeekData | null>(null);
  const [vcmNormalizedData, setVcmNormalizedData] = React.useState<VCMNormalizedData | null>(null);
  const [vcmNormalizedWeek, setVcmNormalizedWeek] = React.useState<VCMWeek | null>(null);
  const normalizedDataUrlRef = React.useRef(`/vcm/fr/vcm-program.normalized.json?v=${Date.now()}`);
  const assignmentsUrlRef = React.useRef(`/vcm-program.json?v=${Date.now()}`);
  const [ministryCategories, setMinistryCategories] = React.useState<Record<string, string>>({});
  const [ministryCategoryCache, setMinistryCategoryCache] = React.useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = React.useState('');

  const normalizeCategorySource = React.useCallback((value: string | undefined) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/['’]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const determineMinistryCategory = React.useCallback((part: { title: string; type: string; category?: string }) => {
    const source = `${normalizeCategorySource(part.title)} ${normalizeCategorySource(part.category)}`.trim();
    if (!source && part.type === "discours") {
      return "Discours";
    }
    if (source.includes("engage la conversation") || source.includes("engagement")) return "Engagement";
    if (source.includes("entretiens l interet") || source.includes("entretien l interet") || source.includes("interet")) return "Entretien d'intérêt";
    if (source.includes("discussion")) return "Discussion";
    if (source.includes("discours") || part.type === "discours") return "Discours";
    return "Autre";
  }, [normalizeCategorySource]);
  
  const { people, isLoaded } = usePeople();
  const { toast } = useToast();

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const storedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (!storedRaw) {
        return;
      }
      const parsed = JSON.parse(storedRaw);
      if (parsed && typeof parsed === 'object') {
        const initialCache: Record<string, Record<string, string>> = {};
        Object.entries(parsed).forEach(([weekKey, value]) => {
          if (value && typeof value === 'object' && 'ministryCategories' in value) {
            const categories = (value as any).ministryCategories;
            if (categories && typeof categories === 'object') {
              initialCache[weekKey] = { ...(categories as Record<string, string>) };
            }
          }
        });
        if (Object.keys(initialCache).length) {
          setMinistryCategoryCache(initialCache);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories ministère stockées :', error);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const weekKey = format(selectedWeek, WEEK_FORMAT);

    try {
      const storedRaw = window.localStorage.getItem(STORAGE_KEY);
      if (!storedRaw) {
        setAssignments({});
        setNotes('');
        setSongs({ ...DEFAULT_SONGS });
        return;
      }

      const parsed = JSON.parse(storedRaw);
      const weekData = parsed?.[weekKey];

      if (weekData && typeof weekData === 'object') {
        setAssignments(weekData.assignments ?? {});
        if (weekData.songs && typeof weekData.songs === 'object') {
          setSongs(prev => ({ ...prev, ...weekData.songs }));
        } else {
          setSongs({ ...DEFAULT_SONGS });
        }

        if (typeof weekData.notes === 'string') {
          setNotes(weekData.notes);
        } else {
          setNotes('');
        }

        if (weekData.hall === 1 || weekData.hall === 2) {
          setCurrentHall(weekData.hall);
        }

        if (weekData.ministryCategories && typeof weekData.ministryCategories === 'object') {
          setMinistryCategories({ ...weekData.ministryCategories });
          setMinistryCategoryCache(prev => ({
            ...prev,
            [weekKey]: { ...(weekData.ministryCategories as Record<string, string>) },
          }));
        }
      } else {
        setAssignments({});
        setNotes('');
        setSongs({ ...DEFAULT_SONGS });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données VCM pour la semaine :', error);
    }
  }, [selectedWeek]);

  // Charger les données VCM normalisées depuis le site JW
  React.useEffect(() => {
    let cancelled = false;

  fetch(normalizedDataUrlRef.current, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: VCMNormalizedData) => {
        if (cancelled) return;
        setVcmNormalizedData(data);
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Erreur lors du chargement des données VCM normalisées:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!vcmNormalizedData) {
      setVcmNormalizedWeek(null);
      return;
    }

  const weekKey = format(selectedWeek, WEEK_FORMAT);
    console.log('🔍 Recherche semaine pour:', weekKey);

    const matchingWeek = vcmNormalizedData.weeks.find(w => {
      if (w.startDate === weekKey) return true;

      if (w.startDate && w.endDate) {
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        const current = new Date(weekKey);
        return current >= start && current <= end;
      }
      return false;
    });

    if (matchingWeek) {
      console.log('✅ Semaine trouvée:', matchingWeek.weekTitle);
      setVcmNormalizedWeek(matchingWeek);
    } else {
      console.log('❌ Aucune semaine trouvée. Semaines disponibles:', vcmNormalizedData.weeks.map(w => `${w.startDate} - ${w.weekTitle}`));
      setVcmNormalizedWeek(null);
    }
  }, [selectedWeek, vcmNormalizedData]);

  // Charger les données d'attribution (studentId, assistantId) pour la semaine
  React.useEffect(() => {
  const weekKey = format(selectedWeek, WEEK_FORMAT);
  fetch(assignmentsUrlRef.current, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data[weekKey]) {
          setVcmWeekData(data[weekKey]);
        } else {
          setVcmWeekData(null);
        }
      })
      .catch(err => {
        console.error('Erreur lors du chargement des données d\'attribution VCM:', err);
      });
  }, [selectedWeek]);

  // Calculer les données VCM en fonction de la semaine sélectionnée
  const vcmData = React.useMemo(() => {
    const fallbackTreasures = [
      { id: 'president', title: 'Président', type: 'assignment', duration: null },
      { id: 'prayer', title: 'Prière du début', type: 'assignment', duration: null },
      { id: 'discourse', title: 'Des manières de révérer notre grand Dieu', type: 'discourse', duration: 10, number: 1 },
      { id: 'gems', title: 'Perles spirituelles', type: 'gems', duration: 10, number: 2 },
      { id: 'bible', title: 'Lecture de la Bible', type: 'bible_reading', duration: null, number: 3 }
    ];

    const fallbackMinistry = [
      { id: 'min1', title: 'Engage la conversation', type: 'ministry', duration: 1, number: 4, category: 'Engage la conversation' },
      { id: 'min2', title: 'Engage la conversation', type: 'ministry', duration: 2, number: 5, category: 'Engage la conversation' },
      { id: 'min3', title: 'Entretiens l\'intérêt', type: 'ministry', duration: 3, number: 6, category: 'Entretiens l\'intérêt' },
      { id: 'min4', title: 'Fais des disciples', type: 'ministry', duration: 5, number: 7, category: 'Fais des disciples' }
    ];

    const fallbackChristianLife = [
      { id: 'life1', title: 'Te sers-tu de l\'appendice « Des vérités bibliques toutes simples »', type: 'part', duration: 15, number: 7, category: 'Partie Vie Chrétienne' },
      { id: 'life2', title: '', type: 'part', duration: 0, number: null, category: 'Partie Vie Chrétienne' },
      { id: 'life3', title: '', type: 'part', duration: 0, number: null, category: 'Partie Vie Chrétienne' },
      { id: 'study', title: 'Étude biblique de l\'assemblée', description: '(30 min) lft histoires 24-25.', type: 'study', duration: 30, number: null },
      { id: 'final_prayer', title: 'Prière finale', type: 'prayer', duration: null, number: null }
    ];

    // Obtenir les parties Joyaux (Trésor de la Parole de Dieu)
    let treasuresParts = fallbackTreasures;
    if (vcmNormalizedWeek) {
      const treasuresSection = vcmNormalizedWeek.sections.find(s => s.key === 'joyaux');
      if (treasuresSection && treasuresSection.items.length > 0) {
        // Garder président et prière du début
        treasuresParts = [
          fallbackTreasures[0], // Président
          fallbackTreasures[1], // Prière du début
        ];
        
        // Ajouter les items du site (discours, perles spirituelles, etc.)
        treasuresSection.items.forEach((item, idx) => {
          const number = typeof item.number === 'number' ? item.number : idx + 1;
          treasuresParts.push({
            id: `treasure${idx + 1}`,
            title: item.theme || item.title,
            type: item.type as any,
            duration: item.duration || 10,
            number
          });
        });
        
        // Ajouter lecture de la Bible à la fin si elle n'est pas déjà là
        if (!treasuresParts.find(p => p.type === 'bible_reading')) {
          treasuresParts.push(fallbackTreasures[4]); // Lecture de la Bible
        }
      }
    }

    // Obtenir les parties ministère
    let ministryParts = fallbackMinistry;
    if (vcmNormalizedWeek) {
      const ministrySection = vcmNormalizedWeek.sections.find(s => s.key === 'ministere');
      if (ministrySection && ministrySection.items.length > 0) {
        ministryParts = ministrySection.items.map((item, idx) => {
          const number = typeof item.number === 'number' ? item.number : idx + 4;
          return {
          id: `min${idx + 1}`,
          title: item.theme || item.title,
            type: item.type || 'ministry',
          duration: item.duration || 0,
            number,
            category: item.title
          };
        });
      }
    }

    // Obtenir les parties vie chrétienne
    let christianLifeParts = fallbackChristianLife;
    if (vcmNormalizedWeek) {
      const lifeSection = vcmNormalizedWeek.sections.find(s => s.key === 'vie_chretienne');
      if (lifeSection && lifeSection.items.length > 0) {
        // Séparer les parties normales de l'étude biblique
        const regularParts = lifeSection.items.filter(item => item.type !== 'study');
        const studyPart = lifeSection.items.find(item => item.type === 'study');
        
        // Créer les parties normales
        const lifeParts = regularParts.map((item, idx) => {
          const number = typeof item.number === 'number' ? item.number : idx + 7;
          return {
          id: `life${idx + 1}`,
          title: item.theme || item.title,
          type: 'part',
          duration: item.duration || 0,
            number,
            category: 'Partie Vie Chrétienne'
          };
        });
        
        // Créer l'étude biblique si elle existe
        const studyItem = studyPart ? {
          id: 'study',
          title: studyPart.theme || studyPart.title,
          type: 'study',
          duration: studyPart.duration || 30,
          number: typeof studyPart.number === 'number' ? studyPart.number : null,
          category: undefined
        } : fallbackChristianLife[3];
        
        // Assembler toutes les parties
        christianLifeParts = [
          ...lifeParts,
          studyItem as any, // Étude biblique
          fallbackChristianLife[4]  // Prière finale
        ];
      }
    }

    const weekPeriod = vcmNormalizedWeek?.weekTitle || 
                       (format(selectedWeek, 'MMMM dd', { locale: fr }) + '-' + format(addDays(selectedWeek, 6), 'dd', { locale: fr }));

    return {
      weekPeriod,
      book: "Joyaux de la Parole de Dieu",
      sections: {
        treasures: treasuresParts,
        ministry: ministryParts,
        christianLife: christianLifeParts
      }
    };
  }, [vcmNormalizedWeek, selectedWeek]);

  React.useEffect(() => {
    if (!vcmData.sections.ministry.length) {
      setMinistryCategories({});
      return;
    }

    const weekKey = format(selectedWeek, WEEK_FORMAT);
    const cached = ministryCategoryCache[weekKey];
    if (cached) {
      setMinistryCategories({ ...cached });
      return;
    }

    const defaults: Record<string, string> = {};
    vcmData.sections.ministry.forEach(part => {
      defaults[part.id] = part.category || determineMinistryCategory(part);
    });
    setMinistryCategories(defaults);
    setMinistryCategoryCache(prev => ({
      ...prev,
      [weekKey]: { ...defaults },
    }));
  }, [selectedWeek, vcmData.sections.ministry, ministryCategoryCache, determineMinistryCategory]);

  // Sauvegarde automatique des attributions dans localStorage
  React.useEffect(() => {
    if (Object.keys(assignments).length === 0) return;
    
    const STORAGE_KEY = 'reunion_assignments';
    try {
      const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      const updated = { ...existing, ...assignments };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
    }
  }, [assignments]);

  // Mock people data
  const mockPeople = React.useMemo(
    () =>
      [
        { id: '1', firstName: 'Jean', lastName: 'Dupont', spiritual: { active: true, function: 'elder' }, gender: 'male', child: false },
        { id: '2', firstName: 'Marie', lastName: 'Martin', spiritual: { active: true, function: 'servant' }, gender: 'female', child: false },
        { id: '3', firstName: 'Pierre', lastName: 'Bernard', spiritual: { active: true, function: 'publisher' }, gender: 'male', child: false },
        { id: '4', firstName: 'Sophie', lastName: 'Durand', spiritual: { active: true, function: 'publisher' }, gender: 'female', child: false },
        { id: '5', firstName: 'Paul', lastName: 'Moreau', spiritual: { active: true, function: 'unbaptized' }, gender: 'male', child: true },
      ] as Person[],
    []
  );

  const activePeople = React.useMemo(() => {
    if (isLoaded && people.length > 0) {
      return people.filter((p: any) => p.spiritual?.active);
    }
    return mockPeople;
  }, [people, isLoaded, mockPeople]);

  const elders = React.useMemo(() => {
    if (isLoaded && people.length > 0) {
      return people.filter((p: any) => p.spiritual?.function === 'elder');
    }
    return mockPeople.filter(p => p.spiritual.function === 'elder');
  }, [people, isLoaded, mockPeople]);

  const eldersAndServants = React.useMemo(() => {
    if (isLoaded && people.length > 0) {
      return people.filter((p: any) => p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant');
    }
    return mockPeople.filter(p => p.spiritual.function === 'elder' || p.spiritual.function === 'servant');
  }, [people, isLoaded, mockPeople]);

  const brothersAndChildren = React.useMemo(() => {
    if (isLoaded && people.length > 0) {
      return people.filter((p: any) => p.gender === 'male' || p.child === true);
    }
    return mockPeople.filter((p: any) => p.gender === 'male' || p.child === true);
  }, [people, isLoaded, mockPeople]);

  const brothers = React.useMemo(() => {
    if (isLoaded && people.length > 0) {
      return people.filter((p: any) => p.gender === 'male');
    }
    return mockPeople.filter((p: any) => p.gender === 'male');
  }, [people, isLoaded, mockPeople]);

  const peopleById = React.useMemo(() => {
    const map = new Map<string, Person>();
    const source = isLoaded && people.length > 0 ? people : mockPeople;
    source.forEach((person: Person) => {
      if (person?.id) {
        map.set(person.id, person);
      }
    });
    return map;
  }, [isLoaded, people, mockPeople]);

  const buildPersonOptions = React.useCallback(
    (list: Person[]) =>
      list
        .filter(person => Boolean(person?.id))
        .map(person => ({
          value: person.id,
          label: formatPersonName(person),
        })),
    []
  );

  const personOptions = React.useMemo(
    () => ({
      active: buildPersonOptions(activePeople),
      elders: buildPersonOptions(elders),
      eldersAndServants: buildPersonOptions(eldersAndServants),
      brothers: buildPersonOptions(brothers),
      brothersAndChildren: buildPersonOptions(brothersAndChildren),
    }),
    [activePeople, elders, eldersAndServants, brothers, brothersAndChildren, buildPersonOptions]
  );

  const songNumbers = generateSongNumbers();

  const makeAssignmentKey = React.useCallback(
    (base: string, hallAware = true, hallValue: 1 | 2 = currentHall) =>
      hallAware ? `hall${hallValue}:${base}` : base,
    [currentHall]
  );

  const getAssignmentValue = React.useCallback(
    (base: string, hallAware = true, hallValue: 1 | 2 = currentHall) => {
      const key = makeAssignmentKey(base, hallAware, hallValue);
      return assignments[key] ?? null;
    },
    [assignments, makeAssignmentKey, currentHall]
  );

  const setAssignmentValue = React.useCallback(
    (base: string, value: string | null, hallAware = true, hallValue: 1 | 2 = currentHall) => {
      const key = makeAssignmentKey(base, hallAware, hallValue);
      setAssignments(prev => {
        const next = { ...prev };
        if (value && value.trim() !== '') {
          next[key] = value;
        } else {
          delete next[key];
        }
        return next;
      });
    },
    [makeAssignmentKey, currentHall]
  );

  const getPersonName = React.useCallback(
    (personId: string | null) => {
      if (!personId) return 'Non attribué';
      const person = peopleById.get(personId);
      return person ? formatPersonName(person) : 'Non trouvé';
    },
    [peopleById]
  );

  const getAssignmentLabel = React.useCallback(
    (assignmentValue: string | null) => {
      if (!assignmentValue) {
        return null;
      }
      const person = peopleById.get(assignmentValue);
      return person ? formatPersonName(person) : assignmentValue;
    },
    [peopleById]
  );

  const withHallChange = React.useCallback(
    (targetHall: 1 | 2) => {
      setCurrentHall(targetHall);
    },
    []
  );

  const createAssignmentBinding = React.useCallback(
    (key: string, hallAware = true, hallValue: 1 | 2 = currentHall) => {
      const value = getAssignmentValue(key, hallAware, hallValue);
      return {
        value,
        valueLabel: getAssignmentLabel(value),
        onChange: (newValue: string | null) => setAssignmentValue(key, newValue, hallAware, hallValue),
      };
    },
    [currentHall, getAssignmentLabel, getAssignmentValue, setAssignmentValue]
  );

  // Composant pour afficher les informations de participation
  const ParticipationInfo = ({ 
    studentId, 
    assistantId 
  }: { 
    studentId: string | null; 
    assistantId: string | null;
  }) => (
    <div className="p-3 space-y-2 min-w-[200px]">
      <div className="font-semibold text-sm border-b pb-1">Participation du cahier</div>
      <div className="space-y-1 text-xs">
        <div>
          <span className="font-medium">Élève/Student:</span>
          <div className="text-gray-700">{getPersonName(studentId)}</div>
        </div>
        <div>
          <span className="font-medium">Interlocuteur/Assistant:</span>
          <div className="text-gray-700">{getPersonName(assistantId)}</div>
        </div>
      </div>
    </div>
  );

  // Navigation entre les semaines
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subWeeks(selectedWeek, 1) 
      : addWeeks(selectedWeek, 1);
    setSelectedWeek(newWeek);
  };

  // Fonctions d'action des boutons
  const handleAutoAssign = React.useCallback(() => {
    const hall = currentHall;
    const hallPrefix = `hall${hall}:`;

    const existingForHall = Object.entries(assignments).reduce<Record<string, string>>((acc, [key, value]) => {
      if (key.startsWith(hallPrefix) && value) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const usedIds = new Set<string>(Object.values(existingForHall));

    const chooseCandidate = (pool: Person[]) => {
      if (!pool.length) return null;
      const available = pool.find(person => person?.id && !usedIds.has(person.id));
      if (available?.id) {
        usedIds.add(available.id);
        return available.id;
      }
      const fallback = pool[0];
      if (fallback?.id) {
        usedIds.add(fallback.id);
        return fallback.id;
      }
      return null;
    };

    const neededAssignments: Record<string, string> = {};

    const assignIfEmpty = (slotKey: string, pool: Person[], hallAware = true) => {
      const fullKey = makeAssignmentKey(slotKey, hallAware, hall);
      if (assignments[fullKey]) {
        if (assignments[fullKey]) {
          usedIds.add(assignments[fullKey]);
        }
        return;
      }
      const candidateId = chooseCandidate(pool);
      if (candidateId) {
        neededAssignments[fullKey] = candidateId;
      }
    };

    assignIfEmpty('treasures_president', eldersAndServants);
    assignIfEmpty('treasures_opening_prayer', brothers);
    assignIfEmpty('treasures_discourse', eldersAndServants);
    assignIfEmpty('treasures_gems', eldersAndServants);
    assignIfEmpty('bible_reading', brothersAndChildren);

    vcmData.sections.ministry.forEach((_, index) => {
      assignIfEmpty(`ministry_${index}_student`, activePeople);
      assignIfEmpty(`ministry_${index}_assistant`, brothersAndChildren);
    });

    vcmData.sections.christianLife
      .filter(part => part.type !== 'study' && part.type !== 'prayer')
      .forEach((_, index) => {
        assignIfEmpty(`life_${index}_participant`, eldersAndServants);
      });

    assignIfEmpty('study_conductor', elders, false);
    assignIfEmpty('study_reader', brothers, false);
    assignIfEmpty('closing_prayer', brothers, false);

    if (Object.keys(neededAssignments).length === 0) {
      toast({
        title: 'Saisie automatique',
        description: 'Aucune attribution supplémentaire à remplir pour cette salle.',
      });
      return;
    }

    setAssignments(prev => ({ ...prev, ...neededAssignments }));
    toast({
      title: 'Saisie automatique',
      description: `${Object.keys(neededAssignments).length} attributions ont été complétées pour la salle ${hall}.`,
    });
  }, [activePeople, assignments, brothers, brothersAndChildren, currentHall, elders, eldersAndServants, makeAssignmentKey, toast, vcmData.sections.christianLife, vcmData.sections.ministry]);

  const handleClearAssignments = () => {
    setAssignments({});
    setMinistryCategories({});
    setNotes('');
    const weekKey = format(selectedWeek, WEEK_FORMAT);
    setMinistryCategoryCache(prev => {
      if (!(weekKey in prev)) {
        return prev;
      }
      const { [weekKey]: _removed, ...rest } = prev;
      return rest;
    });
    toast({ title: "Effacer attribution", description: "Toutes les attributions ont été effacées" });
  };

  const handleDeleteMeetingData = () => {
    setAssignments({});
    setSongs({ opening: '', middle: '', closing: '' });
    setMinistryCategories({});
    setNotes('');
    const weekKey = format(selectedWeek, WEEK_FORMAT);
    setMinistryCategoryCache(prev => {
      if (!(weekKey in prev)) {
        return prev;
      }
      const { [weekKey]: _removed, ...rest } = prev;
      return rest;
    });
    toast({ title: "Supprimer données", description: "Données de la réunion supprimées" });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenWol = () => {
    window.open('https://wol.jw.org/fr', '_blank');
  };

  const handleSaveData = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const weekKey = format(selectedWeek, WEEK_FORMAT);

    try {
      const existingRaw = window.localStorage.getItem(STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const categoriesSnapshot = { ...ministryCategories };
      existing[weekKey] = {
        assignments,
        songs,
        hall: currentHall,
        ministryCategories: categoriesSnapshot,
        notes,
        savedAt: new Date().toISOString()
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      setMinistryCategoryCache(prev => ({
        ...prev,
        [weekKey]: categoriesSnapshot,
      }));
      toast({ title: 'Données sauvegardées', description: 'Les informations de la semaine ont été enregistrées.' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données VCM :', error);
  toast({ title: 'Erreur de sauvegarde', description: 'Impossible d\'enregistrer les données.', variant: 'destructive' });
    }
  }, [assignments, songs, currentHall, ministryCategories, notes, selectedWeek, toast]);

  const treasuresPresidentBinding = createAssignmentBinding('treasures_president');
  const treasuresOpeningPrayerBinding = createAssignmentBinding('treasures_opening_prayer');
  const treasuresDiscourseBinding = createAssignmentBinding('treasures_discourse');
  const treasuresGemsBinding = createAssignmentBinding('treasures_gems');
  const bibleReadingBinding = createAssignmentBinding('bible_reading');
  const studyConductorBinding = createAssignmentBinding('study_conductor', false);
  const studyReaderBinding = createAssignmentBinding('study_reader', false);
  const closingPrayerBinding = createAssignmentBinding('closing_prayer', false);

  return (
    <div className="h-screen bg-gray-50 p-1 overflow-hidden">
      <div className="max-w-full mx-auto h-full flex flex-col">
        {/* En-tête avec navigation et boutons d'action - Une seule ligne */}
        <div className="bg-white rounded-lg shadow-sm mb-1 p-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Section gauche: Navigation + Boutons d'action */}
            <div className="flex items-center gap-2">
              {/* Navigation de semaine */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <span className="text-xs font-medium min-w-[100px] text-center">
                {format(selectedWeek, 'MMM dd', { locale: fr })} - {format(addDays(selectedWeek, 6), 'dd, yyyy', { locale: fr })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>

              {/* Boutons d'action avec icônes seulement */}
              <div className="flex items-center gap-1 ml-4">
                <Button variant="outline" size="sm" onClick={handleSaveData} className="h-8 w-8 p-0" title="Sauvegarder">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleAutoAssign} className="h-8 w-8 p-0" title="Saisie automatique">
                  <Zap className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAssignments} className="h-8 w-8 p-0" title="Effacer attribution">
                  <Eraser className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteMeetingData} className="h-8 w-8 p-0" title="Supprimer données">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Centre avec titre */}
            <div className="text-center">
              <h1 className="text-xl font-bold">Vie chrétienne et ministère</h1>
              <h2 className="text-red-600 font-bold text-sm">
                {format(selectedWeek, 'MMMM dd', { locale: fr })}-{format(addDays(selectedWeek, 6), 'dd', { locale: fr })}
              </h2>
              {/* Afficher "Assemblée de circonscription" seulement pour des semaines spéciales */}
              {(format(selectedWeek, 'MM-dd') === '10-06' || format(selectedWeek, 'MM-dd') === '04-06') && (
                <h2 className="text-sm font-semibold">Assemblée de circonscription</h2>
              )}
            </div>

            {/* Section droite: Cantiques + Boutons + Salle + Nombre */}
            <div className="flex items-center gap-2">
              {/* Cantiques */}
              <div className="flex items-center gap-1">
                <span className="text-xs">Cantiques</span>
                <Select value={songs.opening} onValueChange={(value) => setSongs(prev => ({ ...prev, opening: value }))}>
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {songNumbers.map(num => (
                      <SelectItem key={num} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={songs.middle} onValueChange={(value) => setSongs(prev => ({ ...prev, middle: value }))}>
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {songNumbers.map(num => (
                      <SelectItem key={num} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={songs.closing} onValueChange={(value) => setSongs(prev => ({ ...prev, closing: value }))}>
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {songNumbers.map(num => (
                      <SelectItem key={num} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Boutons Impression et WOL */}
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 w-8 p-0" title="Impression">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenWol} className="h-8 w-8 p-0" title="wol.jw.org">
                <Globe className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal - Interface VCM condensée */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {/* Section Joyaux de la Parole de Dieu */}
          <div className="border border-blue-300 rounded">
            <div className="bg-blue-200 px-2 py-1 border-b border-blue-300">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
                <Diamond className="h-3 w-3" />
                💎 Joyaux de la Parole de Dieu
              </h3>
            </div>
            <div className="p-2 space-y-2 bg-white">
              {/* Première ligne: Président et Prière d'ouverture */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-16">Président</span>
                  <PersonSelect
                    {...treasuresPresidentBinding}
                    options={personOptions.eldersAndServants}
                    placeholder="Président"
                    disabled={personOptions.eldersAndServants.length === 0}
                  />
                </div>
                <div></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20">Prière d'ouverture</span>
                  <PersonSelect
                    {...treasuresOpeningPrayerBinding}
                    options={personOptions.brothers}
                    placeholder="Frère"
                    disabled={personOptions.brothers.length === 0}
                  />
                </div>
              </div>

              {/* Deuxième ligne: Discours, thème et Perles spirituelles */}
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-xs w-16">Discours</span>
                  <PersonSelect
                    {...treasuresDiscourseBinding}
                    options={personOptions.eldersAndServants}
                    placeholder="Orateur"
                    disabled={personOptions.eldersAndServants.length === 0}
                  />
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <span className="text-xs">1.</span>
                  <Input 
                    className="h-6 text-xs flex-1" 
                    placeholder={vcmData.sections.treasures.find(t => t.type === 'discours' || t.type === 'discourse')?.title || "Discours"} 
                  />
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs h-5">
                    {vcmData.sections.treasures.find(t => t.type === 'discours' || t.type === 'discourse')?.duration || 10} min.
                  </Badge>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                    <span className="text-xs">📄</span>
                  </Button>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <span className="text-xs w-20">2. Perles spirituelles</span>
                  <PersonSelect
                    {...treasuresGemsBinding}
                    options={personOptions.eldersAndServants}
                    placeholder="Participant"
                    disabled={personOptions.eldersAndServants.length === 0}
                  />
                  <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs h-5">10 min.</Badge>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                    <span className="text-xs">📄</span>
                  </Button>
                </div>
              </div>

              {/* Troisième ligne: Classes et boutons de gestion */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant={currentHall === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => withHallChange(1)}
                    className={`h-6 w-6 p-0 ${currentHall === 1 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800 border-blue-300'}`}
                  >
                    1
                  </Button>
                  <Button
                    variant={currentHall === 2 ? "default" : "outline"}
                    size="sm"
                    onClick={() => withHallChange(2)}
                    className={`h-6 w-6 p-0 ${currentHall === 2 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800 border-blue-300'}`}
                  >
                    2
                  </Button>
                </div>
                <div></div>
                <div className="flex items-center gap-2">
                  <Select value={habitualAttendance} onValueChange={setHabitualAttendance}>
                    <SelectTrigger className="w-12 h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['1', '2', '3', '4', '5'].map(num => (
                        <SelectItem key={num} value={num}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="Ajouter une classe">
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0" title="Supprimer une classe">
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Quatrième ligne: Lecture de la Bible */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20">
                    3. Lecture de la Bible {currentHall === 2 ? "(Salle 2)" : ""}
                  </span>
                  <PersonSelect
                    {...bibleReadingBinding}
                    options={personOptions.brothersAndChildren}
                    placeholder="Lecteur"
                    disabled={personOptions.brothersAndChildren.length === 0}
                  />
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                    <span className="text-xs">📄</span>
                  </Button>
                </div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>

          {/* Section Applique-toi au ministère */}
          <div className="border border-orange-300 rounded">
            <div className="bg-orange-200 px-2 py-1 border-b border-orange-300">
              <h3 className="font-semibold text-orange-900 flex items-center gap-2 text-sm">
                <Users className="h-3 w-3" />
                🗣️ Applique-toi au ministère {currentHall === 2 ? "(Salle 2)" : ""}
              </h3>
            </div>
            <div className="p-1 space-y-1 bg-white">
              {vcmData.sections.ministry.map((part, index) => {
                const ministryPart = vcmWeekData?.ministryParts?.[index];
                // Utiliser directement le titre du VCM (part.title = "Engage la conversation", "Entretiens l'intérêt", etc.)
                const vcmTitle = part.title || '';
                const categoryValue = ministryCategories[part.id] ?? vcmTitle ?? determineMinistryCategory(part);
                const displayNumber = typeof part.number === 'number' ? part.number : index + 4;
                const weekKey = format(selectedWeek, WEEK_FORMAT);
                const needsCustomOption = !!categoryValue && !MINISTRY_TYPE_OPTIONS.includes(categoryValue);
                const studentBinding = createAssignmentBinding(`ministry_${index}_student`);
                const assistantBinding = createAssignmentBinding(`ministry_${index}_assistant`);
                return (
                  <div key={`${part.id}_salle${currentHall}`} className="flex items-center gap-1">
                    <Select
                      value={categoryValue}
                      onValueChange={(value) => {
                        setMinistryCategories(prev => ({ ...prev, [part.id]: value }));
                        setMinistryCategoryCache(prev => ({
                          ...prev,
                          [weekKey]: {
                            ...(prev[weekKey] || {}),
                            [part.id]: value,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger className="w-48 h-6 text-xs">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {needsCustomOption && (
                          <SelectItem value={categoryValue}>{categoryValue}</SelectItem>
                        )}
                        {MINISTRY_TYPE_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <PersonSelect
                      {...studentBinding}
                      options={personOptions.active}
                      placeholder="Participant"
                      disabled={personOptions.active.length === 0}
                    />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs">{displayNumber}.</span>
                      <Input className="h-6 text-xs flex-1" value={part.title || ''} readOnly title={part.title || ''} />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                          <span className="text-xs">📄</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <ParticipationInfo 
                          studentId={ministryPart?.studentId || null}
                          assistantId={ministryPart?.assistantId || null}
                        />
                      </PopoverContent>
                    </Popover>
                    <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-xs h-5">{part.duration ? `${part.duration} min.` : '0 min.'}</Badge>
                    {categoryValue !== 'Discours' && (
                      <>
                        <span className="text-xs w-20">Interlocuteur</span>
                        <PersonSelect
                          {...assistantBinding}
                          options={personOptions.brothersAndChildren}
                          placeholder="Interlocuteur"
                          disabled={personOptions.brothersAndChildren.length === 0}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Vie chrétienne */}
          <div className="border border-red-300 rounded">
            <div className="bg-red-200 px-2 py-1 border-b border-red-300">
              <h3 className="font-semibold text-red-900 flex items-center gap-2 text-sm">
                <Heart className="h-3 w-3" />
                ❤️ Vie chrétienne
              </h3>
            </div>
            <div className="p-1 space-y-1 bg-white">
              {/* Champs supprimés */}

              {/* Parties vie chrétienne (hors étude biblique et prière finale) */}
              {vcmData.sections.christianLife
                .filter(part => part.type !== 'study' && part.type !== 'prayer')
                .map((part, idx) => {
                  const lifePart = vcmWeekData?.christianLifeParts?.[idx];
                  const participantBinding = createAssignmentBinding(`life_${idx}_participant`);
                  const subjectBinding = createAssignmentBinding(`life_${idx}_subject`, part.title || '');
                  const typeBinding = createAssignmentBinding(`life_${idx}_type`, '');
                  // Charger automatiquement le titre depuis le VCM
                  const vcmTitle = part.title || 'Partie vie chrétienne';
                  // Déterminer le type basé sur le contenu
                  const isAssemblyNeed = vcmTitle.toLowerCase().includes('besoin');
                  const selectValue = typeBinding.value || (isAssemblyNeed ? 'Besoins de l\'assemblée' : 'Partie vie chrétienne');
                  
                  return (
                    <div key={`life_part_${idx}`} className="flex items-center gap-1">
                      <Select value={selectValue} onValueChange={(value) => typeBinding.onChange(value)}>
                        <SelectTrigger className="w-48 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Partie vie chrétienne">Partie vie chrétienne</SelectItem>
                          <SelectItem value="Besoins de l'assemblée">Besoins de l'assemblée</SelectItem>
                        </SelectContent>
                      </Select>
                      <PersonSelect
                        {...participantBinding}
                        options={personOptions.eldersAndServants}
                        placeholder="Participant"
                        disabled={personOptions.eldersAndServants.length === 0}
                      />
                      <div className="flex items-center gap-1 flex-1">
                        <span className="text-xs">{part.number}.</span>
                        <Input 
                          className="h-6 text-xs flex-1" 
                          placeholder={part.title || "Sujet..."} 
                          value={subjectBinding.value || ''}
                          onChange={(e) => subjectBinding.onChange(e.target.value)}
                          readOnly={!isAssemblyNeed}
                          title={part.title || ''}
                        />
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                            <span className="text-xs">📄</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <div className="p-3 space-y-2 min-w-[200px]">
                            <div className="font-semibold text-sm border-b pb-1">Participation du cahier</div>
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="font-medium">Participant:</span>
                                <div className="text-gray-700">{getPersonName(lifePart?.participantId || null)}</div>
                              </div>
                              <div>
                                <span className="font-medium">Durée:</span>
                                <div className="text-gray-700">{lifePart?.duration || 0} min.</div>
                              </div>
                              {lifePart?.theme && (
                                <div>
                                  <span className="font-medium">Thème:</span>
                                  <div className="text-gray-700">{lifePart.theme}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Badge variant="secondary" className="bg-red-200 text-red-800 text-xs h-5">
                        {part.duration} min.
                      </Badge>
                      
                    </div>
                  );
                })}
              <div key="etude_biblique" className="flex items-center gap-1">
                <span className="w-48 h-6 text-xs font-semibold flex items-center">Étude biblique de l'assemblée</span>
                <PersonSelect
                  {...studyConductorBinding}
                  options={personOptions.elders}
                  placeholder="Conducteur"
                  disabled={personOptions.elders.length === 0}
                  emptyLabel="Aucun conducteur disponible"
                />
                <div className="flex items-center gap-1 flex-1">
                  <Input 
                    className="h-6 text-xs flex-1" 
                    placeholder={
                      vcmData.sections.christianLife.find(c => c.type === 'study')?.title || 
                      "(30 min) lft histoires 24-25."
                    } 
                  />
                </div>
                <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                  <span className="text-xs">📖</span>
                </Button>
                <Badge variant="secondary" className="bg-red-200 text-red-800 text-xs h-5">
                  {vcmData.sections.christianLife.find(c => c.type === 'study')?.duration || 30} min.
                </Badge>
                <span className="text-xs w-20">Lecteur</span>
                <PersonSelect
                  {...studyReaderBinding}
                  options={personOptions.brothers}
                  placeholder="Lecteur"
                  disabled={personOptions.brothers.length === 0}
                />
              </div>
              <div key="priere_finale" className="flex items-center gap-1">
                <span className="w-48 h-6 text-xs font-semibold flex items-center">Prière finale</span>
                <PersonSelect
                  {...closingPrayerBinding}
                  options={personOptions.brothers}
                  placeholder="Frère"
                  disabled={personOptions.brothers.length === 0}
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded">
            <div className="bg-gray-100 px-2 py-1 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                Notes de la semaine
              </h3>
            </div>
            <div className="p-2 bg-white space-y-2">
              <Label htmlFor="week-notes" className="text-xs text-gray-600">
                Observations, besoins locaux, rappels…
              </Label>
              <Textarea
                id="week-notes"
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Saisir les remarques importantes pour cette semaine."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}