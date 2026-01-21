
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, PlusCircle, Printer, Save, Loader2 } from "lucide-react";
import { usePeople } from '@/context/people-context';
import { useToast } from '@/hooks/use-toast';
import type { Person } from '@/app/personnes/page';

interface ResponsibilityAssignment {
  id: string;
  title: string;
  category: string;
  titulaire?: string;
  adjoint1?: string;
  adjoint2?: string;
}

// A reusable component for a single responsibility card with 3 assignments
const ResponsibilityCard = ({ 
  title, 
  category,
  people, 
  assignment,
  onUpdate 
}: { 
  title: string; 
  category: string;
  people: Person[];
  assignment?: ResponsibilityAssignment;
  onUpdate: (assignment: ResponsibilityAssignment) => void;
}) => {
  const id = `${category}-${title}`;
  const titulaire = assignment?.titulaire;
  const adjoint1 = assignment?.adjoint1;
  const adjoint2 = assignment?.adjoint2;

  const handleUpdate = (field: 'titulaire' | 'adjoint1' | 'adjoint2', value: string | undefined) => {
    const newAssignment: ResponsibilityAssignment = {
      id,
      title,
      category,
      titulaire: field === 'titulaire' ? value : titulaire,
      adjoint1: field === 'adjoint1' ? value : (field === 'titulaire' ? undefined : adjoint1),
      adjoint2: field === 'adjoint2' ? value : (field === 'titulaire' || field === 'adjoint1' ? undefined : adjoint2),
    };
    onUpdate(newAssignment);
  };

  const availableAdjoint1 = people.filter(p => p.id !== titulaire);
  const availableAdjoint2 = people.filter(p => p.id !== titulaire && p.id !== adjoint1);

  const handleClear = () => {
    onUpdate({ id, title, category, titulaire: undefined, adjoint1: undefined, adjoint2: undefined });
  };

  return (
    <Card className="mb-4 break-inside-avoid">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleClear} className="print:hidden text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`titulaire-${id}`}>Titulaire</Label>
          <Select onValueChange={(v) => handleUpdate('titulaire', v)} value={titulaire || ""}>
            <SelectTrigger id={`titulaire-${id}`}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {people.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`adjoint1-${id}`}>Adjoint 1</Label>
          <Select onValueChange={(v) => handleUpdate('adjoint1', v)} value={adjoint1 || ""} disabled={!titulaire}>
            <SelectTrigger id={`adjoint1-${id}`}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {availableAdjoint1.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`adjoint2-${id}`}>Adjoint 2</Label>
          <Select onValueChange={(v) => handleUpdate('adjoint2', v)} value={adjoint2 || ""} disabled={!titulaire || !adjoint1}>
            <SelectTrigger id={`adjoint2-${id}`}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Aucun</SelectItem>
              {availableAdjoint2.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

interface CustomResponsibility {
    id: string;
    title: string;
    titulaire?: string;
    adjoint1?: string;
    adjoint2?: string;
}

const CustomResponsibilityCard = ({ responsibility, people, onUpdate, onDelete }: { responsibility: CustomResponsibility, people: Person[], onUpdate: (id: string, data: Partial<CustomResponsibility>) => void, onDelete: (id: string) => void }) => {
  const { id, title, titulaire, adjoint1, adjoint2 } = responsibility;

  const handleValueChange = (field: keyof CustomResponsibility, value: string | undefined) => {
    const updateData: Partial<CustomResponsibility> = { [field]: value };
    if (field === 'titulaire') {
        updateData.adjoint1 = undefined;
        updateData.adjoint2 = undefined;
    } else if (field === 'adjoint1') {
        updateData.adjoint2 = undefined;
    }
    onUpdate(id, updateData);
  };

  const availableAdjoint1 = people.filter(p => p.id !== titulaire);
  const availableAdjoint2 = people.filter(p => p.id !== titulaire && p.id !== adjoint1);

  return (
    <Card className="mb-4 border border-dashed break-inside-avoid">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-x-2">
        <Input 
            value={title} 
            onChange={(e) => onUpdate(id, { title: e.target.value })}
            placeholder="Titre de la responsabilité"
            className="text-base font-medium border-0 shadow-none focus-visible:ring-1 print:hidden"
        />
        <span className="hidden print:block text-base font-medium">{title || "Titre non défini"}</span>
        <Button variant="ghost" size="icon" onClick={() => onDelete(id)} className="print:hidden text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`titulaire-${id}`}>Titulaire</Label>
          <Select onValueChange={(v) => handleValueChange('titulaire', v)} value={titulaire}>
            <SelectTrigger id={`titulaire-${id}`}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{people.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`adjoint1-${id}`}>Adjoint 1</Label>
          <Select onValueChange={(v) => handleValueChange('adjoint1', v)} value={adjoint1} disabled={!titulaire}>
            <SelectTrigger id={`adjoint1-${id}`}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{availableAdjoint1.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor={`adjoint2-${id}`}>Adjoint 2</Label>
          <Select onValueChange={(v) => handleValueChange('adjoint2', v)} value={adjoint2} disabled={!titulaire || !adjoint1}>
            <SelectTrigger id={`adjoint2-${id}`}><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{availableAdjoint2.map(p => <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};


const responsibilitiesData = {
    coordinator: [
        "Coordinateur du collège des anciens",
        "Coordinateur de discours publics",
        "Proposé à l'accueil",
        "Responsable audio/vidéo",
    ],
    secretary: [
        "Secrétaire",
        "Préposé aux rapports",
        "Proposé aux comptes",
    ],
    preaching: [
        "Responsable de prédication",
        "Proposé aux territoires",
        "Préposé aux publications",
    ],
    meeting: [
        "Entretien et Sanitaire",
        "Comptage assistance",
        "Perche et Estrade",
    ],
    kingdomHall: [
        "Comité de gestion",
        "Responsable de maintenance",
        "Coordinateur de nettoyage",
    ]
};

export default function ResponsibilitiesPage() {
  const { people } = usePeople();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ResponsibilityAssignment[]>([]);
  const [customResponsibilities, setCustomResponsibilities] = useState<CustomResponsibility[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const eligiblePeople = people.filter(p => {
    const s: any = p.spiritual as any;
    // older shape may use function instead of explicit elder/ministerialServant flags
    return Boolean(s?.elder || s?.ministerialServant || s?.function === 'elder' || s?.function === 'servant');
  });

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/responsibilities');
        if (response.ok) {
          const data = await response.json();
          setAssignments(data.assignments || []);
          setCustomResponsibilities(data.customResponsibilities || []);
        }
      } catch (error) {
        console.error('Error loading responsibilities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getAssignment = useCallback((category: string, title: string): ResponsibilityAssignment | undefined => {
    const id = `${category}-${title}`;
    return assignments.find(a => a.id === id);
  }, [assignments]);

  const updateAssignment = useCallback((assignment: ResponsibilityAssignment) => {
    setAssignments(prev => {
      const existing = prev.findIndex(a => a.id === assignment.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = assignment;
        return updated;
      }
      return [...prev, assignment];
    });
  }, []);

  const addCustomResponsibility = () => {
    const newResp: CustomResponsibility = {
        id: `custom-${Date.now()}`,
        title: '',
    };
    setCustomResponsibilities(prev => [...prev, newResp]);
  };

  const updateCustomResponsibility = (id: string, updatedData: Partial<CustomResponsibility>) => {
    setCustomResponsibilities(prev => 
        prev.map(r => r.id === id ? { ...r, ...updatedData } : r)
    );
  };

  const deleteCustomResponsibility = (id: string) => {
    setCustomResponsibilities(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/responsibilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments,
          customResponsibilities,
          updatedAt: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Responsabilités enregistrées avec succès',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving responsibilities:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
    <div className="flex justify-between items-center print:hidden">
      <h1 className="text-3xl font-bold">Responsabilités dans l'assemblée</h1>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
        </div>
        <div className="hidden print:block">
      <h1 className="text-3xl font-bold mb-4">Responsabilités dans l'assemblée</h1>
        </div>

        <Accordion type="multiple" className="w-full space-y-2" defaultValue={['coordinator', 'secretary', 'preaching', 'meeting', 'kingdom-hall', 'custom']}>
            <AccordionItem value="coordinator" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Coordinateur du collège des anciens</AccordionTrigger>
                <AccordionContent className="p-4">
                    {responsibilitiesData.coordinator.map(title => (
                        <ResponsibilityCard 
                          key={title} 
                          title={title} 
                          category="coordinator"
                          people={eligiblePeople}
                          assignment={getAssignment('coordinator', title)}
                          onUpdate={updateAssignment}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="secretary" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Secrétaire</AccordionTrigger>
                <AccordionContent className="p-4">
                    {responsibilitiesData.secretary.map(title => (
                        <ResponsibilityCard 
                          key={title} 
                          title={title}
                          category="secretary"
                          people={eligiblePeople}
                          assignment={getAssignment('secretary', title)}
                          onUpdate={updateAssignment}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="preaching" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Responsable de prédication</AccordionTrigger>
                <AccordionContent className="p-4">
                    {responsibilitiesData.preaching.map(title => (
                        <ResponsibilityCard 
                          key={title} 
                          title={title}
                          category="preaching"
                          people={eligiblePeople}
                          assignment={getAssignment('preaching', title)}
                          onUpdate={updateAssignment}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="meeting" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Réunion</AccordionTrigger>
                <AccordionContent className="p-4">
                    {responsibilitiesData.meeting.map(title => (
                        <ResponsibilityCard 
                          key={title} 
                          title={title}
                          category="meeting"
                          people={eligiblePeople}
                          assignment={getAssignment('meeting', title)}
                          onUpdate={updateAssignment}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="kingdom-hall" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Salle du Royaume</AccordionTrigger>
                <AccordionContent className="p-4">
                    {responsibilitiesData.kingdomHall.map(title => (
                        <ResponsibilityCard 
                          key={title} 
                          title={title}
                          category="kingdomHall"
                          people={eligiblePeople}
                          assignment={getAssignment('kingdomHall', title)}
                          onUpdate={updateAssignment}
                        />
                    ))}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="custom" className="break-inside-avoid">
                <AccordionTrigger className="text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-md">Responsabilités personnalisées</AccordionTrigger>
                <AccordionContent className="p-4">
                    {customResponsibilities.map(resp => (
                        <CustomResponsibilityCard 
                            key={resp.id}
                            responsibility={resp}
                            people={eligiblePeople}
                            onUpdate={updateCustomResponsibility}
                            onDelete={deleteCustomResponsibility}
                        />
                    ))}
                    <Button onClick={addCustomResponsibility} variant="outline" className="mt-4 w-full print:hidden">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter une responsabilité
                    </Button>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
