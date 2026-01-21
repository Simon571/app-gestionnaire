'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MessageSquare, Printer, HelpCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LinkToPublisher from '@/components/publisher/link-to-publisher';
import { cn } from '@/lib/utils';

type Theme = {
  id: string;
  title: string;
  description: string;
  orateur: string;
  programmedDate: string;
};

type ProgrammedNeed = {
  id: string;
  date: string;
  minutes: number | string;
  title: string;
  orateur: string;
};

const initialThemes: Theme[] = [];

const initialProgrammedNeeds: ProgrammedNeed[] = Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 1}`,
    date: '',
    minutes: '',
    title: '',
    orateur: ''
}));


export default function BesoinsAssembleePage() {
    const [themes, setThemes] = React.useState<Theme[]>(initialThemes);
    const [programmedNeeds, setProgrammedNeeds] = React.useState<ProgrammedNeed[]>(initialProgrammedNeeds);
    const [selectedTheme, setSelectedTheme] = React.useState<Theme | null>(null);
    const { toast } = useToast();

    const handleSelectTheme = (theme: Theme) => {
        setSelectedTheme(theme);
    };

    const handleNewTheme = () => {
        const newTheme: Theme = {
            id: `theme-${Date.now()}`,
            title: 'Nouveau thème',
            description: '',
            orateur: '',
            programmedDate: ''
        };
        setThemes(prev => [...prev, newTheme]);
        setSelectedTheme(newTheme);
        toast({ title: "Nouveau thème ajouté." });
    };

    const handleDeleteTheme = () => {
        if (selectedTheme) {
            setThemes(prev => prev.filter(t => t.id !== selectedTheme.id));
            const deletedTitle = selectedTheme.title;
            setSelectedTheme(null);
            toast({ title: `Thème "${deletedTitle}" supprimé.`, variant: 'destructive' });
        }
    };

    const handleThemeChange = (field: keyof Pick<Theme, 'title' | 'description'>, value: string) => {
        if (selectedTheme) {
            setSelectedTheme(prev => prev ? { ...prev, [field]: value } : null);
        }
    };

    const handleSaveTheme = () => {
        if (selectedTheme) {
            setThemes(prev => prev.map(t => t.id === selectedTheme.id ? selectedTheme : t));
            toast({ title: `Thème "${selectedTheme.title}" sauvegardé.` });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full items-start">
            {/* Left Panel: Themes */}
            <Card className="h-full flex flex-col no-print">
                <CardHeader>
                    <CardTitle>Thèmes des besoins de l'assemblée</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="outline" size="icon" onClick={handleNewTheme}><Plus /></Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteTheme} disabled={!selectedTheme}><Trash2 /></Button>
                            <Button onClick={handleSaveTheme} disabled={!selectedTheme} className="ml-auto"><Save className="mr-2 h-4 w-4"/>Sauvegarder</Button>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <Input 
                                    id="theme-title" 
                                    placeholder="Titre du thème" 
                                    value={selectedTheme?.title || ''}
                                    onChange={(e) => handleThemeChange('title', e.target.value)}
                                    disabled={!selectedTheme}
                                />
                            </div>
                            <div>
                                <Textarea 
                                    id="theme-description" 
                                    placeholder="Description..." 
                                    className="h-20" 
                                    value={selectedTheme?.description || ''}
                                    onChange={(e) => handleThemeChange('description', e.target.value)}
                                    disabled={!selectedTheme}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow mt-4 border rounded-md overflow-hidden">
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted">
                                    <TableRow>
                                        <TableHead className="w-2/3">Titre</TableHead>
                                        <TableHead>Orateur</TableHead>
                                        <TableHead>Programmé</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {themes.map((theme) => (
                                        <TableRow 
                                            key={theme.id} 
                                            onClick={() => handleSelectTheme(theme)}
                                            className={cn("cursor-pointer", selectedTheme?.id === theme.id && "bg-accent")}
                                        >
                                            <TableCell>{theme.title}</TableCell>
                                            <TableCell>{theme.orateur}</TableCell>
                                            <TableCell>{theme.programmedDate}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Right Panel: Programmed Needs */}
            <Card className="h-full flex flex-col">
                <CardHeader className="no-print">
                    <div className="flex items-center justify-between">
                         <CardTitle>Besoins de l'assemblée programmés</CardTitle>
                                                 <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5"/></Button>
                                                        <LinkToPublisher
                                                            type={'programme_week'}
                                                            label="Enregistrer & Envoyer"
                                                            getPayload={() => {
                                                                const generatedAt = new Date().toISOString();
                                                                // programme_week writer expects either a weekStart or weeks:[] array
                                                                // Wrap data into weeks[] so the flutter-writer merges correctly
                                                                const weekStart = new Date().toISOString();
                                                                return { generatedAt, weeks: [{ weekStart, themes, programmedNeeds }] };
                                                            }}
                                                            save={() => {
                                                                try { localStorage.setItem('programme-besoins-assemblee', JSON.stringify({ themes, programmedNeeds, savedAt: new Date().toISOString() })); } catch {};
                                                            }}
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={handlePrint}><Printer className="h-5 w-5"/></Button>
                                                        <Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5"/></Button>
                                                 </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden printable-area">
                   <div className="print-only hidden my-4">
                        <h2 className="text-xl font-bold text-center">Besoins de l'assemblée programmés</h2>
                   </div>
                   <div className="border rounded-md h-full">
                     <ScrollArea className="h-full">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted">
                                <TableRow>
                                    <TableHead className="w-1/6">Date</TableHead>
                                    <TableHead className="w-[50px]">min.</TableHead>
                                    <TableHead>Titre</TableHead>
                                    <TableHead className="w-1/4">Orateur</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {programmedNeeds.map((need) => (
                                    <TableRow key={need.id}>
                                        <TableCell>{need.date}</TableCell>
                                        <TableCell>{need.minutes}</TableCell>
                                        <TableCell>{need.title}</TableCell>
                                        <TableCell>{need.orateur}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}