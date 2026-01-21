'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
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
import { Plus, Trash2, Mail, Printer, HelpCircle, Users, Home, UsersRound, PersonStanding, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import { ScrollArea } from '@/components/ui/scroll-area';

const GroupForm = ({ onSave, onCancel, initialName = '' }: { onSave: (name: string) => void, onCancel: () => void, initialName?: string }) => {
    const [name, setName] = React.useState(initialName);
    
    React.useEffect(() => {
        setName(initialName);
    }, [initialName]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave(name);
            setName('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nom du groupe
                    </Label>
                    <Input 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        placeholder="Ex: Groupe 1"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">{initialName ? 'Modifier' : 'Sauvegarder'}</Button>
            </DialogFooter>
        </form>
    );
};

const PublisherIcon = ({ gender }: { gender: 'male' | 'female' | null }) => {
    if (gender === 'male') return <Users className="h-4 w-4 text-blue-500" />;
    if (gender === 'female') return <PersonStanding className="h-4 w-4 text-pink-500" />;
    return null;
}

const getRoleAbbreviation = (person: Person) => {
    if (person.spiritual.pioneer.status === 'permanent') return 'PP';
    if (person.spiritual.pioneer.status === 'special') return 'PS';
    if (person.spiritual.pioneer.status === 'missionary') return 'M';
    if (person.spiritual.pioneer.status === 'aux-permanent') return 'PA';
    if (person.spiritual.function === 'elder') return 'A';
    if (person.spiritual.function === 'servant') return 'AM';
    if (person.spiritual.function === 'publisher') return 'P';
    return '';
}

const PreachingGroupsView = () => {
    const { people, preachingGroups, addPreachingGroup, updatePreachingGroup, deletePreachingGroup, isLoaded } = usePeople();
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [editingGroup, setEditingGroup] = React.useState<{ id: string, name: string } | null>(null);
    const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
    const [groupsPerPage, setGroupsPerPage] = React.useState(10);
    const [currentPage, setCurrentPage] = React.useState(1);

    const handlePrint = () => {
        window.print();
    };

    const handleAddGroup = (name: string) => {
        addPreachingGroup(name);
        setIsAddDialogOpen(false);
    };

    const handleEditGroup = (name: string) => {
        if (editingGroup) {
            updatePreachingGroup(editingGroup.id, name);
            setEditingGroup(null);
        }
    };

    const handleSelectionChange = (groupId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedGroupIds(prev => [...prev, groupId]);
        } else {
            setSelectedGroupIds(prev => prev.filter(id => id !== groupId));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedGroupIds.length} groupe(s) ? Cette action est irréversible.`)) {
            selectedGroupIds.forEach(id => deletePreachingGroup(id));
            setSelectedGroupIds([]);
        }
    };

    const handleMail = () => {
        let body = "Voici la liste des groupes de prédication :\n\n";
        groups.forEach(group => {
            body += `----------------------------------------\n`;
            body += `${group.name}\n`;
            body += `----------------------------------------\n`;
            body += `Responsable: ${group.stats.overseer}\n`;
            body += `Adjoint: ${group.stats.assistant}\n`;
            body += `Total: ${group.stats.total}\n\n`;
            body += "Membres:\n";
            group.members.forEach(member => {
                body += `- ${member.displayName}\n`;
            });
            body += `\n\n`;
        });

        const subject = "Liste des groupes de prédication";
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const groups = React.useMemo(() => {
        // Start with the definitive list of preaching groups, sorted by name
        const sortedGroups = [...preachingGroups].sort((a, b) => a.name.localeCompare(b.name));

        // Create a map of members for easy lookup
        const membersByGroup: Record<string, Person[]> = {};
        people.forEach(person => {
            const groupId = person.spiritual.group;
            if (groupId) {
                if (!membersByGroup[groupId]) {
                    membersByGroup[groupId] = [];
                }
                membersByGroup[groupId].push(person);
            }
        });

        // Map over the sorted list of groups and attach members and stats
        return sortedGroups.map(group => {
            const members = membersByGroup[group.id] || [];
            const overseer = members.find(m => m.spiritual.roleInGroup === 'overseer');
            const assistant = members.find(m => m.spiritual.roleInGroup === 'assistant');
            
            return {
                id: group.id,
                name: group.name,
                members,
                stats: {
                    overseer: overseer ? `${overseer.lastName} ${overseer.firstName}` : 'N/A',
                    assistant: assistant ? `${assistant.lastName} ${assistant.firstName}` : 'N/A',
                    total: members.length,
                }
            };
        });
    }, [people, preachingGroups]);

    const totalPages = Math.max(1, Math.ceil(groups.length / groupsPerPage));
    const paginatedGroups = groups.slice(
        (currentPage - 1) * groupsPerPage,
        currentPage * groupsPerPage
    );

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-lg text-muted-foreground">Chargement des données...</p>
            </div>
        );
    }

    return (
        <Card className="printable-area">

            <CardHeader className="no-print">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="outline"><Plus /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ajouter un groupe de prédication</DialogTitle>
                                </DialogHeader>
                                <GroupForm onSave={handleAddGroup} onCancel={() => setIsAddDialogOpen(false)} />
                            </DialogContent>
                        </Dialog>
                        <Button size="icon" variant="outline" onClick={handleDeleteSelected} disabled={selectedGroupIds.length === 0}>
                            <Trash2 />
                        </Button>
                        <Button size="icon" variant="outline" onClick={handleMail}><Mail /></Button>
                        <Button size="icon" variant="outline" onClick={handlePrint}><Printer /></Button>
                        <Button size="icon" variant="outline"><HelpCircle /></Button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="groups-per-page" className="whitespace-nowrap">Groupes par page :</Label>
                            <Select
                                value={String(groupsPerPage)}
                                onValueChange={(value) => {
                                    setGroupsPerPage(Number(value));
                                    setCurrentPage(1); // Reset to first page
                                }}
                            >
                                <SelectTrigger id="groups-per-page" className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <ScrollArea className="h-[40vh]">
                                        {[...Array(10)].map((_, i) => (
                                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                                        ))}
                                        <SelectItem value={String(groups.length || 10)}>Tous</SelectItem>
                                    </ScrollArea>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Précédent
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} sur {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= totalPages}
                            >
                                Suivant
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedGroups.map(group => (
                     <Card key={group.id} className="flex flex-col">
                        <CardHeader className="p-2 border-b bg-muted/30 flex-row items-center justify-between gap-2">
                           <div className="flex items-center gap-2">
                               <Checkbox 
                                    id={`select-${group.id}`}
                                    className="no-print"
                                    onCheckedChange={(checked) => handleSelectionChange(group.id, Boolean(checked))}
                                    checked={selectedGroupIds.includes(group.id)}
                               />
                               <CardTitle className="text-base">{group.name}</CardTitle>
                           </div>
                           <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-6 w-6 no-print"
                               onClick={() => setEditingGroup({ id: group.id, name: group.name })}
                           >
                               <Edit className="h-3 w-3" />
                           </Button>
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
                                        {group.members.map((pub: Person) => (
                                            <TableRow key={pub.id}>
                                                <TableCell className="p-1 font-medium">{pub.lastName}</TableCell>
                                                <TableCell className="p-1">{pub.firstName}</TableCell>
                                                <TableCell className="p-1 text-center">{pub.isHeadOfFamily && <Home className="w-4 h-4 inline-block" />}</TableCell>
                                                <TableCell className="p-1 text-center"><PublisherIcon gender={pub.gender} /></TableCell>
                                                <TableCell className="p-1 text-xs">{getRoleAbbreviation(pub)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="p-2 border-t text-xs text-muted-foreground">
                             <div className="grid grid-cols-2 gap-x-2 w-full">
                                <span>(Resp.) {group.stats.overseer}</span>
                                <span>(Adj.) {group.stats.assistant}</span>
                                <span>Total: {group.stats.total}</span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>

            {/* Dialog de modification de groupe */}
            <Dialog open={editingGroup !== null} onOpenChange={(open) => !open && setEditingGroup(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le groupe</DialogTitle>
                    </DialogHeader>
                    <GroupForm 
                        onSave={handleEditGroup} 
                        onCancel={() => setEditingGroup(null)}
                        initialName={editingGroup?.name || ''}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    )
}

const FamilyForm = ({ onSave, onCancel, initialName = '' }: { onSave: (name: string) => void, onCancel: () => void, initialName?: string }) => {
    const [name, setName] = React.useState(initialName);
    
    React.useEffect(() => {
        setName(initialName);
    }, [initialName]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave(name);
            setName('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nom de la famille
                    </Label>
                    <Input 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="col-span-3"
                        placeholder="Ex: Famille Dupont"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">{initialName ? 'Modifier' : 'Sauvegarder'}</Button>
            </DialogFooter>
        </form>
    );
};

const mainFilters = {
    'all': 'Tous',
    'families': 'Familles',
    'all_publishers': 'Tous les proclamateurs',
    'active_publishers': 'Proclamateurs actifs',
    'irregular_publishers': 'Proclamateurs irréguliers',
    'inactive_publishers': 'Proclamateurs inactifs',
    'unbaptized_publishers': 'Proclamateurs non baptisés',
    'not_publishers': 'Pas proclamateurs',
    'baptized': 'Baptisé(e)',
    'elders': 'Anciens',
    'servants': 'Assistants',
    'appointed_brothers': 'Frères nommés',
    'active_unappointed_brothers': 'Frères actifs non nommés',
    'brothers': 'Frères',
    'sisters': 'Sœurs',
    'all_pioneers': 'Tous les pionniers',
    'regular_pioneers': 'Pionniers permanents',
    'auxiliary_pioneers': 'Pionniers auxiliaires',
    'special_pioneers': 'Pionniers spéciaux',
    'missionaries': 'Missionnaires affectés dans le territoire',
    'group_overseers': 'Responsables de groupe',
    'group_assistants': 'Adjoints de groupe',
    'family_heads': 'Chef de famille',
    'aged_or_infirm': 'Âgé/infirme',
    'child': 'Enfant',
    'blind': 'Aveugle',
    'deaf': 'Sourd',
    'incarcerated': 'Incarc��ré',
    'other_personal_info': 'Autres informations personnelles',
    'anointed': 'Oint',
    'kh_key': 'Clé de la Salle du Royaume',
    'tele_volunteer': 'Télévolontaire',
    'complex_volunteer': 'Volontaire au complexe',
    'bethel_volunteer': 'Volontaire au BÉTHEL',
    'direct_reports': 'Rapports envoyés directement à la filiale',
    'deleted': 'Supprimé',
    'departed': 'Parti(e)',
};

const FamiliesView = () => {
    const { families, people, addFamily, updateFamily, deleteFamily, preachingGroups, isLoaded } = usePeople();
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [editingFamily, setEditingFamily] = React.useState<{ id: string, name: string } | null>(null);
    const [selectedFamilyIds, setSelectedFamilyIds] = React.useState<string[]>([]);
    const [activeFilter, setActiveFilter] = React.useState('all');
    const [selectedGroupId, setSelectedGroupId] = React.useState('all-groups');

    const handlePrint = () => {
        window.print();
    };

    const handleAddFamily = (name: string) => {
        addFamily(name);
        setIsAddDialogOpen(false);
    };

    const handleEditFamily = (name: string) => {
        if (editingFamily) {
            updateFamily(editingFamily.id, name);
            setEditingFamily(null);
        }
    };

    const handleSelectionChange = (familyId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedFamilyIds(prev => [...prev, familyId]);
        } else {
            setSelectedFamilyIds(prev => prev.filter(id => id !== familyId));
        }
    };

    const handleDeleteSelected = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedFamilyIds.length} famille(s) ? Les membres de la famille ne seront pas supprimés, mais seulement leur affiliation familiale.`)) {
            selectedFamilyIds.forEach(id => deleteFamily(id));
            setSelectedFamilyIds([]);
        }
    };

    const familiesWithMembers = React.useMemo(() => {
        const filteredPeopleByStatus = people.filter(p => {
            if (activeFilter === 'all' || activeFilter === 'families') return true;
            
            const spiritual = p.spiritual;
            if (!spiritual) return false;

            switch(activeFilter) {
                case 'all_publishers': return spiritual.function && ['publisher', 'servant', 'elder', 'unbaptized'].includes(spiritual.function);
                case 'active_publishers': return spiritual.active;
                case 'irregular_publishers': return spiritual.active && !spiritual.regular;
                case 'inactive_publishers': return !spiritual.active;
                case 'unbaptized_publishers': return spiritual.function === 'unbaptized';
                case 'not_publishers': return !spiritual.function;
                case 'baptized': return !!spiritual.baptismDate;
                case 'elders': return spiritual.function === 'elder';
                case 'servants': return spiritual.function === 'servant';
                case 'appointed_brothers': return p.gender === 'male' && (spiritual.function === 'elder' || spiritual.function === 'servant');
                case 'active_unappointed_brothers': return p.gender === 'male' && spiritual.active && !spiritual.function;
                case 'brothers': return p.gender === 'male';
                case 'sisters': return p.gender === 'female';
                case 'all_pioneers': return !!spiritual.pioneer.status;
                case 'regular_pioneers': return spiritual.pioneer.status === 'permanent';
                case 'auxiliary_pioneers': return spiritual.pioneer.status === 'aux-permanent';
                case 'special_pioneers': return spiritual.pioneer.status === 'special';
                case 'missionaries': return spiritual.pioneer.status === 'missionary';
                case 'group_overseers': return spiritual.roleInGroup === 'overseer';
                case 'group_assistants': return spiritual.roleInGroup === 'assistant';
                case 'family_heads': return p.isHeadOfFamily;
                case 'aged_or_infirm': return p.agedOrInfirm;
                case 'child': return p.child;
                case 'blind': return p.blind;
                case 'deaf': return p.deaf;
                case 'incarcerated': return p.incarcerated;
                case 'other_personal_info': return !!p.otherInfo;
                case 'anointed': return spiritual.anointed;
                case 'kh_key': return !!spiritual.kingdomHallKey;
                case 'tele_volunteer': return !!spiritual.teleVolunteerDate;
                case 'complex_volunteer': return !!spiritual.complexVolunteerDate;
                case 'bethel_volunteer': return !!spiritual.bethelVolunteerDate;
                case 'direct_reports': return spiritual.directReports;
                case 'deleted': return spiritual.isDeleted;
                case 'departed': return p.departed;
                default: return true;
            }
        });

        const filteredPeople = (() => {
            if (selectedGroupId === 'all-groups') {
                return filteredPeopleByStatus;
            }
            if (selectedGroupId === 'unassigned') {
                return filteredPeopleByStatus.filter(p => !p.spiritual.group);
            }
            return filteredPeopleByStatus.filter(p => p.spiritual.group === selectedGroupId);
        })();

        const sortedFamilies = [...families].sort((a, b) => a.name.localeCompare(b.name));
        return sortedFamilies.map(family => ({
            ...family,
            members: filteredPeople.filter(p => p.familyId === family.id)
        })).filter(family => family.members.length > 0);
    }, [families, people, activeFilter, selectedGroupId]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-lg text-muted-foreground">Chargement des données...</p>
            </div>
        );
    }

    return (
        <Card className="printable-area">
            <CardHeader className="no-print">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle>Familles</CardTitle>
                        <Select value={activeFilter} onValueChange={setActiveFilter}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-[40vh]">
                                    {Object.entries(mainFilters).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Tous les groupes" />
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-[40vh]">
                                    <SelectItem value="all-groups">Tous les groupes</SelectItem>
                                    {preachingGroups.sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                    <SelectItem value="unassigned">Non attribué</SelectItem>
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="outline"><Plus /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ajouter une famille</DialogTitle>
                                </DialogHeader>
                                <FamilyForm onSave={handleAddFamily} onCancel={() => setIsAddDialogOpen(false)} />
                            </DialogContent>
                        </Dialog>
                        <Button size="icon" variant="outline" onClick={handleDeleteSelected} disabled={selectedFamilyIds.length === 0}><Trash2 /></Button>
                        <Button size="icon" variant="outline" onClick={handlePrint}><Printer /></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {(activeFilter === 'all' && selectedGroupId === 'all-groups') ? (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Famille</TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Prénom</TableHead>
                                        <TableHead className="w-8 p-1"><Home className="w-4 h-4" /></TableHead>
                                        <TableHead className="w-8 p-1"><Users className="w-4 h-4" /></TableHead>
                                        <TableHead className="w-8 p-1 no-print">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {familiesWithMembers.flatMap(family => 
                                        family.members.map((member, memberIndex) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="p-1 font-bold">{family.name}</TableCell>
                                                <TableCell className="p-1 font-medium">{member.lastName}</TableCell>
                                                <TableCell className="p-1">{member.firstName}</TableCell>
                                                <TableCell className="p-1 text-center">{member.isHeadOfFamily && <Home className="w-4 h-4 inline-block" />}</TableCell>
                                                <TableCell className="p-1 text-center"><PublisherIcon gender={member.gender} /></TableCell>
                                                <TableCell className="p-1 text-center no-print">
                                                    {memberIndex === 0 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6"
                                                            onClick={() => setEditingFamily({ id: family.id, name: family.name })}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {familiesWithMembers.map(family => (
                            <Card key={family.id}>
                                <CardHeader className="p-2 border-b bg-muted/30 flex-row items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`select-family-${family.id}`}
                                            className="no-print"
                                            onCheckedChange={(checked) => handleSelectionChange(family.id, Boolean(checked))}
                                            checked={selectedFamilyIds.includes(family.id)}
                                       />
                                        <CardTitle className="text-base">{family.name}</CardTitle>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 no-print"
                                        onClick={() => setEditingFamily({ id: family.id, name: family.name })}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nom</TableHead>
                                                <TableHead>Prénom</TableHead>
                                                <TableHead className="w-8 p-1"><Home className="w-4 h-4" /></TableHead>
                                                <TableHead className="w-8 p-1"><Users className="w-4 h-4" /></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {family.members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="p-1 font-medium">{member.lastName}</TableCell>
                                                    <TableCell className="p-1">{member.firstName}</TableCell>
                                                    <TableCell className="p-1 text-center">{member.isHeadOfFamily && <Home className="w-4 h-4 inline-block" />}</TableCell>
                                                    <TableCell className="p-1 text-center"><PublisherIcon gender={member.gender} /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Dialog de modification de famille */}
            <Dialog open={editingFamily !== null} onOpenChange={(open) => !open && setEditingFamily(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la famille</DialogTitle>
                    </DialogHeader>
                    <FamilyForm 
                        onSave={handleEditFamily} 
                        onCancel={() => setEditingFamily(null)}
                        initialName={editingFamily?.name || ''}
                    />
                </DialogContent>
            </Dialog>
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
                <UsersRound className="mr-2 h-4 w-4" />Groupes
            </Button>
            <Button variant="ghost" onClick={() => setActiveView('families')} className={cn("rounded-b-none", activeView === 'families' && 'border-b-2 border-primary')}>
                <Home className="mr-2 h-4 w-4" />Familles
            </Button>
        </div>

        <div>
            {activeView === 'preaching_groups' && <PreachingGroupsView />}
            {activeView === 'families' && <FamiliesView />}
        </div>
    </div>
  );
}