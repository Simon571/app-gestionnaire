
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
import { Plus, Trash2, Mail, Printer, HelpCircle, Users, Home, UsersRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const groupData: any[] = [];

const PublisherIcon = ({ gender = 'male' }: { gender?: 'male' | 'female' }) => {
    return <Users className={`h-4 w-4 ${gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
}

const PreachingGroupsView = () => {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline"><Plus /></Button>
                        <Button size="icon" variant="outline"><Trash2 /></Button>
                        <Button size="icon" variant="outline"><Mail /></Button>
                        <Button size="icon" variant="outline"><Printer /></Button>
                        <Button size="icon" variant="outline"><HelpCircle /></Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="groups-per-page">Groupes par page</Label>
                        <Select defaultValue="4">
                            <SelectTrigger id="groups-per-page" className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupData.map(group => (
                     <Card key={group.id} className="flex flex-col">
                        <CardHeader className="p-2 border-b">
                            <Select defaultValue={group.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {groupData.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                    <SelectItem value="unassigned">Non assignés</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="p-0 flex-grow">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Prénom</TableHead>
                                            <TableHead className="w-8 p-1"><Home className="w-4 h-4" /></TableHead>
                                            <TableHead className="w-8 p-1"><Users className="w-4 h-4" /></TableHead>
                                            <TableHead>Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.publishers.map((pub: any) => (
                                            <TableRow key={pub.id}>
                                                <TableCell className="p-1 font-medium">{pub.lastName}</TableCell>
                                                <TableCell className="p-1">{pub.firstName}</TableCell>
                                                <TableCell className="p-1 text-center">{pub.isHead && <Home className="w-4 h-4 inline-block" />}</TableCell>
                                                <TableCell className="p-1 text-center"><PublisherIcon gender={pub.id % 2 === 0 ? 'female' : 'male'} /></TableCell>
                                                <TableCell className="p-1 text-xs">{pub.status}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 border-t text-xs text-muted-foreground">
                             <div className="grid grid-cols-2 gap-x-2 w-full">
                                <span>(Resp.) {group.stats.publishers}</span>
                                <span>(Adj.) {group.stats.unbaptized}</span>
                                <span>Non {group.stats.not}</span>
                                <span>A {group.stats.a}</span>
                                <span>AM {group.stats.am}</span>
                                <span>PS {group.stats.ps}</span>
                                <span>PP {group.stats.pp}</span>
                                <span>PA {group.stats.pa}</span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    )
}

const FamiliesView = () => {
    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold">Famille</h2>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">La vue des familles sera bientôt disponible.</p>
            </CardContent>
        </Card>
    )
}

export default function GroupsFamiliesPage() {
  const [activeView, setActiveView] = React.useState('preaching_groups');

  return (
    <div className="space-y-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Groupes et Familles</h1>
        </div>

        <div className="flex gap-2 border-b">
            <Button variant="ghost" onClick={() => setActiveView('preaching_groups')} className={cn("rounded-b-none", activeView === 'preaching_groups' && 'border-b-2 border-primary')}>
                <UsersRound className="mr-2 h-4 w-4" />Groupe
            </Button>
            <Button variant="ghost" onClick={() => setActiveView('families')} className={cn("rounded-b-none", activeView === 'families' && 'border-b-2 border-primary')}>
                <Home className="mr-2 h-4 w-4" />Famille
            </Button>
        </div>

        <div>
            {activeView === 'preaching_groups' && <PreachingGroupsView />}
            {activeView === 'families' && <FamiliesView />}
        </div>
    </div>
  );
}
