'use client';

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePeople } from "@/context/people-context";
import { type MwbWeek, type MinistryAssignmentType } from '@/lib/vcmLoader';

// --- TYPES ---
type Person = { id: string | number; displayName: string; [key: string]: any; };
type PreachingGroup = { id: string; name: string; };

export type JoyeauxData = { presidentId?: any; prayerId?: any; discours?: any; pearls?: any; bible?: any; bible2?: any; conseillerSalle2Id?: any; publicId?: any; };
export type MinistryAssignment = { id: string; type: string | null; studentId: string | number | null; partnerId: string | number | null; theme: string; duration: number | null; isSecondaryRoom: boolean; };
export type ChristianLifePart = { id: string; type: string | null; participantId: string | number | null; theme: string; duration: number | null; };
export type CongregationBibleStudy = { conductorId: string | number | null; readerId: string | number | null; theme: string; duration: number | null; };
export type FinalPrayer = { brotherId: string | number | null; };

type Props = {
  people: Person[];
  room: 1 | 2;
  onChangeRoom?: (room: 1 | 2) => void;
  disabled?: boolean;
  joyeauxData: JoyeauxData;
  onChangeJoyeaux: (patch: Partial<JoyeauxData>) => void;
  ministryAssignments: MinistryAssignment[];
  onChangeMinistry: (assignments: MinistryAssignment[]) => void;
  ministryAssignments2: MinistryAssignment[];
  onChangeMinistry2: (assignments: MinistryAssignment[]) => void;
  christianLifeParts: ChristianLifePart[];
  bibleStudy: CongregationBibleStudy;
  finalPrayer: FinalPrayer;
  onChangeChristianLifeParts: (parts: ChristianLifePart[]) => void;
  onChangeBibleStudy: (study: CongregationBibleStudy) => void;
  onChangeFinalPrayer: (prayer: FinalPrayer) => void;
  mwbWeek: MwbWeek | null;
};

type PageState = {
  discoursTitle: string;
  discoursMinutes: string;
  ministry: Array<{ title: string; minutes: string; }>;
  ministry2: Array<{ title: string; minutes: string; }>;
  living: Array<{ title: string; minutes: string; }>;
};

const NONE = "__NONE__";

function PersonSelect({ value, onChange, people, placeholder = "— Aucun —", disabled, className }: { value?: string | number | null; onChange: (v: string | number | null) => void; people: Person[]; placeholder?: string; disabled?: boolean; className?: string; }) {
  const val = value == null ? NONE : String(value);
  return (
    <Select value={val} onValueChange={(v) => onChange(v === NONE ? null : v)} disabled={disabled}>
      <SelectTrigger className={`h-7 text-sm ${className}`}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {people.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.displayName}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}

function GroupSelect({ value, onChange, groups, placeholder = "— Aucun —", disabled, className }: { value?: string | number | null; onChange: (v: string | number | null) => void; groups: PreachingGroup[]; placeholder?: string; disabled?: boolean; className?: string; }) {
  const val = value == null ? NONE : String(value);
  return (
    <Select value={val} onValueChange={(v) => onChange(v === NONE ? null : v)} disabled={disabled}>
      <SelectTrigger className={`h-7 text-sm ${className}`}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {groups.map((g) => (<SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>))}
      </SelectContent>
    </Select>
  );
}

function MinutesInput({ value, onChange, disabled }: { value?: number | null; onChange: (v: number | null) => void; disabled?: boolean; }) {
  return <Input type="number" inputMode="numeric" min={0} className="h-7 text-sm w-12" value={value ?? ""} onChange={(e) => { const s = e.currentTarget.value; onChange(s === "" ? null : Math.max(0, Number(s))); }} placeholder="min" />;
}

function RoomToggle({ room, onChange, disabled }: { room: 1 | 2; onChange?: (r: 1 | 2) => void; disabled?: boolean }) {
    return (
      <div className="inline-flex rounded-md overflow-hidden border">{[1, 2].map((r) => {
          const active = room === r;
          return (<Button key={r} type="button" size="sm" className={`h-7 px-2 rounded-none ${active ? "" : "bg-white"}`} variant={active ? "default" : "ghost"} aria-pressed={active} onClick={() => onChange?.(r as 1 | 2)} disabled={disabled}>Salle {r}</Button>);
      })}</div>
    );
}

function SectionHeader({ title, colorClass, children }: { title: string, colorClass: string, children?: React.ReactNode }) {
    return (
        <div className={`flex items-center justify-between px-2 py-0.5 ${colorClass} text-white`}>
            <div className="font-semibold leading-tight text-base flex items-center gap-2">{title}</div>
            <div>{children}</div>
        </div>
    );
}

export default function FullMeetingBlock(props: Props) {
  const { 
      people, room, onChangeRoom, disabled,
      joyeauxData, onChangeJoyeaux,
      ministryAssignments, onChangeMinistry,
      ministryAssignments2, onChangeMinistry2,
      christianLifeParts, bibleStudy, finalPrayer, 
      onChangeChristianLifeParts, onChangeBibleStudy, onChangeFinalPrayer,
      mwbWeek
  } = props;
  const { preachingGroups } = usePeople();

  const [state, setState] = React.useState<PageState>({
    discoursTitle: '',
    discoursMinutes: '',
    ministry: Array.from({ length: ministryAssignments.length }, () => ({ title: '', minutes: '' })),
    ministry2: Array.from({ length: ministryAssignments2.length }, () => ({ title: '', minutes: '' })),
    living: Array.from({ length: christianLifeParts.length }, () => ({ title: '', minutes: '' })),
  });

  React.useEffect(() => {
    if (!mwbWeek) return;
    setState(s => ({
      ...s,
      discoursTitle:  mwbWeek.discours?.title   ?? "",
      discoursMinutes: mwbWeek.discours?.minutes ?? "",
      ministry: s.ministry.map((row, i) => ({
        ...row,
        title:   mwbWeek.ministry?.[i]?.title   ?? "",
        minutes: mwbWeek.ministry?.[i]?.minutes ?? "",
      })),
      ministry2: s.ministry2.map((row, i) => ({
        ...row,
        title:   mwbWeek.ministry?.[i]?.title   ?? "",
        minutes: mwbWeek.ministry?.[i]?.minutes ?? "",
      })),
      living: s.living.map((row, i) => ({
        ...row,
        title:   mwbWeek.living?.[i]?.title   ?? "",
        minutes: mwbWeek.living?.[i]?.minutes ?? "",
      })),
    }));
  }, [mwbWeek]);

  const updateMinistry = (i: number, patch: Partial<typeof state.ministry[0]>) => {
    setState(s => ({ ...s, ministry: s.ministry.map((row, index) => (i === index ? { ...row, ...patch } : row)) }));
  };
  const updateMinistry2 = (i: number, patch: Partial<typeof state.ministry2[0]>) => {
    setState(s => ({ ...s, ministry2: s.ministry2.map((row, index) => (i === index ? { ...row, ...patch } : row)) }));
  };
  const updateLiving = (i: number, patch: Partial<typeof state.living[0]>) => {
      setState(s => ({ ...s, living: s.living.map((row, index) => (i === index ? { ...row, ...patch } : row)) }));
  };

  const presidents = React.useMemo(() => people.filter((p: any) => p.spiritual?.function === 'elder'), [people]);
  const orateurs = React.useMemo(() => people.filter((p: any) => p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant'), [people]);
  const prayerBrothers = React.useMemo(() => people.filter((p: any) => p.gender === 'male' && p.assignments?.preaching?.meetingPrayers), [people]);
  const gemsConductors = React.useMemo(() => people.filter((p: any) => (p.spiritual?.function === 'elder' || p.spiritual?.function === 'servant') && p.assignments?.gems?.spiritualGems), [people]);
  const bibleReaders = React.useMemo(
    () => people.filter((p: any) => p.gender === 'male' && p.assignments?.gems?.bibleReading),
    [people]
  );
  const students = React.useMemo(() => people.filter((p: any) => p.assignments?.ministry?.student), [people]);
  const christianLifeParticipants = React.useMemo(() => people.filter((p: any) => p.assignments?.christianLife?.interventions), [people]);
  const bibleStudyConductors = React.useMemo(() => people.filter((p: any) => p.assignments?.christianLife?.congregationBibleStudy), [people]);
  const bibleStudyReaders = React.useMemo(
    () => people.filter((p: any) => p.gender === 'male' && p.assignments?.christianLife?.reader),
    [people]
  );
  const secondaryRoomCounselors = React.useMemo(() => people.filter((p: any) => p.assignments?.gems?.secondaryRoomCounselor), [people]);

  const handleMinistryAssignmentChange = (id: string, patch: Partial<Omit<MinistryAssignment, 'id'>>, isRoom2 = false) => {
    const assignments = isRoom2 ? ministryAssignments2 : ministryAssignments;
    const handler = isRoom2 ? onChangeMinistry2 : onChangeMinistry;
    handler(assignments.map(a => a.id === id ? { ...a, ...patch } : a));
  };
  const handleChristianLifePartChange = (id: string, patch: Partial<Omit<ChristianLifePart, 'id'>>) => {
    onChangeChristianLifeParts(christianLifeParts.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const ministryAssignmentTypes = [
    { value: 'aucun',                 label: "Aucun" },
    { value: 'premier_contact',       label: "Premier contact" },
    { value: 'nouvelle_visite',       label: "Nouvelle visite" },
    { value: 'cours_biblique',        label: "Cours biblique" },
    { value: 'engage_conversation',   label: "Engage la conversation" },
    { value: 'entretiens_interet',    label: "Entretiens l’intérêt" },
    { value: 'explique_demo',         label: "Explique tes croyances — Démo" },
    { value: 'explique_discours',     label: "Explique tes croyances — Discours" },
    { value: 'fais_disciples',        label: "Fais des disciples" },
    { value: 'discours_eleve',        label: "Discours d’élève" },
    { value: 'discours',              label: "Discours" },
    { value: 'discussion',            label: "Discussion" },
    { value: 'video',                 label: "Vidéo" },
  ];

  return (
    <Card className="overflow-hidden text-sm p-1 space-y-1">
        <SectionHeader title="Joyeux de la parole de Dieu" colorClass="bg-cyan-800" />
        <div className="space-y-1 p-1 border border-t-0 rounded-b-md">
            <div className="flex items-center gap-2">
                <Label className="w-24 text-xs">Président</Label>
                <PersonSelect people={presidents} value={joyeauxData.presidentId ?? null} onChange={(v) => onChangeJoyeaux({ presidentId: v })} className="w-52" />
                <div className="flex-grow"></div>
                <Label className="text-xs">Prière du début</Label>
                <PersonSelect people={prayerBrothers} value={joyeauxData.prayerId ?? null} onChange={(v) => onChangeJoyeaux({ prayerId: v })} className="w-52" />
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-24"></div>
                <RoomToggle room={room} onChange={onChangeRoom} disabled={disabled} />
                {room === 1 && (
                    <>
                        <div className="flex-grow" />
                        <Label className="text-xs">2. Perles spirituelles</Label>
                        <PersonSelect people={gemsConductors} value={joyeauxData.pearls?.conductorId ?? null} onChange={(v) => onChangeJoyeaux({ pearls: { ...(joyeauxData.pearls ?? {}), conductorId: v } })} placeholder="— Conducteur —" className="w-52" />
                        <MinutesInput value={joyeauxData.pearls?.minutes ?? 10} onChange={(m) => onChangeJoyeaux({ pearls: { ...(joyeauxData.pearls ?? {}), minutes: m } })} />
                    </>
                )}
            </div>

            {room === 1 && (
              <>
                <div className="flex items-center gap-2">
                    <Label className="w-24 text-xs">Discours</Label>
                    <PersonSelect people={orateurs} value={joyeauxData.discours?.speakerId ?? null} onChange={(v) => onChangeJoyeaux({ discours: { ...(joyeauxData.discours ?? { theme: "" }), speakerId: v } })} placeholder="— Orateur —" className="w-52" />
                    <Label className="text-xs pr-1">1.</Label>
                    <Input className="h-8 flex-1" value={state.discoursTitle ?? ""} onChange={(e) => setState(s => ({ ...s, discoursTitle: e.target.value ?? "" }))} aria-label="Titre du discours" />
                    <div className="flex items-center gap-1">
                      <Input className="h-8 w-16 text-right" inputMode="numeric" pattern="\d*" value={state.discoursMinutes ?? ""} onChange={(e) => setState(s => ({ ...s, discoursMinutes: e.target.value ?? "" }))} aria-label="Minutes du discours" />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="w-24 text-xs">3. Lecture de la Bible</Label>
                    <PersonSelect people={bibleReaders} value={joyeauxData.bible?.readerId ?? null} onChange={(v) => onChangeJoyeaux({ bible: { ...(joyeauxData.bible ?? {}), readerId: v } })} placeholder="— Lecteur —" className="w-52" />
                    <div className="flex-grow text-sm text-slate-700 border-b pb-0.5 px-1">{mwbWeek?.lecture.title ?? ''}</div>
                </div>
              </>
            )}

            {room === 2 && (
              <div className="flex items-center gap-2">
                  <Label className="w-24 text-xs">Lecture 2</Label>
                  <PersonSelect people={bibleReaders} value={joyeauxData.bible2?.readerId ?? null} onChange={(v) => onChangeJoyeaux({ bible2: { ...(joyeauxData.bible2 ?? {}), readerId: v } })} placeholder="— Lecteur —" className="w-52" />
                  <div className="flex-grow"></div>
                  <Label className="text-xs">Conseiller</Label>
                  <PersonSelect people={secondaryRoomCounselors} value={joyeauxData.conseillerSalle2Id ?? null} onChange={(v) => onChangeJoyeaux({ conseillerSalle2Id: v })} placeholder="— Conseiller —" className="w-52" />
                  <Label className="text-xs">Public</Label>
                  <GroupSelect groups={preachingGroups} value={joyeauxData.publicId ?? null} onChange={(v) => onChangeJoyeaux({ publicId: v })} placeholder="— Groupe —" className="w-52" />
              </div>
            )}
        </div>

        <SectionHeader title="Applique-toi au ministère" colorClass="bg-amber-700" />
        <div className="p-1 space-y-1 border border-t-0 rounded-b-md">
            {room === 1 && ministryAssignments.map((assignment, index) => (
                <div key={assignment.id} className="flex items-center gap-2">
          <Select value={assignment.type ?? 'aucun'} onValueChange={(v) => handleMinistryAssignmentChange(assignment.id, { type: v })}>
                        <SelectTrigger className="h-7 text-sm w-48"><SelectValue placeholder="— Type —" /></SelectTrigger>
            <SelectContent>{ministryAssignmentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <PersonSelect people={students} value={assignment.studentId} onChange={(v) => handleMinistryAssignmentChange(assignment.id, { studentId: v })} placeholder="— Élève —" className="w-48" />
                    <Label className="text-xs pr-1">{index + 4}.</Label>
                    <Input className="h-8 flex-1" value={state.ministry[index]?.title ?? ""} onChange={(e) => updateMinistry(index, { title: e.target.value ?? "" })} aria-label={`Titre ministère ${index + 4}`} />
                    <div className="flex items-center gap-1">
                      <Input className="h-8 w-16 text-right" inputMode="numeric" pattern="\d*" value={state.ministry[index]?.minutes ?? ""} onChange={(e) => updateMinistry(index, { minutes: e.target.value ?? "" })} aria-label={`Minutes ministère ${index + 4}`} />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    { (index < 2) && ( <PersonSelect people={people} value={assignment.partnerId} onChange={(v) => handleMinistryAssignmentChange(assignment.id, { partnerId: v })} placeholder="— Interlocuteur —" className="w-48" /> )}
                </div>
            ))}
            {room === 2 && ministryAssignments2.map((assignment, index) => (
                <div key={assignment.id} className="flex items-center gap-2">
          <Select value={assignment.type ?? 'aucun'} onValueChange={(v) => handleMinistryAssignmentChange(assignment.id, { type: v }, true)}>
                        <SelectTrigger className="h-7 text-sm w-48"><SelectValue placeholder="— Type —" /></SelectTrigger>
            <SelectContent>{ministryAssignmentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <PersonSelect people={students} value={assignment.studentId} onChange={(v) => handleMinistryAssignmentChange(assignment.id, { studentId: v }, true)} placeholder="— Élève —" className="w-48" />
                    <Label className="text-xs pr-1">{index + 4}.</Label>
                    <Input className="h-8 flex-1" value={state.ministry2[index]?.title ?? ""} onChange={(e) => updateMinistry2(index, { title: e.target.value ?? "" })} aria-label={`Titre ministère ${index + 4} (Salle 2)`} />
                    <div className="flex items-center gap-1">
                      <Input className="h-8 w-16 text-right" inputMode="numeric" pattern="\d*" value={state.ministry2[index]?.minutes ?? ""} onChange={(e) => updateMinistry2(index, { minutes: e.target.value ?? "" })} aria-label={`Minutes ministère ${index + 4} (Salle 2)`} />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    { (index < 2) && ( <PersonSelect people={people} value={assignment.partnerId} onChange={(v) => handleMinistryAssignmentChange(assignment.id, { partnerId: v }, true)} placeholder="— Interlocuteur —" className="w-48" /> )}
                </div>
            ))}
        </div>

    <SectionHeader title="Vie chrétienne" colorClass="bg-red-800" />
    <div className="p-1 space-y-1 border border-t-0 rounded-b-md">
      {christianLifeParts.map((part, index) => (
        <div key={part.id} className="flex items-center gap-2">
          <div className="w-48">
            <Select value={part.type ?? 'part'} onValueChange={(v) => handleChristianLifePartChange(part.id, { type: v })}>
              <SelectTrigger className="h-7 text-sm w-full"><SelectValue placeholder="— Type —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="part">Partie vie chrétienne</SelectItem>
                <SelectItem value="besoins_assemblee">Besoins de l'assemblée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PersonSelect people={christianLifeParticipants} value={part.participantId} onChange={(v) => handleChristianLifePartChange(part.id, { participantId: v })} placeholder="— Participant —" className="w-48" />
          <Label className="text-xs pr-1">{index + 7}.</Label>
          <Input className="h-8 flex-1" value={state.living[index]?.title ?? ""} onChange={(e) => updateLiving(index, { title: e.target.value ?? "" })} aria-label={`Partie Vie Chrétienne ${index + 7}`} />
          <div className="flex items-center gap-1">
            <Input className="h-8 w-16 text-right" inputMode="numeric" pattern="\d*" value={state.living[index]?.minutes ?? ""} onChange={(e) => updateLiving(index, { minutes: e.target.value ?? "" })} aria-label={`Minutes Vie Chrétienne ${index + 7}`} />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Label className="text-xs pr-1">10.</Label>
        <Label className="w-48 text-sm">Étude biblique de l'assemblée</Label>
        <PersonSelect people={bibleStudyConductors} value={bibleStudy.conductorId} onChange={(v) => onChangeBibleStudy({ ...bibleStudy, conductorId: v })} placeholder="— Conducteur —" className="w-52" />
        <div className="flex-grow text-sm text-slate-700 border-b pb-0.5 px-1">{mwbWeek?.study.title ?? ''}</div>
        <MinutesInput value={bibleStudy.duration} onChange={(v) => onChangeBibleStudy({ ...bibleStudy, duration: v })} />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-48"></div>
        <div className="w-52"></div>
        <div className="flex-grow"></div>
        <Label className="text-xs">EBA Lecteur</Label>
        <PersonSelect people={bibleStudyReaders} value={bibleStudy.readerId} onChange={(v) => onChangeBibleStudy({ ...bibleStudy, readerId: v })} placeholder="— Lecteur —" className="w-52" />
        <div className="w-12"></div>
        <Label className="text-xs">Prière finale</Label>
        <PersonSelect people={prayerBrothers} value={finalPrayer.brotherId} onChange={(v) => onChangeFinalPrayer({ ...finalPrayer, brotherId: v })} placeholder="— Frère —" className="w-52" />
      </div>
    </div>
    </Card>
  );
}