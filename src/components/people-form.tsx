

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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Printer, HelpCircle, User, BookOpen, CheckSquare, Activity, Siren, MapPin, Crosshair, Edit, PersonStanding, Plane, UserMinus, Calendar as CalendarIcon, Users as UsersIcon, GraduationCap, Briefcase, KeyRound, Wine, BarChart2, TrendingUp, Presentation, CheckCircle, Book, CircleUser, ShieldQuestion, Search, Home, Diamond, LifeBuoy, Heart, Landmark, Wrench, Sparkles, HandPlatter, Link, Unlink, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parse, isValid, getYear, setYear, getMonth, setMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from './ui/table';
import type { Person } from '@/app/personnes/page';
import { ScrollArea } from './ui/scroll-area';
import { usePeople } from '@/context/people-context';
import { Textarea } from './ui/textarea';

const GenderButton = ({
  gender,
  selectedGender,
  onSelect,
  children,
  icon: Icon
}: {
  gender: 'male' | 'female',
  selectedGender: 'male' | 'female' | null,
  onSelect: (gender: 'male' | 'female') => void,
  children: React.ReactNode,
  icon: React.ElementType
}) => (
  <Button
    type="button"
    variant={selectedGender === gender ? 'default' : 'outline'}
    onClick={() => onSelect(gender)}
    className={cn(
        "bg-white hover:bg-gray-100",
        selectedGender === gender && "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200"
    )}
  >
    <Icon className="h-4 w-4 mr-2" />
    {children}
  </Button>
);

const DateInput = ({ date, setDate, placeholder = "jj/mm/aa" }: { date?: Date, setDate: (date?: Date) => void, placeholder?: string }) => {
    const [inputValue, setInputValue] = React.useState(date ? format(date, "dd/MM/yy") : "");

    React.useEffect(() => {
        setInputValue(date ? format(date, "dd/MM/yy") : "");
    }, [date]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (value.length >= 8) {
             try {
                const parsedDate = parse(value, 'dd/MM/yy', new Date());
                if (isValid(parsedDate)) {
                    setDate(parsedDate);
                } else {
                    setDate(undefined);
                }
            } catch (error) {
                setDate(undefined);
            }
        } else if (value === "") {
            setDate(undefined);
        }
    };

    const handleDateSelect = (selectedDate?: Date) => {
        setDate(selectedDate);
        if (selectedDate && isValid(selectedDate)) {
            setInputValue(format(selectedDate, "dd/MM/yy"));
        } else {
            setInputValue("");
        }
    };
    
    return (
    <div className="relative flex items-center">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-28 bg-white h-8 pr-8"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="absolute right-0 h-8 w-8 p-0">
            <span className="sr-only">Ouvrir le calendrier</span>
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const FamilyManager = ({ families, onAddFamily, onCancel }: { families: {id: string, name: string}[], onAddFamily: (name: string) => void, onCancel: () => void }) => {
    const [newFamilyName, setNewFamilyName] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFamilyName.trim()) {
            onAddFamily(newFamilyName.trim());
            setNewFamilyName('');
        }
    };

    return (
        <div>
            <div className="max-h-60 overflow-y-auto border rounded-md mb-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom de la famille</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {families.map(family => (
                            <TableRow key={family.id}>
                                <TableCell>{family.name}</TableCell>
                            </TableRow>
                        ))}
                         {families.length === 0 && (
                            <TableRow>
                                <TableCell className="text-center text-muted-foreground">Aucune famille ajoutée.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input 
                    placeholder="Nom de la nouvelle famille"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                />
                <Button type="submit">Ajouter</Button>
            </form>
             <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={onCancel}>Fermer</Button>
            </DialogFooter>
        </div>
    );
};

const InfoTab = ({ personData, setPersonData }: { personData: any, setPersonData: (data: any) => void}) => {
    
    const { families, addFamily } = usePeople();
    const [isFamilyManagerOpen, setIsFamilyManagerOpen] = React.useState(false);
    
    React.useEffect(() => {
        const nameParts = [personData.firstName, personData.middleName, personData.lastName].filter(Boolean);
        const newDisplayName = nameParts.join(' ');
        if (newDisplayName !== personData.displayName) {
           setPersonData({ ...personData, displayName: newDisplayName });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personData.firstName, personData.middleName, personData.lastName]);


    const calculateAge = (date: Date) => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            age--;
        }
        return age.toFixed(1);
    }
    
    const handleChange = (field: string, value: any) => {
        setPersonData({ ...personData, [field]: value });
    };
    
    const handleAddFamily = (name: string) => {
        const newFamily = addFamily(name);
        handleChange('familyId', newFamily.id);
    };

    
                return (
        <div className="space-y-4 p-1">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Prénom" value={personData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} />
                <Input placeholder="Deuxième prénom" value={personData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} />
                <Input placeholder="Nom de famille" value={personData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
                <Input placeholder="Suffixe" value={personData.suffix} onChange={(e) => handleChange('suffix', e.target.value)} />
            </div>
            <Input placeholder="Nom affiché" value={personData.displayName} readOnly onChange={(e) => handleChange('displayName', e.target.value)} />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Téléphone fixe" type="tel" value={personData.homePhone} onChange={(e) => handleChange('homePhone', e.target.value)}/>
                <Input placeholder="Mobile" type="tel" value={personData.mobilePhone} onChange={(e) => handleChange('mobilePhone', e.target.value)} />
                <Input placeholder="Travail" type="tel" value={personData.workPhone} onChange={(e) => handleChange('workPhone', e.target.value)} />
            </div>
            <div className="flex items-center gap-4">
                <Input placeholder="Adresse" className="flex-grow" value={personData.address} onChange={(e) => handleChange('address', e.target.value)}/>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="link-family" checked={personData.linkFamily} onCheckedChange={(c) => handleChange('linkFamily', Boolean(c))} />
                    <Label htmlFor="link-family" className="whitespace-nowrap text-muted-foreground">Lien avec la famille</Label>
                </div>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4"/> Naviguer
                </Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Input placeholder="Latitude" value={personData.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
                <Input placeholder="Longitude" value={personData.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
                 <div className="flex items-center gap-2">
                     <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Crosshair className="h-4 w-4" /> Géolocaliser
                    </Button>
                    <span className="text-sm text-muted-foreground">Coordonnées GPS</span>
                 </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="E-mail" type="email" value={personData.email1} onChange={(e) => handleChange('email1', e.target.value)}/>
                <Input placeholder="E-mail 2" type="email" value={personData.email2} onChange={(e) => handleChange('email2', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Genre</Label>
                    <GenderButton gender="male" selectedGender={personData.gender} onSelect={(g) => handleChange('gender', g)} icon={User}>
                        Homme
                    </GenderButton>
                    <GenderButton gender="female" selectedGender={personData.gender} onSelect={(g) => handleChange('gender', g)} icon={PersonStanding}>
                        Femme
                    </GenderButton>
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Date de naissance</Label>
                    <DateInput date={personData.birthDate} setDate={(d) => handleChange('birthDate', d)} />
                    {personData.birthDate && isValid(personData.birthDate) && <span className="text-sm text-muted-foreground">({calculateAge(personData.birthDate)} Années)</span>}
                </div>
                 <div className="flex items-center gap-2">
                    <Label className="text-muted-foreground">Famille</Label>
                     <Select value={personData.familyId || "no-family"} onValueChange={(v) => handleChange('familyId', v === 'no-family' ? null : v)}>
                        <SelectTrigger className="flex-grow bg-white">
                            <SelectValue placeholder="Aucune famille" />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-[40vh]">
                                <SelectItem value="no-family">Aucune famille</SelectItem>
                                {families.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                     <Dialog open={isFamilyManagerOpen} onOpenChange={setIsFamilyManagerOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Gérer les familles</DialogTitle>
                            </DialogHeader>
                            <FamilyManager 
                                families={families} 
                                onAddFamily={handleAddFamily}
                                onCancel={() => setIsFamilyManagerOpen(false)} 
                            />
                        </DialogContent>
                     </Dialog>
                </div>
            </div>
            <div className="border-t pt-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="autre" checked={personData.other} onCheckedChange={(c) => handleChange('other', Boolean(c))} />
                            <Label htmlFor="autre">Autre</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="enfant" checked={personData.child} onCheckedChange={(c) => handleChange('child', Boolean(c))} />
                            <Label htmlFor="enfant">Enfant</Label>
                        </div>
                        <Input placeholder="Autres informations" value={personData.otherInfo} onChange={(e) => handleChange('otherInfo', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="age-infirme" checked={personData.agedOrInfirm} onCheckedChange={(c) => handleChange('agedOrInfirm', Boolean(c))} />
                            <Label htmlFor="age-infirme">Âgé/infirme</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center space-x-2">
                            <Checkbox id="sourd" checked={personData.deaf} onCheckedChange={(c) => handleChange('deaf', Boolean(c))} />
                            <Label htmlFor="sourd">Sourd</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="aveugle" checked={personData.blind} onCheckedChange={(c) => handleChange('blind', Boolean(c))} />
                            <Label htmlFor="aveugle">Aveugle</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="incarcere" checked={personData.incarcerated} onCheckedChange={(c) => handleChange('incarcere', Boolean(c))} />
                            <Label htmlFor="incarcere">Incarcéré</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="chef-famille" checked={personData.isHeadOfFamily} onCheckedChange={(c) => handleChange('isHeadOfFamily', Boolean(c))} />
                            <Label htmlFor="chef-famille">Chef de famille</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="desactiver-acces" checked={personData.disableAppAccess} onCheckedChange={(c) => handleChange('disableAppAccess', Boolean(c))} />
                            <Label htmlFor="desactiver-acces">Désactiver l'accès à l'Appli</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="supprimer-infos" checked={personData.deletePersonalInfo} onCheckedChange={(c) => handleChange('deletePersonalInfo', Boolean(c))} />
                            <Label htmlFor="supprimer-infos">Supprimer les informations personnelles</Label>
                        </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                       <Label className="text-muted-foreground" htmlFor="notes">Notes</Label>
                       <Input id="notes" value={personData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between">
                         <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                           <Plane className="mr-2 h-4 w-4"/> Périodes d'absence
                         </Button>
                         <div className="flex items-center gap-2">
                            <Label htmlFor="parti">Parti(e)</Label>
                            <Checkbox id="parti" checked={personData.departed} onCheckedChange={(c) => handleChange('departed', Boolean(c))}/>
                         </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};
const GroupForm = ({ onSave, onCancel }: { onSave: (name: string) => void, onCancel: () => void }) => {
    const [name, setName] = React.useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave(name);
            setName(''); // Reset after save
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
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
        </form>
    );
};

const PreachingGroupManager = ({ groups, onAddGroup, onDeleteGroup, onCancel }: { groups: {id: string, name: string}[], onAddGroup: (name: string) => void, onDeleteGroup: (id: string) => void, onCancel: () => void }) => {
    const [newGroupName, setNewGroupName] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGroupName.trim()) {
            onAddGroup(newGroupName.trim());
            setNewGroupName('');
        }
    };

    return (
        <div>
            <div className="max-h-60 overflow-y-auto border rounded-md mb-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du groupe</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.map(group => (
                            <TableRow key={group.id}>
                                <TableCell>{group.name}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => onDeleteGroup(group.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {groups.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">Aucun groupe ajouté.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input 
                    placeholder="Nom du nouveau groupe"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Button type="submit">Ajouter</Button>
            </form>
             <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={onCancel}>Fermer</Button>
            </DialogFooter>
        </div>
    );
};



const SpiritualTab = ({ spiritualData, setSpiritualData }: { spiritualData: any, setSpiritualData: (data: any) => void}) => {
    
    const { preachingGroups, addPreachingGroup, deletePreachingGroup } = usePeople();
    const [isGroupManagerOpen, setIsGroupManagerOpen] = React.useState(false);

    const handleChange = (field: string, value: any) => {
        if (field === 'group') {
            const selectedGroup = preachingGroups.find(g => g.id === value);
            setSpiritualData({ 
                ...spiritualData, 
                group: value,
                groupName: selectedGroup ? selectedGroup.name : null
            });
        } else {
            setSpiritualData({ ...spiritualData, [field]: value });
        }
    };

    const handleFunctionChange = (key: string) => {
        handleChange('function', spiritualData.function === key ? null : key);
    };

    const handlePioneerStatusChange = (key: string) => {
        const currentStatus = spiritualData.pioneer.status;
        handleChange('pioneer', { ...spiritualData.pioneer, status: currentStatus === key ? null : key });
    };

    const handlePioneerSubChange = (field: string, value: any) => {
         handleChange('pioneer', { ...spiritualData.pioneer, [field]: value });
    }

    const calculateYears = (date?: Date) => {
        if (!date || !isValid(date)) return 0;
        const today = new Date();
        let years = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            years--;
        }
        return years;
    }
    
    const handleSaveGroup = (name: string) => {
        const newGroup = addPreachingGroup(name);
        handleChange('group', newGroup.id);
    };

    const handleDeleteGroup = (groupId: string) => {
        // If the deleted group was the selected one, unassign it
        if (spiritualData.group === groupId) {
            handleChange('group', null);
        }
        deletePreachingGroup(groupId);
    };

    return (
        <div className="p-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne 1 */}
            <div className="space-y-4">
                <div>
                    <Label>Groupe</Label>
                    <div className="flex items-center gap-2">
                        <Select value={spiritualData.group || "non-attribue"} onValueChange={(v) => handleChange('group', v === 'non-attribue' ? null : v)}>
                            <SelectTrigger className="h-8 bg-white">
                                <SelectValue placeholder="Non attribué" />
                            </SelectTrigger>
                            <SelectContent>
                                    <ScrollArea className="h-[40vh]">
                                        <SelectItem value="non-attribue">Non attribué</SelectItem>
                                        {preachingGroups
                                            .slice() // Create a shallow copy to avoid mutating the original array
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(group => (
                                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))}
                                    </ScrollArea>
                                </SelectContent>
                        </Select>
                        <Dialog open={isGroupManagerOpen} onOpenChange={setIsGroupManagerOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Gérer les groupes de prédication</DialogTitle>
                                </DialogHeader>
                                <PreachingGroupManager 
                                    groups={preachingGroups}
                                    onAddGroup={handleSaveGroup}
                                    onDeleteGroup={handleDeleteGroup}
                                    onCancel={() => setIsGroupManagerOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <RadioGroup value={spiritualData.roleInGroup} onValueChange={(v) => handleChange('roleInGroup', v)} className="flex items-center gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="overseer" id="respon" />
                            <Label htmlFor="respon" className="font-normal text-xs">Respon</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="assistant" id="adjoint" />
                            <Label htmlFor="adjoint" className="font-normal text-xs">Adjoint</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="member" id="role-non" />
                            <Label htmlFor="role-non" className="font-normal text-xs">Non</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                         <Label>Fonction</Label>
                         <DateInput date={spiritualData.functionDate} setDate={(d) => handleChange('functionDate', d)} placeholder="//" />
                    </div>
                    <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="f-ancien" checked={spiritualData.function === 'elder'} onCheckedChange={() => handleFunctionChange('elder')} />
                            <Label htmlFor="f-ancien" className="font-normal flex items-center gap-2"><GraduationCap className="h-4 w-4"/>Ancien</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Checkbox id="f-assistant" checked={spiritualData.function === 'servant'} onCheckedChange={() => handleFunctionChange('servant')} />
                            <Label htmlFor="f-assistant" className="font-normal flex items-center gap-2"><Briefcase className="h-4 w-4"/>Assistant</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="f-proclamateur" checked={spiritualData.function === 'publisher'} onCheckedChange={() => handleFunctionChange('publisher')} />
                            <Label htmlFor="f-proclamateur" className="font-normal flex items-center gap-2"><Presentation className="h-4 w-4"/>Proclamateur</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="f-non-bap" checked={spiritualData.function === 'unbaptized'} onCheckedChange={() => handleFunctionChange('unbaptized')} />
                            <Label htmlFor="f-non-bap" className="font-normal flex items-center gap-2"><CircleUser className="h-4 w-4"/>Proclamateur non bap</Label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                        <Label>Date de baptême</Label>
                        <div className="flex items-center gap-1">
                            <DateInput date={spiritualData.baptismDate} setDate={(d) => handleChange('baptismDate', d)}/>
                            {spiritualData.baptismDate && isValid(spiritualData.baptismDate) && <span className="text-muted-foreground">({calculateYears(spiritualData.baptismDate)} Anné)</span>}
                        </div>
                    </div>
                     <div className="flex items-center justify-between gap-2">
                        <Label>Date de début de la prédication</Label>
                        <DateInput date={spiritualData.preachingStartDate} setDate={(d) => handleChange('preachingStartDate', d)}/>
                    </div>
                     <div className="flex items-center justify-between gap-2">
                        <Label>Dernière visite</Label>
                        <DateInput date={spiritualData.lastVisitDate} setDate={(d) => handleChange('lastVisitDate', d)}/>
                    </div>
                </div>
                
                 <div>
                    <Label>Pionnier</Label>
                     <div className="flex items-center justify-between my-1">
                        <DateInput date={spiritualData.pioneer.date} setDate={(d) => handlePioneerSubChange('date', d)}/>
                        <div className="flex items-center space-x-2">
                           <Checkbox id="sfl" checked={spiritualData.pioneer.sfl} onCheckedChange={(c) => handlePioneerSubChange('sfl', Boolean(c))} />
                           <Label htmlFor="sfl" className="font-normal text-xs">S.O. (sfl 9:18)</Label>
                        </div>
                      </div>
                    <div className="space-y-2 mt-2">
                         <div className="flex items-center space-x-2">
                            <Checkbox id="p-aux-perm" checked={spiritualData.pioneer.status === 'aux-permanent'} onCheckedChange={() => handlePioneerStatusChange('aux-permanent')} />
                            <Label htmlFor="p-aux-perm" className="font-normal text-xs">Pionnier aux. permanent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Checkbox id="p-perm" checked={spiritualData.pioneer.status === 'permanent'} onCheckedChange={() => handlePioneerStatusChange('permanent')} />
                            <Label htmlFor="p-perm" className="font-normal text-xs">Pionnier permanent</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Checkbox id="p-special" checked={spiritualData.pioneer.status === 'special'} onCheckedChange={() => handlePioneerStatusChange('special')} />
                            <Label htmlFor="p-special" className="font-normal text-xs">Pionnier spécial</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                             <Checkbox id="p-missionnaire" checked={spiritualData.pioneer.status === 'missionary'} onCheckedChange={() => handlePioneerStatusChange('missionary')} />
                            <Label htmlFor="p-missionnaire" className="font-normal text-xs">Missionnaire affecté dan...</Label>
                        </div>
                    </div>
                     <div className="flex items-center justify-between gap-2 mt-2">
                        <Label className="text-xs">École des pionniers</Label>
                        <DateInput date={spiritualData.pioneer.schoolDate} setDate={(d) => handlePioneerSubChange('schoolDate', d)}/>
                    </div>
                </div>
            </div>

            {/* Colonne 2 */}
            <div className="space-y-3 pt-5">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="actif" checked={spiritualData.active} onCheckedChange={(c) => handleChange('active', Boolean(c))}/>
                    <Label htmlFor="actif" className="font-normal flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground"/>Actif</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="regulier" checked={spiritualData.regular} onCheckedChange={(c) => handleChange('regular', Boolean(c))}/>
                    <Label htmlFor="regulier" className="font-normal flex items-center gap-2"><BarChart2 className="h-4 w-4 text-muted-foreground"/>Régulier</Label>
                </div>

                <div className="border-t my-3"></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="tg-papier" checked={spiritualData.tgPaper} onCheckedChange={(c) => handleChange('tgPaper', Boolean(c))} />
                        <Label htmlFor="tg-papier" className="font-normal flex items-center gap-2"><Book className="h-4 w-4 text-muted-foreground"/>TG version papier</Label>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Search className="h-4 w-4 text-muted-foreground"/></Button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="cvm-papier" checked={spiritualData.cvmPaper} onCheckedChange={(c) => handleChange('cvmPaper', Boolean(c))}/>
                        <Label htmlFor="cvm-papier" className="font-normal flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground"/>CVM version papier</Label>
                    </div>
                     <Button variant="ghost" size="icon" className="h-6 w-6"><Search className="h-4 w-4 text-muted-foreground"/></Button>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="oint" checked={spiritualData.anointed} onCheckedChange={(c) => handleChange('anointed', Boolean(c))}/>
                    <Label htmlFor="oint" className="font-normal flex items-center gap-2"><Wine className="h-4 w-4 text-muted-foreground"/>Oint</Label>
                </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="cle-salle" />
                        <Label htmlFor="cle-salle" className="font-normal flex items-center gap-2"><KeyRound className="h-4 w-4 text-muted-foreground"/>Clé de la Salle du Royaume</Label>
                    </div>
                    <Input className="w-24 bg-white h-7" value={spiritualData.kingdomHallKey || ''} onChange={(e) => handleChange('kingdomHallKey', e.target.value)} />
                </div>
            </div>

            {/* Colonne 3 */}
             <div className="space-y-2 pt-5">
                <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="televolontaire" />
                        <Input placeholder="Télévolontaire" className="bg-white h-7" />
                    </div>
                    <DateInput date={spiritualData.teleVolunteerDate} setDate={(d) => handleChange('teleVolunteerDate', d)} placeholder="//" />
                </div>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="volontaire-comple" />
                        <Input placeholder="Volontaire au comple" className="bg-white h-7" />
                    </div>
                    <DateInput date={spiritualData.complexVolunteerDate} setDate={(d) => handleChange('complexVolunteerDate', d)} placeholder="//" />
                </div>
                <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="volontaire-bethel" />
                        <Input placeholder="Volontaire au BÉTHEL" className="bg-white h-7" />
                    </div>
                    <DateInput date={spiritualData.bethelVolunteerDate} setDate={(d) => handleChange('bethelVolunteerDate', d)} placeholder="//" />
                </div>
                <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="custom-spiritual" />
                        <Input placeholder="Custom Spiritual 7" className="bg-white h-7" />
                    </div>
                    <DateInput date={spiritualData.customSpiritual7Date} setDate={(d) => handleChange('customSpiritual7Date', d)} placeholder="//" />
                </div>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="autre-info-1" />
                        <Input placeholder="Autres informations t" className="bg-white h-7" value={spiritualData.otherInfo1} onChange={(e) => handleChange('otherInfo1', e.target.value)} />
                    </div>
                     <Input className="w-28 bg-white h-7" />
                </div>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="autre-info-2" />
                        <Input placeholder="Autres informations t" className="bg-white h-7" value={spiritualData.otherInfo2} onChange={(e) => handleChange('otherInfo2', e.target.value)} />
                    </div>
                     <Input className="w-28 bg-white h-7" />
                </div>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="autre-info-3" />
                        <Input placeholder="Autres informations t" className="bg-white h-7" value={spiritualData.otherInfo3} onChange={(e) => handleChange('otherInfo3', e.target.value)} />
                    </div>
                     <Input className="w-28 bg-white h-7" />
                </div>

                <div className="border-t pt-3 mt-4 space-y-2 text-xs text-muted-foreground">
                     <div className="flex items-center space-x-2">
                        <Checkbox id="direct-reports" disabled checked={spiritualData.directReports} />
                        <Label htmlFor="direct-reports" className="font-normal text-muted-foreground">Rapports envoyés directement à la filiale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="no-local-report" disabled checked={spiritualData.noLocalReport}/>
                        <Label htmlFor="no-local-report" className="font-normal text-muted-foreground">Pas de rapport local</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="deleted" disabled checked={spiritualData.isDeleted}/>
                        <Label htmlFor="deleted" className="font-normal text-muted-foreground">Supprimé</Label>
                    </div>
                </div>

            </div>
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title, color = 'bg-blue-600', children }: { icon: React.ElementType, title: string, color?: string, children?: React.ReactNode }) => (
  <div className={cn("flex items-center p-1 rounded-t-md text-white text-sm font-bold", color)}>
    <Icon className="h-4 w-4 mx-2" />
    <h3 className="flex-grow">{title}</h3>
    {children}
  </div>
);

const CheckboxItem = ({ label, checked, onCheckedChange, id }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void; id: string }) => (
    <div className="flex items-center space-x-2">
        <Checkbox id={id} checked={checked} onCheckedChange={(checked) => onCheckedChange(Boolean(checked))} />
        <Label htmlFor={id} className="font-normal">{label}</Label>
    </div>
);

const AssignTab = ({ assignmentsData, setAssignmentsData }: { assignmentsData: Person['assignments'], setAssignmentsData: (data: Person['assignments']) => void }) => {
    
    const handleChange = (section: keyof Person['assignments'], field: string, value: any) => {
        setAssignmentsData({
            ...assignmentsData, 
            [section]: {
                ...(assignmentsData[section] as any),
                [field]: value
            } 
        });
    };

    const handleSelectAll = (sectionKey: keyof Person['assignments'], isChecked: boolean) => {
        const sectionState = { ...(assignmentsData[sectionKey] as any) };
        for (const key in sectionState) {
            if (typeof sectionState[key] === 'boolean') {
                sectionState[key] = isChecked;
            }
        }
        setAssignmentsData({ ...assignmentsData, [sectionKey]: sectionState });
    };

    const isAllSelected = (sectionKey: keyof Person['assignments']) => {
        const sectionState = assignmentsData[sectionKey];
        if (!sectionState) return false;
        return Object.keys(sectionState)
            .filter(key => typeof (sectionState as any)[key] === 'boolean')
            .every(key => (sectionState as any)[key]);
    };

    if (!assignmentsData) {
        return <div className="p-4 text-center text-muted-foreground">Les attributions ne sont pas disponibles.</div>;
    }

    return (
        <div className="p-1 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left Column */}
            <div className="space-y-3">
                {/* Joyaux */}
                <div className="bg-white border rounded-md">
                    <SectionHeader icon={Diamond} title="Joyaux de la Parole de Dieu" color="bg-cyan-600">
                        <div className="flex items-center text-white mr-2">
                             <Checkbox id="gems-all-checkbox" checked={isAllSelected('gems')} onCheckedChange={(c) => handleSelectAll('gems', Boolean(c))} className="border-white" />
                             <Label htmlFor="gems-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                    </SectionHeader>
                    <div className="p-3 grid grid-cols-2 gap-3 text-sm">
                        <CheckboxItem id="gems-president" label="Président" checked={assignmentsData.gems.president} onCheckedChange={(c) => handleChange('gems', 'president', c)} />
                        <CheckboxItem id="gems-secondaryRoomCounselor" label="Conseiller salle secondaire" checked={assignmentsData.gems.secondaryRoomCounselor} onCheckedChange={(c) => handleChange('gems', 'secondaryRoomCounselor', c)} />
                        <CheckboxItem id="gems-prayers" label="Prières" checked={assignmentsData.gems.prayers} onCheckedChange={(c) => handleChange('gems', 'prayers', c)} />
                        <CheckboxItem id="gems-talks" label="Discours" checked={assignmentsData.gems.talks} onCheckedChange={(c) => handleChange('gems', 'talks', c)} />
                        <CheckboxItem id="gems-spiritualGems" label="Perles spirituelles" checked={assignmentsData.gems.spiritualGems} onCheckedChange={(c) => handleChange('gems', 'spiritualGems', c)} />
                        <CheckboxItem id="gems-bibleReading" label="Lecture de la Bible" checked={assignmentsData.gems.bibleReading} onCheckedChange={(c) => handleChange('gems', 'bibleReading', c)} />
                    </div>
                </div>

                {/* Ministère */}
                <div className="bg-white border rounded-md">
                     <SectionHeader icon={LifeBuoy} title="Applique-toi au ministère" color="bg-orange-500">
                        <div className="flex items-center text-white mr-2">
                           <Checkbox id="ministry-all-checkbox" checked={isAllSelected('ministry')} onCheckedChange={(c) => handleSelectAll('ministry', Boolean(c))} className="border-white" />
                           <Label htmlFor="ministry-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                     </SectionHeader>
                    <div className="p-3 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <CheckboxItem id="ministry-student" label="Élève à la réunion Vie et ministère" checked={assignmentsData.ministry.student} onCheckedChange={(c) => handleChange('ministry', 'student', c)} />
                            <CheckboxItem id="ministry-firstContact" label="Premier contact" checked={assignmentsData.ministry.firstContact} onCheckedChange={(c) => handleChange('ministry', 'firstContact', c)} />
                            <CheckboxItem id="ministry-returnVisit" label="Nouvelle visite" checked={assignmentsData.ministry.returnVisit} onCheckedChange={(c) => handleChange('ministry', 'returnVisit', c)} />
                            <CheckboxItem id="ministry-bibleStudy" label="Cours biblique" checked={assignmentsData.ministry.bibleStudy} onCheckedChange={(c) => handleChange('ministry', 'bibleStudy', c)} />
                            <CheckboxItem id="ministry-explainBeliefs" label="Explique tes croyances" checked={assignmentsData.ministry.explainBeliefs} onCheckedChange={(c) => handleChange('ministry', 'explainBeliefs', c)} />
                        </div>
                        <div className="flex items-center gap-2">
                             <Select defaultValue="all">
                                <SelectTrigger className="w-[180px] bg-white h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les salles</SelectItem>
                                </SelectContent>
                            </Select>
                            <CheckboxItem id="ministry-interlocutor" label="Interlocuteur" checked={assignmentsData.ministry.interlocutor} onCheckedChange={(c) => handleChange('ministry', 'interlocutor', c)} />
                            <CheckboxItem id="ministry-discourse" label="Discours" checked={assignmentsData.ministry.discourse} onCheckedChange={(c) => handleChange('ministry', 'discourse', c)} />
                            <CheckboxItem id="ministry-languageGroupOnly" label="Groupe langue uniquement" checked={assignmentsData.ministry.languageGroupOnly} onCheckedChange={(c) => handleChange('ministry', 'languageGroupOnly', c)} />
                        </div>
                    </div>
                </div>

                {/* Vie chrétienne */}
                <div className="bg-white border rounded-md">
                     <SectionHeader icon={Heart} title="Vie chrétienne" color="bg-red-600">
                         <div className="flex items-center text-white mr-2">
                           <Checkbox id="christianLife-all-checkbox" checked={isAllSelected('christianLife')} onCheckedChange={(c) => handleSelectAll('christianLife', Boolean(c))} className="border-white" />
                           <Label htmlFor="christianLife-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                     </SectionHeader>
                    <div className="p-3 grid grid-cols-2 gap-3 text-sm">
                        <CheckboxItem id="christianLife-interventions" label="Interventions" checked={assignmentsData.christianLife.interventions} onCheckedChange={(c) => handleChange('christianLife', 'interventions', c)} />
                        <CheckboxItem id="christianLife-congregationBibleStudy" label="Étude biblique de l'assemblée" checked={assignmentsData.christianLife.congregationBibleStudy} onCheckedChange={(c) => handleChange('christianLife', 'congregationBibleStudy', c)} />
                        <CheckboxItem id="christianLife-reader" label="Lecteur" checked={assignmentsData.christianLife.reader} onCheckedChange={(c) => handleChange('christianLife', 'reader', c)} />
                    </div>
                </div>

                {/* Réunion de week-end */}
                <div className="bg-white border rounded-md">
                     <SectionHeader icon={Landmark} title="Réunion de week-end" color="bg-blue-800">
                        <div className="flex items-center text-white mr-2">
                           <Checkbox id="weekendMeeting-all-checkbox" checked={isAllSelected('weekendMeeting')} onCheckedChange={(c) => handleSelectAll('weekendMeeting', Boolean(c))} className="border-white" />
                           <Label htmlFor="weekendMeeting-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                     </SectionHeader>
                    <div className="p-3 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                             <CheckboxItem id="weekendMeeting-localSpeaker" label="Orateur local" checked={assignmentsData.weekendMeeting.localSpeaker} onCheckedChange={(c) => handleChange('weekendMeeting', 'localSpeaker', c)} />
                             <CheckboxItem id="weekendMeeting-externalSpeaker" label="Orateur extérieur" checked={assignmentsData.weekendMeeting.externalSpeaker} onCheckedChange={(c) => handleChange('weekendMeeting', 'externalSpeaker', c)} />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Entre les numéros de discours, séparés par une virgule</Label>
                            <Input className="bg-white h-8" value={assignmentsData.weekendMeeting.discourseNumbers} onChange={(e) => handleChange('weekendMeeting', 'discourseNumbers', e.target.value)} />
                        </div>
                         <div className="flex items-center gap-2">
                            <Label className="text-xs">Fréquence à l'extérieur</Label>
                             <Select defaultValue="4">
                                <SelectTrigger className="w-[80px] bg-white h-8"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="4">4</SelectItem></SelectContent>
                            </Select>
                            <Label className="text-xs">Semaines</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <CheckboxItem id="weekendMeeting-president" label="Président" checked={assignmentsData.weekendMeeting.president} onCheckedChange={(c) => handleChange('weekendMeeting', 'president', c)} />
                           <CheckboxItem id="weekendMeeting-wtReader" label="Lecteur Tour de Garde" checked={assignmentsData.weekendMeeting.wtReader} onCheckedChange={(c) => handleChange('weekendMeeting', 'wtReader', c)} />
                           <CheckboxItem id="weekendMeeting-finalPrayer" label="Prière de fin" checked={assignmentsData.weekendMeeting.finalPrayer} onCheckedChange={(c) => handleChange('weekendMeeting', 'finalPrayer', c)} />
                           <CheckboxItem id="weekendMeeting-orateur2" label="Orateur 2" checked={assignmentsData.weekendMeeting.orateur2} onCheckedChange={(c) => handleChange('weekendMeeting', 'orateur2', c)} />
                           <CheckboxItem id="weekendMeeting-hospitality" label="Hospitalité" checked={assignmentsData.weekendMeeting.hospitality} onCheckedChange={(c) => handleChange('weekendMeeting', 'hospitality', c)} />
                           <CheckboxItem id="weekendMeeting-groupLangueUniquement" label="Groupe langue uniquement" checked={assignmentsData.weekendMeeting.groupLangueUniquement} onCheckedChange={(c) => handleChange('weekendMeeting', 'groupLangueUniquement', c)} />
                        </div>
                    </div>
                </div>

                 {/* Prédication */}
                <div className="bg-white border rounded-md">
                     <SectionHeader icon={HandPlatter} title="Prédication" color="bg-purple-700">
                        <div className="flex items-center text-white mr-2">
                           <Checkbox id="preaching-all-checkbox" checked={isAllSelected('preaching')} onCheckedChange={(c) => handleSelectAll('preaching', Boolean(c))} className="border-white" />
                           <Label htmlFor="preaching-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                     </SectionHeader>
                    <div className="p-3 grid grid-cols-2 gap-3 text-sm">
                        <CheckboxItem id="preaching-publicWitnessing" label="Témoignage public" checked={assignmentsData.preaching.publicWitnessing} onCheckedChange={(c) => handleChange('preaching', 'publicWitnessing', c)} />
                        <CheckboxItem id="preaching-keyPerson" label="Personne-clé" checked={assignmentsData.preaching.keyPerson} onCheckedChange={(c) => handleChange('preaching', 'keyPerson', c)} />
                        <CheckboxItem id="preaching-leadMeetings" label="Diriger des réunions pour la prédication" checked={assignmentsData.preaching.leadMeetings} onCheckedChange={(c) => handleChange('preaching', 'leadMeetings', c)} />
                        <CheckboxItem id="preaching-meetingPrayers" label="Prières pour les réunions de prédication" checked={assignmentsData.preaching.meetingPrayers} onCheckedChange={(c) => handleChange('preaching', 'meetingPrayers', c)} />
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Conducteur remplaçant</Label>
                            <Input className="bg-white h-8" value={assignmentsData.preaching.substituteDriver} onChange={(e) => handleChange('preaching', 'substituteDriver', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
                {/* Services */}
                <div className="bg-white border rounded-md">
                    <SectionHeader icon={Wrench} title="Services" color="bg-green-700">
                        <div className="flex items-center text-white mr-2">
                           <Checkbox id="services-all-checkbox" checked={isAllSelected('services')} onCheckedChange={(c) => handleSelectAll('services', Boolean(c))} className="border-white" />
                           <Label htmlFor="services-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                    </SectionHeader>
                    <div className="p-3 space-y-2 text-sm">
                         <Select defaultValue="all">
                            <SelectTrigger className="w-full bg-white h-8"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">Toutes les réunions</SelectItem></SelectContent>
                        </Select>
                        <CheckboxItem id="services-attendanceCount" label="Comptage_Assistance" checked={assignmentsData.services.attendanceCount} onCheckedChange={(c) => handleChange('services', 'attendanceCount', c)} />
                        <CheckboxItem id="services-doorAttendant" label="Accueil à la porte" checked={assignmentsData.services.doorAttendant} onCheckedChange={(c) => handleChange('services', 'doorAttendant', c)} />
                        <CheckboxItem id="services-soundSystem" label="Sonorisation" checked={assignmentsData.services.soundSystem} onCheckedChange={(c) => handleChange('services', 'soundSystem', c)} />
                        <CheckboxItem id="services-rovingMic" label="Micros baladeur" checked={assignmentsData.services.rovingMic} onCheckedChange={(c) => handleChange('services', 'rovingMic', c)} />
                        <CheckboxItem id="services-stageMic" label="Micros Estrade" checked={assignmentsData.services.stageMic} onCheckedChange={(c) => handleChange('services', 'stageMic', c)} />
                        <CheckboxItem id="services-sanitary" label="Sanitaire" checked={assignmentsData.services.sanitary} onCheckedChange={(c) => handleChange('services', 'sanitary', c)} />
                        <CheckboxItem id="services-hallAttendant" label="Accueil dans la salle" checked={assignmentsData.services.hallAttendant} onCheckedChange={(c) => handleChange('services', 'hallAttendant', c)} />
                        <CheckboxItem id="services-mainDoorAttendant" label="Accueil à la grande porte" checked={assignmentsData.services.mainDoorAttendant} onCheckedChange={(c) => handleChange('services', 'mainDoorAttendant', c)} />
                        <div className="flex items-center space-x-2">
                            <Checkbox id="custom-service-1" checked={assignmentsData.services.customService1} onCheckedChange={(c) => handleChange('services', 'customService1', c)} />
                            <Input className="bg-white h-8" value={assignmentsData.services.customService1Label} onChange={(e) => handleChange('services', 'customService1Label', e.target.value)} />
                        </div>
                         <CheckboxItem id="services-maintenance" label="Maintenance" checked={assignmentsData.services.maintenance} onCheckedChange={(c) => handleChange('services', 'maintenance', c)} />
                    </div>
                </div>

                {/* Nettoyage */}
                <div className="bg-white border rounded-md">
                     <SectionHeader icon={Sparkles} title="Nettoyage et Entretien des espaces verts" color="bg-teal-600">
                         <div className="flex items-center text-white mr-2">
                           <Checkbox id="cleaning-all-checkbox" checked={isAllSelected('cleaning')} onCheckedChange={(c) => handleSelectAll('cleaning', Boolean(c))} className="border-white" />
                           <Label htmlFor="cleaning-all-checkbox" className="font-normal ml-2">Tous</Label>
                        </div>
                     </SectionHeader>
                    <div className="p-3 space-y-2 text-sm">
                        <CheckboxItem id="cleaning-hallCleaning" label="Nettoyage de la Salle" checked={assignmentsData.cleaning.hallCleaning} onCheckedChange={(c) => handleChange('cleaning', 'hallCleaning', c)} />
                        <CheckboxItem id="cleaning-hallCleaningAfterMeeting" label="Nettoyage de la Salle_Après la réunion" checked={assignmentsData.cleaning.hallCleaningAfterMeeting} onCheckedChange={(c) => handleChange('cleaning', 'hallCleaningAfterMeeting', c)} />
                        <div className="flex items-center space-x-2">
                            <Checkbox id="custom-cleaning-1" checked={assignmentsData.cleaning.customCleaning1} onCheckedChange={(c) => handleChange('cleaning', 'customCleaning1', c)} />
                            <Input className="bg-white h-8" value={assignmentsData.cleaning.customCleaning1Label} onChange={(e) => handleChange('cleaning', 'customCleaning1Label', e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="custom-cleaning-2" checked={assignmentsData.cleaning.customCleaning2} onCheckedChange={(c) => handleChange('cleaning', 'customCleaning2', c)} />
                            <Input className="bg-white h-8" value={assignmentsData.cleaning.customCleaning2Label} onChange={(e) => handleChange('cleaning', 'customCleaning2Label', e.target.value)} />
                        </div>
                        <CheckboxItem id="cleaning-greenSpaces" label="Entretien espaces verts" checked={assignmentsData.cleaning.greenSpaces} onCheckedChange={(c) => handleChange('cleaning', 'greenSpaces', c)} />
                        <CheckboxItem id="cleaning-lawn" label="Pelouse" checked={assignmentsData.cleaning.lawn} onCheckedChange={(c) => handleChange('cleaning', 'lawn', c)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityTab = ({ activityData, setActivityData }: { activityData: Person['activity'], setActivityData: (data: Person['activity']) => void }) => {
    
    const [startYear, setStartYear] = React.useState(2025);

    const months = React.useMemo(() => {
        const result = [];
        // Start date is July (month 6) of the selected year
        const startDate = new Date(startYear, 6, 1);
        for (let i = 0; i < 12; i++) {
            const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            result.push({
                key: format(date, 'yyyy-MM'),
                label: format(date, 'MMMM yyyy', { locale: fr }),
            });
        }
        return result;
    }, [startYear]);

    const handleDataChange = (monthKey: string, field: keyof Person['activity'][0], value: any) => {
        const existingRecordIndex = activityData.findIndex(record => record.month === monthKey);
        let newData = [...activityData];

        if (existingRecordIndex > -1) {
            (newData[existingRecordIndex] as any)[field] = value;
        } else {
            const newRecord = {
                month: monthKey,
                participated: false,
                bibleStudies: null,
                isAuxiliaryPioneer: false,
                hours: null,
                credit: null,
                isLate: false,
                remarks: '',
            };
            (newRecord as any)[field] = value;
            newData.push(newRecord);
        }
        setActivityData(newData);
    };
    
    const getMonthData = (monthKey: string) => {
        return activityData.find(record => record.month === monthKey) || {
            month: monthKey,
            participated: false,
            bibleStudies: null,
            isAuxiliaryPioneer: false,
            hours: null,
            credit: false,
            isLate: false,
            remarks: '',
        };
    };

    const totals = React.useMemo(() => {
        return activityData.reduce((acc, record) => {
            acc.bibleStudies += record.bibleStudies || 0;
            acc.hours += record.hours || 0;
            return acc;
        }, { bibleStudies: 0, hours: 0 });
    }, [activityData]);

    const average = {
        bibleStudies: activityData.length > 0 ? (totals.bibleStudies / activityData.filter(r => r.participated).length).toFixed(1) : '0.0',
        hours: activityData.length > 0 ? (totals.hours / activityData.filter(r => r.participated).length).toFixed(1) : '0.0',
    }

    const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);


    return (
        <div className="p-1">
             <div className="flex items-center gap-4 mb-4">
                <Label>Année</Label>
                <Select value={startYear.toString()} onValueChange={(v) => setStartYear(Number(v))}>
                    <SelectTrigger className="w-28 bg-white h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[40vh]">
                            {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </div>
             <div className="overflow-x-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-1/6"></TableHead>
                            <TableHead className="text-center w-1/12">A participé à la prédication</TableHead>
                            <TableHead className="text-center w-1/12">Cours bibliques</TableHead>
                            <TableHead className="text-center w-1/12">Pionnier auxiliaire</TableHead>
                            <TableHead className="text-center w-1/12">Heures</TableHead>
                            <TableHead className="text-center w-1/12">Crédit (minutes)</TableHead>
                            <TableHead className="text-center w-1/12">En retard</TableHead>
                            <TableHead className="w-1/4">Remarques</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {months.map(({ key, label }) => {
                            const data = getMonthData(key);
                            return (
                                <TableRow key={key}>
                                    <TableCell className="font-medium capitalize">{label}</TableCell>
                                    <TableCell className="text-center"><Checkbox checked={data.participated} onCheckedChange={(c) => handleDataChange(key, 'participated', c)} /></TableCell>
                                    <TableCell><Input type="number" className="h-8 bg-white text-center" value={data.bibleStudies ?? ''} onChange={(e) => handleDataChange(key, 'bibleStudies', e.target.value ? Number(e.target.value) : null)}/></TableCell>
                                    <TableCell className="text-center"><Checkbox checked={data.isAuxiliaryPioneer} onCheckedChange={(c) => handleDataChange(key, 'isAuxiliaryPioneer', c)} /></TableCell>
                                    <TableCell><Input type="number" className="h-8 bg-white text-center" value={data.hours ?? ''} onChange={(e) => handleDataChange(key, 'hours', e.target.value ? Number(e.target.value) : null)}/></TableCell>
                                    <TableCell><Input type="number" className="h-8 bg-white text-center" value={data.credit ?? ''} onChange={(e) => handleDataChange(key, 'credit', e.target.value ? Number(e.target.value) : null)}/></TableCell>
                                    <TableCell className="text-center"><Checkbox checked={data.isLate} onCheckedChange={(c) => handleDataChange(key, 'isLate', c)} /></TableCell>
                                    <TableCell><Input className="h-8 bg-white" value={data.remarks} onChange={(e) => handleDataChange(key, 'remarks', e.target.value)} /></TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="grid grid-cols-2 mt-4">
                <div>
                    <div className="flex items-center">
                        <span className="w-20 font-semibold">Total</span>
                        <div className="ml-[20%] text-center font-semibold w-20">{totals.bibleStudies}</div>
                        <div className="ml-[7%] text-center font-semibold w-20">{totals.hours}</div>
                    </div>
                     <div className="flex items-center mt-2">
                        <span className="w-20 font-semibold">Moyenne</span>
                        <div className="ml-[20%] text-center font-semibold w-20">{average.bibleStudies}</div>
                        <div className="ml-[7%] text-center font-semibold w-20">{average.hours}</div>
                    </div>
                </div>
                <div className="flex justify-end items-end gap-2">
                    <Button variant="outline" size="sm">Effacer le mois</Button>
                    <Button variant="outline" size="sm">Effacer les heures</Button>
                </div>
            </div>
        </div>
    );
};

const EmergencyTab = ({ emergencyData, setEmergencyData }: { emergencyData: Person['emergency'], setEmergencyData: (data: Person['emergency']) => void}) => {
    
    const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null);

    const handleNotesChange = (field: 'disasterAccommodations' | 'notes', value: any) => {
        setEmergencyData({ ...emergencyData, [field]: value });
    };

    const handleContactChange = (field: keyof Person['emergency']['contacts'][0], value: any) => {
        if (!selectedContactId) return;
        const updatedContacts = emergencyData.contacts.map(c => 
            c.id === selectedContactId ? { ...c, [field]: value } : c
        );
        setEmergencyData({ ...emergencyData, contacts: updatedContacts });
    };
    
    const handleAddNewContact = (isExternal: boolean) => {
        const newContact = {
            id: `contact-${Date.now()}`,
            name: 'Nouveau Contact',
            isCongregationMember: !isExternal,
            mobile: '',
            phone: '',
            email: '',
            relationship: '',
            notes: '',
        };
        const updatedContacts = [...emergencyData.contacts, newContact];
        setEmergencyData({ ...emergencyData, contacts: updatedContacts });
        setSelectedContactId(newContact.id);
    }
    
    const handleDeleteContact = () => {
        if (!selectedContactId) return;
        const updatedContacts = emergencyData.contacts.filter(c => c.id !== selectedContactId);
        setEmergencyData({ ...emergencyData, contacts: updatedContacts });
        setSelectedContactId(null);
    }

    const selectedContact = emergencyData.contacts.find(c => c.id === selectedContactId);

    return (
        <div className="p-1 space-y-4">
            <h3 className="font-bold text-lg">{emergencyData.personName}</h3>
            <div className="space-y-2">
                <Label>Notes d'urgence</Label>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="disasterAccommodations" checked={emergencyData.disasterAccommodations} onCheckedChange={(c) => handleNotesChange('disasterAccommodations', Boolean(c))} />
                    <Label htmlFor="disasterAccommodations" className="font-normal">Hébergements temporaires pour les victimes de catastrophes</Label>
                </div>
                <Textarea value={emergencyData.notes} onChange={e => handleNotesChange('notes', e.target.value)} />
            </div>

            <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Contacts d'urgence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <Button className="justify-start" onClick={() => handleAddNewContact(false)}><UserPlus className="mr-2"/>Nouveau de l'assemblée</Button>
                        <Button className="justify-start" onClick={() => handleAddNewContact(true)}><UserPlus className="mr-2"/>Nouveau de l'extérieur</Button>
                        <Button variant="outline" className="justify-start"><UsersIcon className="mr-2"/>Copie du chef de famille</Button>
                        <div className="flex gap-2">
                           <Button variant="outline" className="w-full justify-start"><Link className="mr-2"/>Lien</Button>
                           <Button variant="outline" className="w-full justify-start"><Unlink className="mr-2"/>Dissocier</Button>
                        </div>
                         <Button variant="destructive" className="justify-start" onClick={handleDeleteContact} disabled={!selectedContactId}><Trash2 className="mr-2"/>Supprimer</Button>
                         <div className="border rounded-md h-32 mt-2 relative">
                            <ScrollArea className="h-full">
                                {emergencyData.contacts.map(contact => (
                                    <div key={contact.id} 
                                         className={cn("p-2 cursor-pointer", selectedContactId === contact.id && "bg-accent")}
                                         onClick={() => setSelectedContactId(contact.id)}>
                                        {contact.name}
                                    </div>
                                ))}
                            </ScrollArea>
                            <div className="absolute right-1 bottom-1 flex flex-col gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronUp className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronDown className="h-4 w-4"/></Button>
                            </div>
                         </div>
                    </div>
                    {selectedContact && (
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <Input placeholder="Nom" value={selectedContact.name} onChange={e => handleContactChange('name', e.target.value)} />
                               <div className="flex items-center space-x-2 ml-2">
                                  <Checkbox id="is-member" checked={selectedContact.isCongregationMember} onCheckedChange={c => handleContactChange('isCongregationMember', Boolean(c))} />
                                  <Label htmlFor="is-member" className="font-normal whitespace-nowrap">Membre de l'assemblée</Label>
                               </div>
                            </div>
                            <Input placeholder="Mobile" value={selectedContact.mobile} onChange={e => handleContactChange('mobile', e.target.value)} />
                            <Input placeholder="Téléphone" value={selectedContact.phone} onChange={e => handleContactChange('phone', e.target.value)} />
                            <Input placeholder="E-mail" type="email" value={selectedContact.email} onChange={e => handleContactChange('email', e.target.value)} />
                            <Input placeholder="Relations" value={selectedContact.relationship} onChange={e => handleContactChange('relationship', e.target.value)} />
                            <Textarea placeholder="Notes" className="h-24" value={selectedContact.notes} onChange={e => handleContactChange('notes', e.target.value)}/>
                         </div>
                    )}
                </div>
            </div>
             <div className="text-xs text-muted-foreground pt-4 space-y-2">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="privacy-ack"/>
                    <Label htmlFor="privacy-ack" className="font-normal">Le proclamateur a informé son contact d'urgence que cette information sera partagée avec les anciens de l'assemblée, qui peuvent le contacter en cas d'urgence, et que toute information personnelle est traitée conformément à la politique de confidentialité.</Label>
                </div>
                <div className="flex justify-between">
                    <span>ID #{selectedContact?.id.split('-')[1]}</span>
                    <span>Dernière vérification ou mise à jour</span>
                </div>
             </div>
        </div>
    )
}

interface PeopleListProps {
  people: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
}

export const roles = {
  'all': "Tout",
  'gems.president': "Président",
  'gems.secondaryRoomCounselor': "Conseil. salle sec.",
  'gems.prayers': "Prière",
  'gems.talks': "Discours",
  'gems.spiritualGems': "Perles spirituelles",
  'gems.bibleReading': "Lecture de la Bible",
  'ministry.student': "Eleve VCM",
  'ministry.engage_conversation': "Engage la conversation",
  'ministry.maintain_interest': "Entretien l'interet",
  'ministry.make_disciples': "Fais des disciples",
  'ministry.firstContact': "Premier contact",
  'ministry.returnVisit': "Nouvelle visite",
  'ministry.bibleStudy': "Cours biblique",
  'ministry.explainBeliefs': "Explique tes croyances",
  'ministry.discourse': "Discours (répété)",
  'ministry.interlocutor': "Adjoint",
  'christianLife.interventions': "Intervention vie Chrétienne",
  'christianLife.congregationBibleStudy': "EBA",
  'christianLife.reader': "Lecteur",
  'weekendMeeting.localSpeaker': "Orateur local",
  'weekendMeeting.externalSpeaker': "Orateur extérieur",
  'weekendMeeting.president': "Weekend-end Président",
  'weekendMeeting.wtReader': "Lecteur Tour de Garde",
  'weekendMeeting.finalPrayer': "Prière de fin",
  'weekendMeeting.orateur2': "Orateur 2",
  'weekendMeeting.hospitality': "Hospitalité",
  'preaching.publicWitnessing': "Témoignage public",
  'preaching.leadMeetings': "Diriger des réunions pour la prédication",
  'preaching.substituteDriver': "Conducteur remplaçant",
  'preaching.meetingPrayers': "Prières pour les réunions de prédication",
  'services.attendanceCount': "Comptage Assistance",
  'services.doorAttendant': "Accueil à la porte",
  'services.door_attendant_alt': "Accuel à la porte",
  'services.soundSystem': "Sonorisation",
  'services.rovingMic': "Micros baladeur",
  'services.stageMic': "Micros Estrade",
  'services.stage_mic_alt': "Micro Estrade",
  'services.sanitary': "Sanitaire",
  'services.hallAttendant': "Accueil dans la salle",
  'services.hall_attendant_alt': "Accueil dans la salle",
  'services.mainDoorAttendant': "accueil à la grande porte",
  'services.main_door_attendant_alt': "accueil à la grande porte",
  'services.maintenance': "Maintenance",
  'cleaning.hallCleaningAfterMeeting': "Nettoyage de la salle après réunion",
  'cleaning.greenSpaces': "Entretien espaces verts"
};

export const mainFilters = {
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
    'incarcerated': 'Incarcéré',
    'other_personal_info': 'Autres informations personnelles',
    'anointed': 'Oint',
    'kh_key': 'Clé de la Salle du Royaume',
    'tele_volunteer': 'Télévolontaire',
    'complex_volunteer': 'Volontaire au complexe des écoles bibliques',
    'bethel_volunteer': 'Volontaire au BÉTHEL',
    'other_theocratic_info_4': 'Autres informations théocratiques 4',
    'other_theocratic_info_5': 'Autres informations théocratiques 5',
    'other_theocratic_info_6': 'Autres informations théocratiques 6',
    'custom_spiritual_7': 'Custom spiritual 7',
    'direct_reports': 'Rapports envoyés directement à la filiale',
    'sent_back': 'Renvoyé',
    'departed': 'Parti(e)',
};


const PeopleList = ({ people, selectedPerson, onSelectPerson }: PeopleListProps) => {
    const { preachingGroups } = usePeople();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedRole, setSelectedRole] = React.useState('all');
    const [selectedMainFilter, setSelectedMainFilter] = React.useState('all');
    const [selectedGroup, setSelectedGroup] = React.useState('all-groups');

    const filteredPeople = people.filter(p => {
        const nameMatch = p.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch) return false;

        const roleMatch = () => {
             if (selectedRole === 'all') return true;
             const [section, field] = selectedRole.split('.');
             return p.assignments && (p.assignments as any)[section] && (p.assignments as any)[section][field];
        };

        const mainFilterMatch = () => {
            const spiritual = p.spiritual;
            if (!spiritual) return false;

            switch(selectedMainFilter) {
                case 'all': return true;
                case 'families': return true; // This should be handled separately, maybe a different view.
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
                case 'other_theocratic_info_4': return !!spiritual.otherInfo1;
                case 'other_theocratic_info_5': return !!spiritual.otherInfo2;
                case 'other_theocratic_info_6': return !!spiritual.otherInfo3;
                case 'custom_spiritual_7': return !!spiritual.customSpiritual7Date;
                case 'direct_reports': return spiritual.directReports;
                case 'sent_back': return spiritual.isDeleted;
                case 'deleted': return spiritual.isDeleted;
                case 'departed': return p.departed;
                default: return true;
            }
        };
        
        const groupMatch = () => {
            if (selectedGroup === 'all-groups') return true;
            return p.spiritual.group === selectedGroup;
        };

        return roleMatch() && mainFilterMatch() && groupMatch();
    });

    return (
        <div className="bg-white rounded-lg border h-full flex flex-col">
            <div className="p-2 space-y-2 border-b">
                <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedMainFilter} onValueChange={setSelectedMainFilter}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                           <ScrollArea className="h-[40vh]">
                               {Object.entries(mainFilters).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                ))}
                           </ScrollArea>
                        </SelectContent>
                    </Select>
                     <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                             <ScrollArea className="h-[40vh]">
                                 {Object.entries(roles).map(([key, value]) => (
                                    <SelectItem key={key} value={key}>{value}</SelectItem>
                                 ))}
                             </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-[40vh]">
                                <SelectItem value="all-groups">Tous les groupes</SelectItem>
                                {preachingGroups
                                    .slice()
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                     <div className="flex items-center gap-2">
                        <Input placeholder="Rechercher" className="h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                        <span className="text-sm font-medium text-muted-foreground">{filteredPeople.length}</span>
                     </div>
                </div>
            </div>
            <ScrollArea className="flex-grow">
                <Table>
                    <TableHeader className="sticky top-0 bg-gray-50">
                        <TableRow>
                            <TableHead><Home className="h-4 w-4"/></TableHead>
                            <TableHead>Nom de famille</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPeople.map(person => (
                            <TableRow 
                                key={person.id} 
                                onClick={() => onSelectPerson(person)}
                                className={cn("cursor-pointer", selectedPerson?.id === person.id && "bg-accent hover:bg-accent")}
                            >
                                <TableCell className="p-1 text-center">{person.isHeadOfFamily && <Home className="h-4 w-4 inline-block text-gray-500" />}</TableCell>
                                <TableCell className="p-1 font-semibold">{person.lastName}</TableCell>
                                <TableCell className="p-1">{person.firstName}</TableCell>
                                <TableCell className="p-1 text-center">
                                    {person.gender === 'male' && <User className="h-4 w-4 text-blue-500 inline-block"/>}
                                    {person.gender === 'female' && <PersonStanding className="h-4 w-4 text-pink-500 inline-block"/>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    )
}

const getInitialPersonData = (): Omit<Person, 'id'> => ({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    displayName: '',
    homePhone: '',
    mobilePhone: '',
    workPhone: '',
    address: '',
    linkFamily: false,
    latitude: '',
    longitude: '',
    email1: '',
    email2: '',
    gender: null,
    birthDate: undefined,
    familyId: null,
    isHeadOfFamily: false,
    other: false,
    child: false,
    otherInfo: '',
    agedOrInfirm: false,
    deaf: false,
    blind: false,
    incarcerated: false,
    disableAppAccess: false,
    deletePersonalInfo: false,
    notes: '',
    absences: [],
    departed: false,
    activity: [],
    spiritual: {
      group: null,
      roleInGroup: 'member',
      functionDate: undefined,
      function: null,
      baptismDate: undefined,
      preachingStartDate: undefined,
      lastVisitDate: undefined,
      pioneer: {
        status: null,
        date: undefined,
        sfl: false,
        schoolDate: undefined,
      },
      active: false,
      regular: false,
      tgPaper: false,
      cvmPaper: false,
      anointed: false,
      kingdomHallKey: null,
      teleVolunteerDate: undefined,
      complexVolunteerDate: undefined,
      bethelVolunteerDate: undefined,
      customSpiritual7Date: undefined,
      otherInfo1: '',
      otherInfo2: '',
      otherInfo3: '',
      directReports: false,
      noLocalReport: false,
      isDeleted: false,
    },
    assignments: {
        gems: { president: false, prayers: false, spiritualGems: false, secondaryRoomCounselor: false, talks: false, bibleReading: false },
        ministry: { student: false, firstContact: false, returnVisit: false, bibleStudy: false, explainBeliefs: false, hall: 'all', interlocutor: false, discourse: false, languageGroupOnly: false, engageConversation: false, maintainInterest: false, makeDisciples: false },
        christianLife: { interventions: false, congregationBibleStudy: false, reader: false },
        weekendMeeting: { localSpeaker: false, externalSpeaker: false, discourseNumbers: '', frequency: '4', president: false, finalPrayer: false, hospitality: false, wtReader: false, orateur2: false, groupLangueUniquement: false },
        preaching: { publicWitnessing: false, leadMeetings: false, substituteDriver: '', keyPerson: false, meetingPrayers: false },
        services: { meeting: 'all', attendanceCount: false, doorAttendant: false, soundSystem: false, rovingMic: false, stageMic: false, sanitary: false, hallAttendant: false, mainDoorAttendant: false, customService1: false, customService1Label: '', maintenance: false, doorAttendantAlt: false, stageMicAlt: false, hallAttendantAlt: false, mainDoorAttendantAlt: false },
        cleaning: { hallCleaning: false, hallCleaningAfterMeeting: false, customCleaning1: false, customCleaning1Label: '', customCleaning2: false, customCleaning2Label: '', greenSpaces: false, lawn: false },
    },
    emergency: {
        personName: '',
        notes: '',
        disasterAccommodations: false,
        contacts: [],
    },
    sharingPermissions: {},
});


export function PeopleForm({ selectedPerson, onSave, onNew, onDelete, activeTab, onTabChange }: { 
    selectedPerson: Person | null, 
    onSave: (person: Omit<Person, 'id'> & { id?: string }) => void,
    onNew: () => void,
    onDelete: () => void,
    activeTab: string,
    onTabChange: (tab: string) => void
}) {
    const [personData, setPersonData] = React.useState<Omit<Person, 'id'> & {id?: string}>(getInitialPersonData());
    
    React.useEffect(() => {
        if(selectedPerson) {
            const personCopy = JSON.parse(JSON.stringify(selectedPerson));
            const initialData = getInitialPersonData();
            
            const dateFields = ['birthDate'];
            const spiritualDateFields = ['functionDate', 'baptismDate', 'preachingStartDate', 'lastVisitDate', 'teleVolunteerDate', 'complexVolunteerDate', 'bethelVolunteerDate', 'customSpiritual7Date'];
            const pioneerDateFields = ['date', 'schoolDate'];

            dateFields.forEach(field => {
                if(personCopy[field]) personCopy[field] = new Date(personCopy[field]);
            });
            
            if (personCopy.spiritual) {
                spiritualDateFields.forEach(field => {
                    if(personCopy.spiritual[field]) personCopy.spiritual[field] = new Date(personCopy.spiritual[field]);
                });
                if (personCopy.spiritual.pioneer) {
                    pioneerDateFields.forEach(field => {
                        if(personCopy.spiritual.pioneer[field]) personCopy.spiritual.pioneer[field] = new Date(personCopy.spiritual.pioneer[field]);
                    });
                }
            } else {
                personCopy.spiritual = initialData.spiritual;
            }
            
            const mergedAssignments = { ...initialData.assignments };
            if(personCopy.assignments){
                (Object.keys(initialData.assignments) as Array<keyof Person['assignments']>).forEach(sectionKey => {
                    mergedAssignments[sectionKey] = {
                        ...initialData.assignments[sectionKey],
                        ...(personCopy.assignments ? personCopy.assignments[sectionKey] : {}),
                    };
                });
            } else {
                 personCopy.assignments = initialData.assignments;
            }
            
            if (!personCopy.emergency) {
                personCopy.emergency = initialData.emergency;
            }
            personCopy.emergency.personName = personCopy.displayName;

            const mergedData = {
                ...initialData,
                ...personCopy,
                assignments: mergedAssignments,
            };

            setPersonData(mergedData);
        } else {
            const initialData = getInitialPersonData();
            setPersonData(initialData);
        }
    }, [selectedPerson]);

    React.useEffect(() => {
        if (personData.displayName !== personData.emergency?.personName) {
            setPersonData(prev => ({
                ...prev,
                emergency: {
                    ...prev.emergency,
                    personName: prev.displayName,
                }
            }));
        }
    }, [personData.displayName, personData.emergency?.personName]);

    const handleSave = () => {
        onSave(personData);
        // If we are saving a new person (no ID yet), reset the form state for the next entry.
        if (!personData.id) {
            setPersonData(getInitialPersonData());
        }
    };
    
    const setSpiritualData = (data: Person['spiritual']) => {
        setPersonData(prev => ({ ...prev, spiritual: data }));
    }

    const setAssignmentsData = (data: Person['assignments']) => {
        setPersonData(prev => ({ ...prev, assignments: data }));
    }

    const setActivityData = (data: Person['activity']) => {
        setPersonData(prev => ({ ...prev, activity: data }));
    }

    const setEmergencyData = (data: Person['emergency']) => {
        setPersonData(prev => ({ ...prev, emergency: data }));
    }

    return (
        <div className="bg-card p-4 rounded-lg border">
                <Tabs value={activeTab} onValueChange={onTabChange} defaultValue="informations">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            
                            <Button type="button" variant="ghost" size="icon" onClick={onDelete} disabled={!selectedPerson}><UserMinus /></Button>
                             <Button variant="outline" size="sm" type="button" onClick={handleSave}>Sauvegarder</Button>
                            <div className="border-l h-6 mx-2"></div>
                            <TabsList className="bg-transparent p-0 gap-1">
                                <TabsTrigger value="informations" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md p-2 gap-2 data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"><User className="h-4 w-4" />Informations</TabsTrigger>
                                <TabsTrigger value="spirituel" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md p-2 gap-2 data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"><BookOpen className="h-4 w-4" />Spirituel</TabsTrigger>
                                <TabsTrigger value="attribuer" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md p-2 gap-2 data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"><CheckSquare className="h-4 w-4" />Attribuer</TabsTrigger>
                                <TabsTrigger value="activite" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md p-2 gap-2 data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"><Activity className="h-4 w-4" />Activité du proclamateur</TabsTrigger>
                                <TabsTrigger value="urgence" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md p-2 gap-2 data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent"><Siren className="h-4 w-4" />Urgence</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" size="icon"><UsersIcon /></Button>
                            <Button type="button" variant="ghost" size="icon"><Printer /></Button>
                            <Button type="button" variant="ghost" size="icon"><HelpCircle /></Button>
                        </div>
                    </div>
                    <TabsContent value="informations" className="printable-area">
                        <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Fiche d'informations</h2>
                            <h3 className="text-lg text-center">{personData.displayName}</h3>
                        </div>
                        <InfoTab personData={personData} setPersonData={setPersonData} />
                    </TabsContent>
                    <TabsContent value="spirituel" className="printable-area">
                        <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Informations spirituelles</h2>
                            <h3 className="text-lg text-center">{personData.displayName}</h3>
                        </div>
                        <SpiritualTab spiritualData={personData.spiritual} setSpiritualData={setSpiritualData} />
                    </TabsContent>
                    <TabsContent value="attribuer" className="printable-area">
                        <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Attributions</h2>
                            <h3 className="text-lg text-center">{personData.displayName}</h3>
                        </div>
                        <AssignTab assignmentsData={personData.assignments} setAssignmentsData={setAssignmentsData} />
                    </TabsContent>
                    <TabsContent value="activite" className="printable-area">
                         <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Activité du proclamateur</h2>
                            <h3 className="text-lg text-center">{personData.displayName}</h3>
                        </div>
                         <ActivityTab activityData={personData.activity || []} setActivityData={setActivityData} />
                    </TabsContent>
                    <TabsContent value="urgence" className="printable-area">
                        <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Contacts d'urgence</h2>
                            <h3 className="text-lg text-center">{personData.displayName}</h3>
                        </div>
                         <EmergencyTab emergencyData={personData.emergency} setEmergencyData={setEmergencyData} />
                    </TabsContent>
                </Tabs>
            </div>
    );
}
