import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  Download, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VcmImportService, { VcmWeekData, VcmPart } from '@/lib/vcm-import-service';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  spiritual: {
    active: boolean;
    function?: "elder" | "servant" | "publisher" | "unbaptized" | null;
  };
}

interface VcmManagerProps {
  selectedWeek: Date | null;
  people: Person[];
  onDataLoaded: (vcmData: VcmWeekData) => void;
}

export function VcmManager({ selectedWeek, people, onDataLoaded }: VcmManagerProps) {
  const [isImporting, setIsImporting] = React.useState(false);
  const [vcmData, setVcmData] = React.useState<VcmWeekData | null>(null);
  const [assignments, setAssignments] = React.useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importService = VcmImportService.getInstance();

  // Charger les données VCM sauvegardées pour la semaine sélectionnée
  React.useEffect(() => {
    if (selectedWeek) {
      const saved = importService.loadVcmWeek(selectedWeek);
      if (saved) {
        setVcmData(saved);
        loadAssignments();
      } else {
        setVcmData(null);
        setAssignments({});
      }
    }
  }, [selectedWeek, importService]);

  // Charger les assignations sauvegardées
  const loadAssignments = () => {
    if (selectedWeek) {
      const key = `vcm-assignments-${selectedWeek.toISOString().split('T')[0]}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setAssignments(JSON.parse(saved));
      }
    }
  };

  // Sauvegarder les assignations
  const saveAssignments = (newAssignments: Record<string, string>) => {
    if (selectedWeek) {
      const key = `vcm-assignments-${selectedWeek.toISOString().split('T')[0]}`;
      localStorage.setItem(key, JSON.stringify(newAssignments));
      setAssignments(newAssignments);
    }
  };

  // Importer depuis un fichier
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedWeek) return;

    setIsImporting(true);
    try {
      const data = await importService.importFromFile(file);
      importService.saveVcmWeek(selectedWeek, data);
      setVcmData(data);
      onDataLoaded(data);
      
      toast({
        title: "Importation réussie",
        description: `Programme VCM importé pour la semaine du ${data.weekPeriod}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Impossible de lire le fichier VCM",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // Importer depuis jw.org (simulation)
  const handleJwOrgImport = async () => {
    if (!selectedWeek) return;

    setIsImporting(true);
    try {
      const year = selectedWeek.getFullYear();
      const month = selectedWeek.getMonth() + 1;
      
      const weekData = await importService.importFromJwOrg(year, month);
      
      if (weekData.length > 0) {
        const data = weekData[0]; // Prendre la première semaine
        importService.saveVcmWeek(selectedWeek, data);
        setVcmData(data);
        onDataLoaded(data);
        
        toast({
          title: "Importation automatique réussie",
          description: `Programme VCM mis à jour depuis jw.org`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'importation",
        description: "Impossible de récupérer les données depuis jw.org",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Assigner une personne à une partie
  const assignPerson = (partId: string, personId: string) => {
    const newAssignments = { ...assignments };
    if (personId === '' || personId === 'unassigned') {
      // Supprimer l'assignation
      delete newAssignments[partId];
    } else {
      // Assigner la personne
      newAssignments[partId] = personId;
    }
    saveAssignments(newAssignments);
  };

  // Obtenir le nom de la personne assignée
  const getAssignedPersonName = (partId: string): string => {
    const personId = assignments[partId];
    if (!personId) return 'Non assigné';
    const person = people.find(p => p.id === personId);
    return person ? `${person.firstName} ${person.lastName}` : 'Personne introuvable';
  };

  // Composant pour afficher une partie du programme
  const PartCard = ({ part, sectionTitle }: { part: VcmPart; sectionTitle: string }) => {
    const getPartTypeColor = (type: string) => {
      switch (type) {
        case 'discours_principal': return 'bg-blue-100 text-blue-800';
        case 'perles_spirituelles': return 'bg-green-100 text-green-800';
        case 'lecture_bible': return 'bg-purple-100 text-purple-800';
        case 'engage_conversation': return 'bg-orange-100 text-orange-800';
        case 'entretiens_interet': return 'bg-pink-100 text-pink-800';
        case 'besoins_assemblee': return 'bg-yellow-100 text-yellow-800';
        case 'etude_biblique': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {part.number}
                </Badge>
                <Badge className={`text-xs ${getPartTypeColor(part.type)}`}>
                  {part.duration} min
                </Badge>
                {part.reference && (
                  <Badge variant="secondary" className="text-xs">
                    {part.reference}
                  </Badge>
                )}
              </div>
              <h4 className="font-medium text-sm mb-1">{part.title}</h4>
              {part.category && (
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  {part.category}
                </p>
              )}
              {part.description && (
                <p className="text-xs text-muted-foreground">
                  {part.description}
                </p>
              )}
              {part.lesson && (
                <p className="text-xs text-blue-600 mt-1">
                  {part.lesson}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Select
              value={assignments[part.id] || 'unassigned'}
              onValueChange={(value) => assignPerson(part.id, value === 'unassigned' ? '' : value)}
            >
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Assigner une personne..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {people
                  .filter(p => p.spiritual.active)
                  .map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            {assignments[part.id] && (
              <Badge variant="default" className="text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                Assigné
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!selectedWeek) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez une semaine pour voir le programme VCM
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Programme Vie Chrétienne et Ministère
            </CardTitle>
            
            <div className="flex gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importer le programme VCM</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-import">Importer depuis un fichier texte</Label>
                      <Input
                        id="file-import"
                        type="file"
                        accept=".txt"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Fichier texte contenant le programme VCM de la semaine
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">ou</p>
                      <Button 
                        onClick={handleJwOrgImport}
                        disabled={isImporting}
                        className="w-full"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importation en cours...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Importer depuis jw.org
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Récupération automatique depuis le site officiel
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {vcmData && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleJwOrgImport()}
                  disabled={isImporting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {vcmData && (
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {vcmData.weekPeriod}
              </Badge>
              <Badge variant="outline">
                {vcmData.book}
              </Badge>
              <div className="text-muted-foreground">
                {Object.values(vcmData.sections).reduce((total, section) => total + section.parts.length, 0)} parties
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Affichage du programme */}
      {vcmData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section Joyaux */}
          <div>
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              {vcmData.sections.joyaux.title}
            </h3>
            {vcmData.sections.joyaux.parts.map(part => (
              <PartCard 
                key={part.id} 
                part={part} 
                sectionTitle={vcmData.sections.joyaux.title}
              />
            ))}
          </div>

          {/* Section Ministère */}
          <div>
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              {vcmData.sections.ministry.title}
            </h3>
            {vcmData.sections.ministry.parts.map(part => (
              <PartCard 
                key={part.id} 
                part={part} 
                sectionTitle={vcmData.sections.ministry.title}
              />
            ))}
          </div>

          {/* Section Vie Chrétienne */}
          <div>
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              {vcmData.sections.life.title}
            </h3>
            {vcmData.sections.life.parts.map(part => (
              <PartCard 
                key={part.id} 
                part={part} 
                sectionTitle={vcmData.sections.life.title}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucun programme importé</h3>
            <p className="text-muted-foreground mb-4">
              Importez le programme VCM pour cette semaine pour commencer les assignations.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importer le programme
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VcmManager;