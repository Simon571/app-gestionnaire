'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Users, Building, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

type EventType = 'circuit_assembly_co' | 'circuit_assembly_br' | 'regional_convention' | 'co_visit' | 'memorial' | 'meeting_day_change' | 'no_meeting' | 'co_preaching_visit' | 'other';

type Event = {
    id: number;
    type: EventType;
    theme: string;
    date: string;
    location: string;
};

const initialEvents: Event[] = [];

const eventTypeTranslations: Record<EventType, string> = {
    circuit_assembly_co: 'Assemblée de circonscription',
    circuit_assembly_br: 'Assemblée de circonscription',
    regional_convention: 'Assemblée régionale',
    co_visit: 'Visite du responsable de circonscription',
    memorial: 'Mémorial',
    meeting_day_change: 'Changement de jour de réunion',
    no_meeting: 'Pas de réunion',
    co_preaching_visit: 'Visite du responsable de la prédication',
    other: 'Autre',
};

const EventForm = ({ event, onSave, onCancel }: { event?: Event | null, onSave: (event: any) => void, onCancel: () => void }) => {
    const [type, setType] = React.useState(event?.type || undefined);
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: event?.id || Date.now(),
            type: formData.get('type') as EventType,
            theme: formData.get('theme') as string,
            date: formData.get('date') as string,
            location: formData.get('location') as string,
        };
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                    Type
                </Label>
                <Select name="type" required defaultValue={type} onValueChange={(value) => setType(value as EventType)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="circuit_assembly_co">Assemblée de circonscription</SelectItem>
                        <SelectItem value="circuit_assembly_br">Assemblée de circonscription (Rep. Béthel)</SelectItem>
                        <SelectItem value="regional_convention">Assemblée régionale</SelectItem>
                        <SelectItem value="co_visit">Responsable de circonscription</SelectItem>
                        <SelectItem value="memorial">Mémorial</SelectItem>
                        <SelectItem value="meeting_day_change">Changement de jour de réunion</SelectItem>
                        <SelectItem value="no_meeting">Pas de réunion</SelectItem>
                        <SelectItem value="co_preaching_visit">Visite du responsable de la prédication</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="theme" className="text-right">Thème</Label>
                <Input id="theme" name="theme" defaultValue={event?.theme || ''} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={event?.date || ''} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Lieu</Label>
                <Input id="location" name="location" defaultValue={event?.location || ''} className="col-span-3" />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
        </form>
    );
};

const EventDialog = ({ children, event, onSave }: { children: React.ReactNode, event?: Event | null, onSave: (event: any) => void }) => {
    const [open, setOpen] = React.useState(false);

    const handleSave = (data: any) => {
        onSave(data);
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{event ? "Modifier l'événement" : "Ajouter un nouvel événement"}</DialogTitle>
                    <DialogDescription>
                        {event ? "Mettez à jour les détails de l'événement." : "Remplissez les détails du nouvel événement pour le publier."}
                    </DialogDescription>
                </DialogHeader>
                <EventForm event={event} onSave={handleSave} onCancel={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
};


export default function EventsPage() {
    const [events, setEvents] = React.useState(initialEvents);
    const { toast } = useToast();

    const getEventTypeTranslation = (type: Event['type']) => {
        return eventTypeTranslations[type] || type;
    };

    const handleSave = (eventData: Event) => {
        const isUpdating = events.some(e => e.id === eventData.id);
        setEvents(prev => {
            if (isUpdating) {
                return prev.map(e => e.id === eventData.id ? { ...e, ...eventData } : e);
            }
            return [...prev, {...eventData, id: Date.now()}];
        });
        toast({
            title: isUpdating ? "Événement mis à jour" : "Événement ajouté",
            description: `L'événement "${eventData.theme}" a été sauvegardé.`,
        });
    };
    
    const handleDelete = (id: number) => {
        const eventToDelete = events.find(e => e.id === id);
        setEvents(prev => prev.filter(e => e.id !== id));
        if (eventToDelete) {
            toast({
                title: "Événement supprimé",
                description: `L'événement "${eventToDelete.theme}" a été supprimé.`,
                variant: "destructive",
            });
        }
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Événements</h1>
                    <p className="text-muted-foreground">Informations sur les prochaines assemblées de circonscription et régionales.</p>
                </div>
                <EventDialog onSave={handleSave}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un événement
                    </Button>
                </EventDialog>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Card key={event.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Badge className="w-fit mb-2">{getEventTypeTranslation(event.type)}</Badge>
                                <div className="flex gap-1">
                                    <EventDialog event={event} onSave={handleSave}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </EventDialog>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardTitle>{event.theme}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{event.location}</span>
                            </div>
                            {event.type === 'circuit_assembly_br' && (
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Avec le représentant du Béthel</span>
                                </div>
                            )}
                             {event.type === 'circuit_assembly_co' && (
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    <span>Avec le responsable de circonscription</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
