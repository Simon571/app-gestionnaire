'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2, Pencil, ExternalLink, Users, Edit } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

type Circuit = {
    id: string;
    name: string;
}

type Speaker = {
    id: string;
    name: string;
    congregation: string;
    phone: string;
    isElder: boolean;
    isServant: boolean;
    circuitId: string;
}

const CircuitForm = ({ circuit, onSave, onCancel }: { circuit?: Circuit | null, onSave: (circuit: Circuit) => void, onCancel: () => void }) => {
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            id: formData.get('id') as string,
            name: formData.get('name') as string,
        };
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id" className="text-right">
                    ID de la circonscription
                </Label>
                <Input id="id" name="id" defaultValue={circuit?.id || ''} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                   Nom de la circonscription
                </Label>
                <Input id="name" name="name" defaultValue={circuit?.name || ''} className="col-span-3" />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
        </form>
    );
};

const SpeakerForm = ({ speaker, onSave, onCancel }: { speaker?: Speaker | null, onSave: (speaker: Omit<Speaker, 'id' | 'circuitId'>) => void, onCancel: () => void }) => {
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            congregation: formData.get('congregation') as string,
            phone: formData.get('phone') as string,
            isElder: formData.get('isElder') === 'on',
            isServant: formData.get('isServant') === 'on',
        };
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                   Nom et prénom
                </Label>
                <Input id="name" name="name" defaultValue={speaker?.name || ''} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="congregation" className="text-right">
                   Assemblée
                </Label>
                <Input id="congregation" name="congregation" defaultValue={speaker?.congregation || ''} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                   Fonction
                </Label>
                <div className="col-span-3 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="isElder" name="isElder" defaultChecked={speaker?.isElder} />
                        <Label htmlFor="isElder" className="font-normal">Ancien</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="isServant" name="isServant" defaultChecked={speaker?.isServant} />
                        <Label htmlFor="isServant" className="font-normal">Assistant</Label>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                   Téléphone
                </Label>
                <Input id="phone" name="phone" defaultValue={speaker?.phone || ''} className="col-span-3" />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
        </form>
    );
};

export default function CircuitsSpeakersPage() {
  const [circuits, setCircuits] = React.useState<Circuit[]>([]);
  const [speakers, setSpeakers] = React.useState<Speaker[]>([]);
  
  const [selectedCircuitId, setSelectedCircuitId] = React.useState<string | null>(null);
  
  const [isCircuitFormOpen, setIsCircuitFormOpen] = React.useState(false);
  const [editingCircuit, setEditingCircuit] = React.useState<Circuit | null>(null);

  const [isSpeakerFormOpen, setIsSpeakerFormOpen] = React.useState(false);
  const [editingSpeaker, setEditingSpeaker] = React.useState<Speaker | null>(null);
  const { toast } = useToast();

  const handleAddCircuit = () => {
    setEditingCircuit(null);
    setIsCircuitFormOpen(true);
  }
  
  const handleEditCircuit = (circuitToEdit: Circuit) => {
    setEditingCircuit(circuitToEdit);
    setIsCircuitFormOpen(true);
  }

  const handleDeleteCircuit = () => {
    if(selectedCircuitId) {
        const circuitToDelete = circuits.find(c => c.id === selectedCircuitId);
        setCircuits(circuits.filter(c => c.id !== selectedCircuitId));
        setSpeakers(speakers.filter(s => s.circuitId !== selectedCircuitId));
        setSelectedCircuitId(null);
        toast({ title: `Circonscription "${circuitToDelete?.name}" supprimée.`, variant: "destructive" });
    }
  }

  const handleSaveCircuit = (circuit: Circuit) => {
    if (editingCircuit) {
        setCircuits(circuits.map(c => c.id === editingCircuit.id ? circuit : c));
        toast({ title: `Circonscription "${circuit.name}" mise à jour.` });
    } else {
        const newCircuit = { ...circuit, id: circuit.id || `circ-${Date.now()}`};
        setCircuits([...circuits, newCircuit]);
        setSelectedCircuitId(newCircuit.id);
        toast({ title: `Circonscription "${newCircuit.name}" ajoutée.` });
    }
    setIsCircuitFormOpen(false);
    setEditingCircuit(null);
  }

  const handleAddSpeaker = () => {
    setEditingSpeaker(null);
    setIsSpeakerFormOpen(true);
  };

  const handleEditSpeaker = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setIsSpeakerFormOpen(true);
  };

  const handleDeleteSpeaker = (speakerId: string) => {
    const speakerToDelete = speakers.find(s => s.id === speakerId);
    setSpeakers(speakers.filter(s => s.id !== speakerId));
    toast({ title: `Orateur "${speakerToDelete?.name}" supprimé.`, variant: "destructive" });
  };
  
  const handleSaveSpeaker = (speakerData: Omit<Speaker, 'id' | 'circuitId'>) => {
      if (editingSpeaker) {
          setSpeakers(speakers.map(s => s.id === editingSpeaker.id ? { ...editingSpeaker, ...speakerData } : s));
          toast({ title: `Orateur "${speakerData.name}" mis à jour.` });
      } else if (selectedCircuitId) {
          setSpeakers([...speakers, { ...speakerData, id: `spk-${Date.now()}`, circuitId: selectedCircuitId }]);
          toast({ title: `Orateur "${speakerData.name}" ajouté.` });
      }
      setIsSpeakerFormOpen(false);
      setEditingSpeaker(null);
  }
  
  const selectedCircuit = circuits.find(c => c.id === selectedCircuitId);
  const speakersForSelectedCircuit = speakers.filter(s => s.circuitId === selectedCircuitId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
            <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                         <Select value={selectedCircuitId || ""} onValueChange={setSelectedCircuitId}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Toutes les circonscriptions" />
                            </SelectTrigger>
                            <SelectContent>
                                {circuits.map(circuit => (
                                    <SelectItem key={circuit.id} value={circuit.id}>{circuit.id} - {circuit.name}</SelectItem>
                                ))}
                                {circuits.length === 0 && <SelectItem value="none" disabled>Aucune circonscription trouvée</SelectItem>}
                            </SelectContent>
                        </Select>
                        {selectedCircuit && (
                             <Button variant="ghost" size="icon" onClick={() => handleEditCircuit(selectedCircuit)} disabled={!selectedCircuitId}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={isCircuitFormOpen} onOpenChange={setIsCircuitFormOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleAddCircuit}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>{editingCircuit ? 'Modifier la circonscription' : 'Ajouter une nouvelle circonscription'}</DialogTitle>
                                </DialogHeader>
                                <CircuitForm 
                                    circuit={editingCircuit} 
                                    onSave={handleSaveCircuit} 
                                    onCancel={() => setIsCircuitFormOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteCircuit} disabled={!selectedCircuitId}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="icon">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">Circonscr.</TableHead>
                            <TableHead>Nom</TableHead>
                             <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {circuits.map((circuit) => (
                            <TableRow key={circuit.id} 
                                      onClick={() => setSelectedCircuitId(circuit.id)}
                                      className={selectedCircuitId === circuit.id ? 'bg-muted/50 cursor-pointer' : 'cursor-pointer'}>
                                <TableCell>{circuit.id}</TableCell>
                                <TableCell className="font-medium">{circuit.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleEditCircuit(circuit)}}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card className="flex flex-col md:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Orateurs</CardTitle>
                        <CardDescription>
                            {selectedCircuitId ? `Orateurs pour la circonscription ${selectedCircuit?.name}` : 'Sélectionnez une circonscription pour voir les orateurs.'}
                        </CardDescription>
                    </div>
                     <Dialog open={isSpeakerFormOpen} onOpenChange={setIsSpeakerFormOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" onClick={handleAddSpeaker} disabled={!selectedCircuitId}>
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter un orateur
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>{editingSpeaker ? "Modifier l'orateur" : 'Ajouter un nouvel orateur'}</DialogTitle>
                            </DialogHeader>
                            <SpeakerForm 
                                speaker={editingSpeaker} 
                                onSave={handleSaveSpeaker} 
                                onCancel={() => setIsSpeakerFormOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {speakersForSelectedCircuit.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Assemblée</TableHead>
                                <TableHead>Nom et prénom</TableHead>
                                <TableHead>Fonction</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {speakersForSelectedCircuit.map(speaker => (
                                <TableRow key={speaker.id}>
                                    <TableCell>{speaker.congregation}</TableCell>
                                    <TableCell className="font-medium">{speaker.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2 text-sm">
                                            {speaker.isElder && <Badge variant="secondary">Ancien</Badge>}
                                            {speaker.isServant && <Badge variant="outline">Assistant</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{speaker.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditSpeaker(speaker)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSpeaker(speaker.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <Users className="mx-auto h-12 w-12 opacity-50"/>
                        <p className="mt-4 text-sm">{selectedCircuitId ? 'Aucun orateur pour cette circonscription.' : 'Aucune circonscription sélectionnée'}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}