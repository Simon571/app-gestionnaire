'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronUp, ChevronDown, Upload, Loader2, Volume2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';
import { useSyncToFlutter } from '@/hooks/use-sync-to-flutter';

type BoardType = 'assembly' | 'elders' | 'elders-assistants';

type Communication = {
  id: string;
  title: string;
  type: 'communication' | 'document' | 'lettre';
  displayAfter: Date;
  displayAfterTime: string;
  expirationDate: Date;
  attachment: string | null;
  link: string;
  content: string;
  order: number;
  boardType: BoardType;
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

function BulletinBoardContent() {
  const searchParams = useSearchParams();
  const boardParam = searchParams.get('board') as BoardType | null;
  
  const [communications, setCommunications] = React.useState<Communication[]>([]);
  const [selectedCommunicationId, setSelectedCommunicationId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<BoardType>(boardParam || 'assembly');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { syncCommunications, isSyncing } = useSyncToFlutter();
  const [isSending, setIsSending] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  const [audioState, setAudioState] = React.useState<{ [key: string]: { loading: boolean; data: string | null } }>({});

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mettre à jour l'onglet actif quand le paramètre URL change
  React.useEffect(() => {
    if (boardParam && (boardParam === 'assembly' || boardParam === 'elders' || boardParam === 'elders-assistants')) {
      setActiveTab(boardParam);
    }
  }, [boardParam]);

  // Filtrer les communications par type de tableau
  const filteredCommunications = communications.filter(c => c.boardType === activeTab);

  const handleNew = () => {
    const newComm: Communication = {
      id: `comm-${Date.now()}`,
      title: '<Communication>',
      type: 'communication',
      displayAfter: new Date(),
      displayAfterTime: '09:30',
      expirationDate: new Date(),
      attachment: null,
      link: '',
      content: '',
      order: filteredCommunications.length + 1,
      boardType: activeTab || 'assembly' // Valeur par défaut si activeTab est vide
    };
    setCommunications(prev => [...prev, newComm]);
    setSelectedCommunicationId(newComm.id);
    toast({ title: "Nouvelle communication créée." });
  };

  // Sauvegarde automatique locale uniquement (pas de sync vers Flutter)
  const firstMount = React.useRef(true);
  React.useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }

    // Ne pas sauvegarder si pas de communications
    if (communications.length === 0) return;

    const timer = setTimeout(async () => {
      // Sauvegarder localement uniquement
      try {
        localStorage.setItem('communications', JSON.stringify(communications));
      } catch (error) {
        console.error('Failed to save communications', error);
      }
      // Note: La synchronisation vers Flutter se fait uniquement via les boutons "Envoyer"
    }, 1500);

    return () => clearTimeout(timer);
  }, [communications]);

  // Charger les communications existantes (stockage local simple)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('communications');
      if (raw) {
        const parsed: Communication[] = JSON.parse(raw);
        setCommunications(parsed.map(comm => ({
          ...comm,
          displayAfter: new Date(comm.displayAfter),
          expirationDate: new Date(comm.expirationDate),
          boardType: (comm.boardType || 'assembly') as BoardType, // Valeur par défaut pour anciennes données
        })));
      }
    } catch (error) {
      console.error('Failed to load communications', error);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('communications', JSON.stringify(communications));
      toast({ title: 'Communications sauvegardées' });
    } catch (error) {
      console.error('Failed to save communications', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    if (!communications.length) {
      toast({ title: 'Aucune communication à envoyer', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      // Grouper les communications par tableau
      const byBoard = {
        assembly: communications.filter(c => c.boardType === 'assembly'),
        elders: communications.filter(c => c.boardType === 'elders'),
        'elders-assistants': communications.filter(c => c.boardType === 'elders-assistants'),
      };

      // Envoyer chaque groupe avec un message spécifique
      const now = new Date().toISOString();
      const boardLabels = {
        assembly: "Tableau d'affichage assemblée",
        elders: "Tableau d'affichage anciens",
        'elders-assistants': "Tableau d'affichage anciens et assistants",
      };

      const sendPromises = Object.entries(byBoard).map(async ([boardType, items]) => {
        if (items.length === 0) return null;
        
        const response = await publisherSyncFetch('/api/publisher-app/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'communications',
            payload: {
              generatedAt: now,
              boardType,
              boardLabel: boardLabels[boardType as BoardType],
              communications: items,
              totalCount: items.length,
            },
            notify: true,
            metadata: {
              boardType,
              count: items.length,
              message: `${items.length} communication(s) sur ${boardLabels[boardType as BoardType]}`,
            }
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Échec d'envoi pour ${boardType}`);
        }
        return boardType;
      });

      const results = await Promise.all(sendPromises);
      const sent = results.filter(Boolean).length;
      
      toast({ 
        title: 'Données envoyées', 
        description: `${sent} tableau(x) synchronisé(s) vers Publisher App.` 
      });
    } catch (error) {
      console.error('Send communications error', error);
      toast({ 
        title: 'Envoi impossible', 
        description: error instanceof Error ? error.message : 'Vérifiez la configuration Publisher App.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = () => {
    if (selectedCommunicationId) {
      const commToDelete = communications.find(c => c.id === selectedCommunicationId);
      setCommunications(prev => prev.filter(c => c.id !== selectedCommunicationId));
      setSelectedCommunicationId(null);
      toast({ title: `Communication "${commToDelete?.title}" supprimée.`, variant: "destructive" });
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
      toast({ title: `Pièce jointe "${file.name}" ajoutée.` });
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
      toast({ description: `Communication déplacée.` });
  }

  const handleListen = async (comm: Communication) => {
    if (!comm.content) return;
    setAudioState(prev => ({...prev, [comm.id]: { loading: true, data: null }}));
    try {
        const result = await textToSpeech(comm.content);
        if (result?.media) {
            setAudioState(prev => ({...prev, [comm.id]: { loading: false, data: result.media }}));
            toast({ title: "Audio généré", description: "La lecture audio est prête." });
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        setAudioState(prev => ({...prev, [comm.id]: { loading: false, data: null }}));
        toast({ title: "Erreur audio", description: "Impossible de générer l'audio.", variant: "destructive" });
    }
  }

  const selectedCommunication = communications.find(c => c.id === selectedCommunicationId);

  const getBoardLabel = (boardType: BoardType) => {
    switch (boardType) {
      case 'assembly': return "Tableau d'affichage assemblée";
      case 'elders': return "Tableau d'affichage anciens";
      case 'elders-assistants': return "Tableau d'affichage anciens et assistants";
    }
  };

  // Fonction pour envoyer uniquement le tableau actif
  const handleSendActiveBoard = async () => {
    const activeComms = communications.filter(c => c.boardType === activeTab);
    if (activeComms.length === 0) {
      toast({ title: 'Aucune communication sur ce tableau', variant: 'destructive' });
      return;
    }
    
    setIsSending(true);
    try {
      const now = new Date().toISOString();
      const boardLabel = getBoardLabel(activeTab);
      
      const response = await publisherSyncFetch('/api/publisher-app/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'communications',
          payload: {
            generatedAt: now,
            boardType: activeTab,
            boardLabel,
            communications: activeComms,
            totalCount: activeComms.length,
          },
          notify: true,
          metadata: {
            boardType: activeTab,
            count: activeComms.length,
            message: `${activeComms.length} communication(s) sur ${boardLabel}`,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error('Échec d\'envoi');
      }
      
      toast({ 
        title: 'Tableau envoyé', 
        description: `${activeComms.length} communication(s) de "${boardLabel}" synchronisées.` 
      });
    } catch (error) {
      console.error('Send active board error', error);
      toast({ 
        title: 'Envoi impossible', 
        description: error instanceof Error ? error.message : 'Erreur lors de l\'envoi.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Tableaux d'affichage</h2>
                <p className="text-muted-foreground">Gérez les communications pour différents groupes de l'assemblée</p>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nouveau</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={!selectedCommunicationId}>
                    <Trash2 className="mr-2 h-4 w-4" />Supprimer
                </Button>
              <Button variant="default" onClick={handleSave} disabled={!communications.length}>
                <Upload className="mr-2 h-4 w-4" />Enregistrer
              </Button>
                <Button
                  variant="outline"
                  onClick={handleSendActiveBoard}
                  disabled={communications.filter(c => c.boardType === activeTab).length === 0 || isSending}
                  className="bg-blue-50 hover:bg-blue-100"
                >
                  {!isMounted ? (
                    <Send className="mr-2 h-4 w-4" />
                  ) : isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Envoyer ce tableau
                </Button>
                <Button
                  variant="default"
                  onClick={handleSend}
                  disabled={!communications.length || isSending}
                >
                  {!isMounted ? (
                    <Upload className="mr-2 h-4 w-4" />
                  ) : isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Tout envoyer
                </Button>
            </div>
       </div>
       
       <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BoardType)} className="w-full">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="assembly">Assemblée</TabsTrigger>
           <TabsTrigger value="elders">Anciens</TabsTrigger>
           <TabsTrigger value="elders-assistants">Anciens et Assistants</TabsTrigger>
         </TabsList>
         
         <TabsContent value={activeTab} className="mt-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" value={selectedCommunication?.title || ''} onChange={(e) => updateSelectedCommunication('title', e.target.value)} disabled={!selectedCommunication} />
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label>Type</Label>
                        <Select value={selectedCommunication?.type} onValueChange={(v) => updateSelectedCommunication('type', v)} disabled={!selectedCommunication}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="document">Document</SelectItem>
                                <SelectItem value="lettre">Lettre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <Label>Afficher après</Label>
                        <div className="flex items-center gap-2">
                           {selectedCommunication ? <DatePicker date={selectedCommunication.displayAfter} setDate={(d) => updateSelectedCommunication('displayAfter', d)} /> : <DatePicker date={new Date()} setDate={() => {}} />}
                         <Input
                          type="time"
                          className="w-[110px]"
                          step={300}
                          value={selectedCommunication?.displayAfterTime || ''}
                          onChange={(e) => updateSelectedCommunication('displayAfterTime', e.target.value)}
                          disabled={!selectedCommunication}
                         />
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
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Date d'expiration</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCommunications.sort((a,b) => a.order - b.order).map((comm) => (
                                <TableRow 
                                    key={comm.id} 
                                    onClick={() => handleSelectCommunication(comm.id)}
                                    className={cn("cursor-pointer", selectedCommunicationId === comm.id && "bg-accent text-accent-foreground")}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                          <p>{comm.title}</p>
                                          <Badge variant="outline">{comm.type}</Badge>
                                        </div>
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
         </TabsContent>
       </Tabs>
    </div>
  );
}

export default function BulletinBoardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Chargement...</div>}>
      <BulletinBoardContent />
    </Suspense>
  );
}
