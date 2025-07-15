
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MessageSquare, Printer, HelpCircle } from 'lucide-react';

type Theme = {
  id: string;
  title: string;
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

const initialThemes: Theme[] = [
    { id: '1', title: '', orateur: '', programmedDate: '' },
    { id: '2', title: '', orateur: '', programmedDate: '' },
    { id: '3', title: '', orateur: '', programmedDate: '' },
    { id: '4', title: '', orateur: '', programmedDate: '' },
    { id: '5', title: '', orateur: '', programmedDate: '' },
    { id: '6', title: '', orateur: '', programmedDate: '' },
    { id: '7', title: '', orateur: '', programmedDate: '' },
    { id: '8', title: '', orateur: '', programmedDate: '' },
];

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full items-start">
            {/* Left Panel: Themes */}
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Thèmes des besoins de l'assemblée</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="outline" size="icon"><Plus /></Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive"><Trash2 /></Button>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <Input id="theme-title" placeholder="Titre"/>
                            </div>
                            <div>
                                <Textarea id="theme-description" placeholder="Description" className="h-20" />
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
                                        <TableRow key={theme.id} onClick={() => setSelectedTheme(theme)}>
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
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle>Besoins de l'assemblée programmés</CardTitle>
                         <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5"/></Button>
                            <Button variant="ghost" size="icon"><Printer className="h-5 w-5"/></Button>
                            <Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5"/></Button>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
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
