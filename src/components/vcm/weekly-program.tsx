
'use client';

import * as React from 'react';
import { usePeople } from '@/context/people-context';
import { mapScrapedSectionsToProgram, MappedSection, ProgramItem } from '@/lib/vcm-mapper';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Person } from '@/app/personnes/page';
import { apiFetch } from '@/lib/api-client';

const log = (...a: any[]) => console.log("[VCM-Component]", ...a);

// --- PROPS ---
interface WeeklyProgramVCMProps {
  weekId: string; // ex: "2025-09-01"
}

// --- SUB-COMPONENTS ---

const SectionHeader = ({ title, color }: { title: string, color: string }) => (
    <div className={`p-2 rounded-t-md text-white font-bold ${color}`}>
        <h3>{title}</h3>
    </div>
);

const ParticipantSelector = ({ people, value, onChange }: { people: Person[], value: string | null, onChange: (personId: string | null) => void }) => (
    <Select value={value || ''} onValueChange={v => onChange(v === 'none' ? null : v)}>
        <SelectTrigger><SelectValue placeholder="Assigner..." /></SelectTrigger>
        <SelectContent>
            <SelectItem value="none">Aucun</SelectItem>
            {people.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}
        </SelectContent>
    </Select>
);

const ProgramRow = ({ item, assignment, people, onAssignmentChange }: { item: ProgramItem, assignment: string | null, people: Person[], onAssignmentChange: (partKey: string, personId: string | null) => void }) => (
    <div className="grid grid-cols-[150px_1fr_250px] gap-4 items-center border-b p-2">
        <div>
            <p className="font-semibold">{item.title}</p>
            {item.duration && <p className="text-xs text-muted-foreground">{item.duration} min</p>}
        </div>
        <p className="text-sm italic text-muted-foreground">{item.theme}</p>
        <ParticipantSelector people={people} value={assignment} onChange={(personId) => onAssignmentChange(item.key, personId)} />
    </div>
);

// --- MAIN COMPONENT ---

export function WeeklyProgramVCM({ weekId }: WeeklyProgramVCMProps) {
    const [sections, setSections] = React.useState<MappedSection[]>([]);
    const [assignments, setAssignments] = React.useState<{ [key: string]: string | null }>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const { people } = usePeople();
    const { toast } = useToast();

    const debouncedSave = React.useCallback(
        (partKey: string, personId: string | null) => {
            apiFetch(`api/vcm/${weekId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partKey, personId }),
            })
            .then(res => {
                if (!res.ok) throw new Error('La sauvegarde a échoué');
                toast({ description: "Assignation sauvegardée." });
            })
            .catch(() => toast({ variant: 'destructive', description: "Erreur de sauvegarde." }));
        },
        [weekId, toast]
    );

    React.useEffect(() => {
        if (!weekId) return;
        setIsLoading(true);
        log(`Chargement des données pour la semaine: ${weekId}`);

        async function loadWeekData() {
            try {
                // 1. Charger le programme normalisé complet
                const programRes = await fetch('/export/vcm-program.normalized.json');
                if (!programRes.ok) throw new Error("Fichier programme introuvable.");
                const allWeeks: any[] = await programRes.json();
                const weekData = allWeeks.find(w => w.startDate === weekId);

                if (!weekData) {
                    throw new Error(`Aucune donnée trouvée pour la semaine ${weekId}`);
                }

                // 2. Mapper les données brutes en structure propre
                const mapped = mapScrapedSectionsToProgram(weekData.sections);
                setSections(mapped);

                // 3. Charger les assignations pour cette semaine
                const assignmentsRes = await apiFetch(`api/vcm/${weekId}/assignments`);
                const weekAssignments = await assignmentsRes.json();
                setAssignments(weekAssignments);

            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                log("Erreur de chargement", msg);
                setSections([]); // Vider en cas d'erreur
                toast({ variant: 'destructive', title: "Erreur de chargement", description: msg });
            } finally {
                setIsLoading(false);
            }
        }

        loadWeekData();
    }, [weekId, toast]);

    const handleAssignmentChange = (partKey: string, personId: string | null) => {
        setAssignments(prev => ({ ...prev, [partKey]: personId }));
        debouncedSave(partKey, personId);
    };

    if (isLoading) {
        return <div>Chargement du programme...</div>;
    }

    if (!sections.length) {
        return <div className="text-center p-8">Aucun programme trouvé pour cette semaine. Veuillez lancer le script de scraping.</div>;
    }

    return (
        <div className="space-y-4">
            {sections.map(section => {
                const color = section.key === 'joyaux' ? 'bg-cyan-600' : section.key === 'ministere' ? 'bg-orange-500' : 'bg-red-600';
                return (
                    <div key={section.key} className="bg-muted/50 rounded-md">
                        <SectionHeader title={section.title} color={color} />
                        <div className="p-2">
                            {section.items.map(item => (
                                <ProgramRow 
                                    key={item.key} 
                                    item={item} 
                                    assignment={assignments[item.key] || null}
                                    people={people}
                                    onAssignmentChange={handleAssignmentChange}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
