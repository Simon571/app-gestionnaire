

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Cloud, Users, User, Lock, HelpCircle, Zap, Trash2, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeople } from '@/context/people-context';
import LinkToPublisher from '@/components/publisher/link-to-publisher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MaintenanceWeek {
  id: string;
  dateRange: string;
  maintenance: string;
  lawn: string;
  isCurrentWeek?: boolean;
}

const generateWeeks = (): MaintenanceWeek[] => {
  const weeks: MaintenanceWeek[] = [];
  const today = new Date(2025, 10, 5); // November 5, 2025
  
  // Generate weeks for the current and future months
  const startDate = new Date(2025, 9, 27); // October 27
  
  for (let i = 0; i < 24; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const monthStart = weekStart.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    const monthEnd = weekEnd.toLocaleString('fr-FR', { month: 'long' });
    
    const label = monthStart === monthEnd 
      ? `${monthStart} ${String(weekStart.getDate()).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`
      : `${monthStart.split(' ')[0]} ${String(weekStart.getDate()).padStart(2, '0')}-${monthEnd} ${String(weekEnd.getDate()).padStart(2, '0')}`;
    
    const isCurrentWeek = weekStart.toDateString() === startDate.toDateString();
    
    weeks.push({
      id: `week-${i}`,
      dateRange: label,
      maintenance: '',
      lawn: '',
      isCurrentWeek,
    });
  }
  
  return weeks;
};

export default function EntretienEspacesVertsPage() {
  const { isLoaded, people } = usePeople();
  const router = useRouter();
  const [weeks, setWeeks] = useState<MaintenanceWeek[]>(generateWeeks());
  const [selectedWeek, setSelectedWeek] = useState<MaintenanceWeek | null>(weeks[2]); // Select "novembre 10-16"
  const [sortBy, setSortBy] = useState('weekly');
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('personne');
  const [openAutoDialog, setOpenAutoDialog] = useState(false);
  const [autoFormData, setAutoFormData] = useState({
    maintenanceChecks: [false, false],
    lawnChecks: [false, false],
    weeks: 4,
  });
  const [selectedPersons, setSelectedPersons] = useState<{[key: string]: string}>({
    field2: '',
    field3: '',
    field5: '',
    field6: '',
  });

  // Filter people based on their assignments
  const getFilteredPeople = () => {
    if (filterType === 'personne') {
      // Show people who have cleaning assignments (greenSpaces or lawn)
      return people.filter(person => 
        person.assignments?.cleaning?.greenSpaces || 
        person.assignments?.cleaning?.lawn
      );
    }
    // For other filter types, show all people for now
    return people;
  };

  const handleWeekClick = (week: MaintenanceWeek) => {
    setSelectedWeek(week);
  };

  const currentWeekLabel = selectedWeek?.dateRange || '';

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Attribuer par semaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Attribuer par semaine</SelectItem>
                <SelectItem value="monthly">Attribuer par mois</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={() => setOpenAutoDialog(true)}>
                  <Zap className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Saisie automatique</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Effacer</TooltipContent>
            </Tooltip>
          </div>
          
          <h1 className="text-2xl font-bold text-red-600">{currentWeekLabel}</h1>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" onClick={() => router.push('/groupes-familles?tab=groupes')}>
                  <Users className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Groupes</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <User className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Utilisateur</TooltipContent>
            </Tooltip>
            <LinkToPublisher
              type={'services'}
              label="Enregistrer & Envoyer"
              getPayload={() => {
                const generatedAt = new Date().toISOString();
                // Normalize to a list of items so Flutter can detect upcoming services
                const persons = Object.values(selectedPersons).filter(Boolean);
                const items = persons.length
                  ? persons.map((name) => ({ date: generatedAt, service: 'entretien_espaces_verts', users: [name] }))
                  : [];
                return { generatedAt, weeks, selectedWeek, selectedPersons, items };
              }}
              save={() => localStorage.setItem('programme-entretien-espaces-verts', JSON.stringify({ weeks, selectedWeek, selectedPersons, savedAt: new Date().toISOString() }))}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <Lock className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Verrouiller</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aide</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Input fields row */}
        <div className="grid grid-cols-6 gap-3">
          <div className="space-y-1">
            <Input placeholder="Entretien espaces verts" className="bg-yellow-100" />
          </div>
          <div className="space-y-1">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 h-10 justify-start text-left"
              onClick={() => setOpenDialog('field2')}
            >
              {selectedPersons.field2 || 'Sélectionner'}
            </Button>
          </div>
          <div className="space-y-1">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 h-10 justify-start text-left"
              onClick={() => setOpenDialog('field3')}
            >
              {selectedPersons.field3 || 'Sélectionner'}
            </Button>
          </div>
          <div className="space-y-1">
            <Input placeholder="Pelouse" className="bg-yellow-100" />
          </div>
          <div className="space-y-1">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 h-10 justify-start text-left"
              onClick={() => setOpenDialog('field5')}
            >
              {selectedPersons.field5 || 'Sélectionner'}
            </Button>
          </div>
          <div className="space-y-1">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 h-10 justify-start text-left"
              onClick={() => setOpenDialog('field6')}
            >
              {selectedPersons.field6 || 'Sélectionner'}
            </Button>
          </div>
        </div>

        {/* Person Selection Dialog */}
        <Dialog open={openDialog !== null} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent className="max-w-2xl max-h-96">
            <DialogHeader className="bg-blue-500 text-white -mx-6 -mt-6 px-6 py-3 flex flex-row items-center justify-between">
              <DialogTitle className="text-white">Entretien espaces verts</DialogTitle>
              <button onClick={() => setOpenDialog(null)} className="text-white">
                <X className="w-4 h-4" />
              </button>
            </DialogHeader>
            
            <div className="space-y-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Personne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personne">Personne</SelectItem>
                  <SelectItem value="groupe-predication">Groupe de prédication</SelectItem>
                  <SelectItem value="autre-groupe">Autre groupe</SelectItem>
                  <SelectItem value="assemblee-voisine">Assemblée voisine</SelectItem>
                  <SelectItem value="mon-assemblee">Mon assemblée</SelectItem>
                </SelectContent>
              </Select>

              <div className="border rounded overflow-y-auto max-h-64">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="text-left p-2 border-b font-semibold">Nom</th>
                      <th className="text-left p-2 border-b font-semibold">Récent(e)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPeople().map((person) => (
                      <tr key={person.id} className="hover:bg-blue-50 cursor-pointer border-b">
                        <td 
                          className="p-2"
                          onClick={() => {
                            const name = `${person.lastName}, ${person.firstName}`;
                            setSelectedPersons(prev => ({
                              ...prev,
                              [openDialog || '']: name
                            }));
                            setOpenDialog(null);
                          }}
                        >
                          {person.lastName}, {person.firstName}
                        </td>
                        <td className="p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setOpenDialog(null)}
              >
                ✓ OK
              </Button>
              <Button 
                variant="outline"
                onClick={() => setOpenDialog(null)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                ✗ Annuler
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  if (openDialog) {
                    setSelectedPersons(prev => ({
                      ...prev,
                      [openDialog]: ''
                    }));
                    setOpenDialog(null);
                  }
                }}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                🗑️ Effacer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Right content - Weeks table */}
          <div className="w-full">
            <Card>
              <CardContent className="pt-6">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-cyan-100">
                      <TableRow className="border-b-2 border-cyan-500">
                        <TableHead className="border-r-2 border-cyan-500 font-bold text-gray-800">Date</TableHead>
                        <TableHead className="border-r-2 border-cyan-500 font-bold text-gray-800">Entretien espaces verts</TableHead>
                        <TableHead className="font-bold text-gray-800">Pelouse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeks.map((week, index) => (
                        <TableRow 
                          key={week.id}
                          onClick={() => handleWeekClick(week)}
                          className={`cursor-pointer transition-colors border-b border-cyan-200 ${
                            selectedWeek?.id === week.id
                              ? 'bg-yellow-300 font-semibold'
                              : index % 2 === 0 ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-blue-50'
                          }`}
                        >
                          <TableCell className="border-r-2 border-cyan-500 font-medium">
                            {week.dateRange}
                          </TableCell>
                          <TableCell className="border-r-2 border-cyan-500">
                            {week.maintenance}
                          </TableCell>
                          <TableCell>
                            {week.lawn}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Auto-filling Dialog */}
        <Dialog open={openAutoDialog} onOpenChange={setOpenAutoDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader className="bg-cyan-500 text-white -mx-6 -mt-6 px-6 py-3 flex flex-row items-center justify-between">
              <DialogTitle className="text-white text-base">Saisie automatique</DialogTitle>
              <button onClick={() => setOpenAutoDialog(false)} className="text-white">
                <X className="w-4 h-4" />
              </button>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="person-filter" className="text-sm">Personne</Label>
                <Select>
                  <SelectTrigger id="person-filter">
                    <SelectValue placeholder="Personne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personne">Personne</SelectItem>
                    <SelectItem value="groupe-predication">Groupe de prédication</SelectItem>
                    <SelectItem value="autre-groupe">Autre groupe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="font-semibold mb-2 block">Entretien espaces verts</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="maint1"
                        checked={autoFormData.maintenanceChecks[0]}
                        onCheckedChange={(checked) => 
                          setAutoFormData({
                            ...autoFormData,
                            maintenanceChecks: [checked as boolean, autoFormData.maintenanceChecks[1]]
                          })
                        }
                      />
                      <Label htmlFor="maint1" className="font-normal cursor-pointer">1</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="maint2"
                        checked={autoFormData.maintenanceChecks[1]}
                        onCheckedChange={(checked) => 
                          setAutoFormData({
                            ...autoFormData,
                            maintenanceChecks: [autoFormData.maintenanceChecks[0], checked as boolean]
                          })
                        }
                      />
                      <Label htmlFor="maint2" className="font-normal cursor-pointer">2</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Pelouse</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="lawn1"
                        checked={autoFormData.lawnChecks[0]}
                        onCheckedChange={(checked) => 
                          setAutoFormData({
                            ...autoFormData,
                            lawnChecks: [checked as boolean, autoFormData.lawnChecks[1]]
                          })
                        }
                      />
                      <Label htmlFor="lawn1" className="font-normal cursor-pointer">1</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="lawn2"
                        checked={autoFormData.lawnChecks[1]}
                        onCheckedChange={(checked) => 
                          setAutoFormData({
                            ...autoFormData,
                            lawnChecks: [autoFormData.lawnChecks[0], checked as boolean]
                          })
                        }
                      />
                      <Label htmlFor="lawn2" className="font-normal cursor-pointer">2</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeks" className="text-sm">Semaines</Label>
                <Input 
                  id="weeks"
                  type="number" 
                  value={autoFormData.weeks}
                  onChange={(e) => setAutoFormData({...autoFormData, weeks: parseInt(e.target.value) || 4})}
                  min="1"
                />
              </div>

              <p className="text-sm text-red-600 font-semibold">
                Cette action va écrasér tous les futurs services
              </p>
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setOpenAutoDialog(false)}
              >
                ⭐ Saisie automatique
              </Button>
              <Button 
                variant="outline"
                onClick={() => setOpenAutoDialog(false)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                ✗ Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

