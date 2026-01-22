"use client";
import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Printer, Zap, Eraser, Trash2, BookOpen } from "lucide-react";
import { VcmWeek, VcmItem, VcmSection } from "@/lib/vcmTypes";
import { loadVcmWeeks, pickWeek, buildItemId, roleForItem, isConversation, buildWolUrlForWeek } from "@/lib/vcmLoader";
import { useToast } from "@/hooks/use-toast";
import { usePeople } from "@/context/people-context";
import { Person } from "@/app/personnes/page";
import { WolButton } from "@/components/vcm/WolButton";
import { apiFetch } from "@/lib/api-client";

const NONE = "__none__";
type AssignmentPayload = { itemId: string; personId: string | null; role: string; override?: { duration?: number | null; songNumber?: number | null }; };
type Assignments = { [itemId: string]: Partial<AssignmentPayload> };

const personLabel = (person: Partial<Person> & { displayName?: string }) => {
    const fallback = [person.firstName, person.middleName, person.lastName, person.suffix]
        .filter(Boolean)
        .join(' ')
        .trim();
    return (person.displayName && person.displayName.trim()) || fallback || 'Sans nom';
};

function jwLinkFor(ref?: string): string | null { if (!ref) return null; const q = String(ref).split(/[;,]/)[0].trim(); if (!q) return null; return `https://wol.jw.org/fr/wol/s?q=${encodeURIComponent(q)}&wtlocale=F`; }
const normalize = (s?: string) => (s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
function bucketForSectionTitle(title: string): "joyaux" | "ministere" | "vie" { const t = normalize(title); if (t.includes("perles spirituelles") || t.includes("lecture de la bible") || t.includes("joyaux")) return "joyaux"; if (t.includes("engage la conversation") || t.includes("entretiens l’interet") || t.includes("explique tes croyances")) return "ministere"; if (t.includes("etude biblique de l’assemblee") || t.includes("paroles de conclusion") || t.includes("cantique")) return "vie"; return "joyaux"; }

function BigBlock({ title, color, children }: { title: string; color: "teal" | "amber" | "rose"; children: React.ReactNode; }) {
  const bg = color === "teal" ? "bg-cyan-700" : color === "amber" ? "bg-orange-600" : "bg-rose-600";
  return (
    <section className="rounded-lg border overflow-hidden" style={{ breakInside: "avoid" as any }}><header className={`${bg} text-white px-3 py-2 font-semibold`}>{title}</header><div className="p-4 bg-slate-50/60">{children}</div></section>
  );
}

function PeopleSelect({ value, onChange, placeholder = "— Assigner —", people }: { value: string | null | undefined; onChange: (id: string | null) => void; placeholder?: string; people: Person[]; }) {
    return (
        <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}><SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent><SelectItem value={NONE}>— Aucun —</SelectItem>{people.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{personLabel(p)}</SelectItem>))}</SelectContent></Select>
    );
}

const findItem = (items: VcmItem[], ...keys: string[]) => {
    for (const item of items) {
        const normTitle = normalize(item.title || item.theme);
        for (const key of keys) { if (normTitle.includes(key)) return item; }
    }
    return null;
}

export default function WeeklyProgramVCM(props: { weekStartIso: string; people: Person[]; }) {
  const [week, setWeek] = React.useState<VcmWeek | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const { people } = usePeople();
  const { toast } = useToast();

  React.useEffect(() => {
    (async () => {
        setLoading(true);
        try {
            const weeks = await loadVcmWeeks();
            const w = pickWeek(weeks, props.weekStartIso);
            setWeek(w);
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [props.weekStartIso]);

  const onAssign = (payload: any) => console.log("Assign:", payload);
  const wolUrl = React.useMemo(() => (week ? buildWolUrlForWeek(week) : null), [week]);
  const handlePrint = React.useCallback(() => { if (typeof window !== "undefined") window.print(); }, []);
  const handleClearAssignments = React.useCallback(async () => { if (!week) return; setSaving(true); try { await apiFetch(`api/vcm/${week.startDate}/assign/clear`, { method: "POST" }); toast({description: 'Assignations effacées'}); } catch(e){toast({description: 'Erreur', variant: 'destructive'})} finally { setSaving(false); } }, [week, toast]);
  const handleDeleteWeek = React.useCallback(async () => { if (!week) return; if(!confirm('Supprimer?')) return; setSaving(true); try { await apiFetch(`api/vcm/${week.startDate}`, { method: "DELETE" }); setWeek(null); toast({description: 'Réunion supprimée'}); } catch(e){toast({description: 'Erreur', variant: 'destructive'})} finally { setSaving(false); } }, [week, toast]);
  const handleAutofill = React.useCallback(async () => { /* ... */ }, [week, people]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-600">Erreur: {error}</div>;
  if (!week) return <div>Aucun programme trouvé pour la semaine {props.weekStartIso}.</div>;

  const joyauxItems = week.sections.filter(s => bucketForSectionTitle(s.title) === 'joyaux').flatMap(s => s.items);
  const discours = findItem(joyauxItems, 'discours');
  const perles = findItem(joyauxItems, 'perles spirituelles');
  const lecture = findItem(joyauxItems, 'lecture de la bible');
  const priereDebut = findItem(joyauxItems, 'prière du début');

  return (
    <div className="space-y-6">
        <div className="sticky top-2 z-10 no-print rounded-xl border bg-white/90 backdrop-blur p-3 shadow">
            <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-lg">Programme : {week.weekTitle} ({week.startDate} → {week.endDate})</div>
                <div className="ml-auto flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} disabled={!week}><Printer className="mr-2 h-4 w-4"/> Imprimer</Button>
                    <Button size="sm" onClick={handleAutofill} disabled={!week || saving || !people.length}><Zap className="mr-2 h-4 w-4"/> Saisie auto</Button>
                    <Button variant="outline" size="sm" onClick={handleClearAssignments} disabled={!week || saving}><Eraser className="mr-2 h-4 w-4"/> Effacer</Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteWeek} disabled={!week || saving}><Trash2 className="mr-2 h-4 w-4"/> Supprimer</Button>
                    <WolButton href={wolUrl ?? undefined} />
                </div>
            </div>
        </div>

        <BigBlock title="Joyaux de la Parole de Dieu" color="teal">
            <div className="p-2 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1">
                                            <Label>Président</Label>
                                            <PeopleSelect people={people} value={discours?.personId ?? null} onChange={() => {}} />
                                            {discours?.personId && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {personLabel(people.find(p => String(p.id) === String(discours.personId)) ?? {displayName: '—'})}
                                                </span>
                                            )}
                                        </div>
                                        {priereDebut && (
                                            <div className="space-y-1">
                                                <Label>{priereDebut.title}</Label>
                                                <PeopleSelect people={people} value={priereDebut.personId ?? null} onChange={() => {}} />
                                                {priereDebut.personId && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {personLabel(people.find(p => String(p.id) === String(priereDebut.personId)) ?? {displayName: '—'})}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                </div>
                <hr className="my-4"/>
                                {discours && <div className="space-y-1">
                                        <Label>Discours ({discours.duration} min)</Label>
                                        <p className="text-sm text-muted-foreground italic">{discours.theme}</p>
                                        <PeopleSelect people={people} value={discours.personId ?? null} onChange={() => {}} />
                                        {discours.personId && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {personLabel(people.find(p => String(p.id) === String(discours.personId)) ?? {displayName: '—'})}
                                            </span>
                                        )}
                                </div>}
                                {perles && <div className="space-y-1">
                                        <Label>Perles spirituelles ({perles.duration} min)</Label>
                                        <PeopleSelect people={people} value={perles.personId ?? null} onChange={() => {}} />
                                        {perles.personId && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {personLabel(people.find(p => String(p.id) === String(perles.personId)) ?? {displayName: '—'})}
                                            </span>
                                        )}
                                </div>}
                                {lecture && <div className="space-y-1">
                                        <Label>Lecture de la Bible ({lecture.duration} min)</Label>
                                        <p className="text-sm text-muted-foreground">{lecture.theme}</p>
                                        <PeopleSelect people={people} value={lecture.personId ?? null} onChange={() => {}} />
                                        {lecture.personId && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {personLabel(people.find(p => String(p.id) === String(lecture.personId)) ?? {displayName: '—'})}
                                            </span>
                                        )}
                                </div>}
            </div>
        </BigBlock>
    </div>
  );
}