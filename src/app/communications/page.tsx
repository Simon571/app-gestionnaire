
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronUp, ChevronDown, Upload, Loader2, Volume2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { textToSpeech } from '@/ai/flows/tts-flow';

type Communication = {
  id: string;
  title: string;
  displayAfter: Date;
  displayAfterTime: string;
  expirationDate: Date;
  attachment: string | null;
  link: string;
  content: string;
  order: number;
};

const DatePicker = ({ date, setDate }: { date: Date, setDate: (date: Date) => void }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[130px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy/MM/dd") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default function BulletinBoardPage() {
  const [communications, setCommunications] = React.useState<Communication[]>([]);
  const [selectedCommunicationId, setSelectedCommunicationId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [audioState, setAudioState] = React.useState<{ [key: string]: { loading: boolean; data: string | null } }>({});

  const handleNew = () => {
    const newComm: Communication = {
      id: `comm-${Date.now()}`,
      title: '<Communication>',
      displayAfter: new Date(),
      displayAfterTime: '09:30',
      expirationDate: new Date(),
      attachment: null,
      link: '',
      content: '',
      order: communications.length + 1
    };
    setCommunications(prev => [...prev, newComm]);
    setSelectedCommunicationId(newComm.id);
  };

  const handleDelete = () => {
    if (selectedCommunicationId) {
      setCommunications(prev => prev.filter(c => c.id !== selectedCommunicationId));
      setSelectedCommunicationId(null);
    }
  };

  const handleSelectCommunication = (id: string) => {
    setSelectedCommunicationId(id);
  }

  const updateSelectedCommunication = (field: keyof Omit<Communication, 'id' | 'order'>, value: any) => {
    if (!selectedCommunicationId) return;

    setCommunications(prev => prev.map(comm => {
      if (comm.id === selectedCommunicationId) {
        return { ...comm, [field]: value };
      }
      return comm;
    }));
  };

  const handleAddAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateSelectedCommunication('attachment', file.name);
    }
  };
  
  const move = (direction: 'up' | 'down') => {
      if (!selectedCommunicationId) return;

      const index = communications.findIndex(c => c.id === selectedCommunicationId);
      if (index === -1) return;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= communications.length) return;

      const newComms = [...communications];
      const temp = newComms[index];
      newComms[index] = newComms[newIndex];
      newComms[newIndex] = temp;
      
      newComms.forEach((c, i) => c.order = i + 1);

      setCommunications(newComms);
  }

  const handleListen = async (comm: Communication) => {
    if (!comm.content) return;
    setAudioState(prev => ({...prev, [comm.id]: { loading: true, data: null }}));
    try {
        const result = await textToSpeech(comm.content);
        if (result?.media) {
            setAudioState(prev => ({...prev, [comm.id]: { loading: false, data: result.media }}));
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        setAudioState(prev => ({...prev, [comm.id]: { loading: false, data: null }}));
    }
  }

  const selectedCommunication = communications.find(c => c.id === selectedCommunicationId);

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Tableau d'affichage</h2>
                <p className="text-muted-foreground">C'est ici que les admin doivent mettre les communiqués et d'autres informations qui vont s'afficher dans l'application des utilisateurs</p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nouveau</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={!selectedCommunicationId}>
                    <Trash2 className="mr-2 h-4 w-4" />Supprimer
                </Button>
            </div>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" value={selectedCommunication?.title || ''} onChange={(e) => updateSelectedCommunication('title', e.target.value)} disabled={!selectedCommunication} />
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label>Afficher après</Label>
                        <div className="flex items-center gap-2">
                           {selectedCommunication ? <DatePicker date={selectedCommunication.displayAfter} setDate={(d) => updateSelectedCommunication('displayAfter', d)} /> : <DatePicker date={new Date()} setDate={() => {}} />}
                           <Select value={selectedCommunication?.displayAfterTime} onValueChange={(v) => updateSelectedCommunication('displayAfterTime', v)} disabled={!selectedCommunication}>
                                <SelectTrigger className="w-[90px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="09:30">09:30</SelectItem>
                                    <SelectItem value="19:30">19:30</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label>Date d'expiration</Label>
                        {selectedCommunication ? <DatePicker date={selectedCommunication.expirationDate} setDate={(d) => updateSelectedCommunication('expirationDate', d)} /> : <DatePicker date={new Date()} setDate={() => {}} />}
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label>Pièce jointe</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-[90px] truncate">{selectedCommunication?.attachment || 'Aucun'}</span>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <Button variant="outline" size="sm" disabled={!selectedCommunication} onClick={handleAddAttachmentClick}><Upload className="mr-2 h-4 w-4" />Ajouter</Button>
                            <Button variant="outline" size="sm" disabled={!selectedCommunication?.attachment} onClick={() => updateSelectedCommunication('attachment', null)}><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label htmlFor="link">Lien</Label>
                        <Input id="link" value={selectedCommunication?.link || ''} onChange={(e) => updateSelectedCommunication('link', e.target.value)} disabled={!selectedCommunication} />
                    </div>
                    <div className="relative">
                        <Textarea className="h-48" value={selectedCommunication?.content || ''} onChange={(e) => updateSelectedCommunication('content', e.target.value)} disabled={!selectedCommunication} />
                        <div className="absolute right-2 top-2 flex flex-col gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => move('up')} disabled={!selectedCommunicationId}><ChevronUp className="h-4 w-4"/></Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => move('down')} disabled={!selectedCommunicationId}><ChevronDown className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto h-[485px]">
                         <Table>
                            <TableHeader className="sticky top-0 bg-muted">
                                <TableRow>
                                    <TableHead>Communication</TableHead>
                                    <TableHead>Date d'expiration</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {communications.sort((a,b) => a.order - b.order).map((comm) => (
                                <TableRow 
                                    key={comm.id} 
                                    onClick={() => handleSelectCommunication(comm.id)}
                                    className={cn("cursor-pointer", selectedCommunicationId === comm.id && "bg-accent text-accent-foreground")}
                                >
                                    <TableCell>
                                        <p>{comm.title}</p>
                                        {audioState[comm.id]?.data && (
                                            <audio controls autoPlay className="mt-2 h-8 w-full">
                                                <source src={audioState[comm.id]?.data as string} type="audio/wav" />
                                            </audio>
                                        )}
                                    </TableCell>
                                    <TableCell>{format(comm.expirationDate, 'yyyy/MM/dd')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleListen(comm);
                                            }}
                                            disabled={!comm.content || audioState[comm.id]?.loading}
                                        >
                                            {audioState[comm.id]?.loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex justify-between items-center p-2 border-t text-sm text-muted-foreground">
                        <span>Ordre: {selectedCommunication?.order || '-'}</span>
                        <span>ID #{selectedCommunication?.id ? selectedCommunication.id.split('-')[1] : '-'}</span>
                    </div>
                </CardContent>
            </Card>
       </div>
    </div>
  );
}
