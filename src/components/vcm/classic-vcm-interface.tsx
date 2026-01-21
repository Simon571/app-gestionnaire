import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  RefreshCw,
  User,
  Clock,
  BookOpen,
  Diamond,
  Heart,
  Users
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

interface ClassicVcmInterfaceProps {
  selectedWeek: Date | null;
  people: Person[];
  onDataLoaded?: (vcmData: VcmWeekData) => void;
}

export function ClassicVcmInterface({ selectedWeek, people, onDataLoaded }: ClassicVcmInterfaceProps) {
  const [vcmData, setVcmData] = React.useState<VcmWeekData | null>(null);
  const [assignments, setAssignments] = React.useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = React.useState(false);
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

  // Assigner une personne à une partie
  const assignPerson = (partId: string, personId: string) => {
    const newAssignments = { ...assignments };
    if (personId === '' || personId === 'unassigned') {
      delete newAssignments[partId];
    } else {
      newAssignments[partId] = personId;
    }
    saveAssignments(newAssignments);
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
      onDataLoaded?.(data);
      
      toast({
        title: "Programme importé",
        description: `Cahier VCM chargé pour la semaine du ${data.weekPeriod}`,
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

  if (!selectedWeek) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Sélectionnez une semaine
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Choisissez une semaine dans le calendrier pour voir le programme
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* En-tête avec informations de la semaine */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-blue-900">
                {vcmData ? `Semaine du ${vcmData.weekPeriod}` : 'Programme VCM'}
              </CardTitle>
              {vcmData && (
                <p className="text-blue-700 text-sm mt-1">{vcmData.book}</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="bg-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importation...' : 'Importer'}
              </Button>
              {vcmData && (
                <Button variant="outline" size="sm" className="bg-white">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {vcmData ? (
        <div className="space-y-1">
          {/* Section Joyaux de la Parole de Dieu */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader className="bg-blue-200 pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                <Diamond className="h-5 w-5" />
                💎 Joyaux de la Parole de Dieu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {vcmData.sections.joyaux.parts.map((part, index) => (
                <div key={part.id} className="flex items-center gap-2 py-2 border-b border-blue-200 last:border-b-0">
                  <span className="font-medium text-blue-900 min-w-[20px]">{part.number}.</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{part.title}</div>
                    {part.reference && (
                      <div className="text-xs text-blue-600">{part.reference}</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    {part.duration} min.
                  </Badge>
                  <div className="flex items-center gap-2">
                    {part.type !== 'lecture_bible' && (
                      <>
                        <span className="text-xs text-muted-foreground">Président</span>
                        <Input className="w-32 h-8 text-xs" placeholder="Nom" />
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {part.type === 'lecture_bible' ? 'Lecteur' : 'Prière'}
                    </span>
                    <Select
                      value={assignments[part.id] || 'unassigned'}
                      onValueChange={(value) => assignPerson(part.id, value === 'unassigned' ? '' : value)}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Non assigné</SelectItem>
                        {people
                          .filter(p => p.spiritual.active)
                          .filter(p => {
                            if (part.type === 'lecture_bible') {
                              return (p as any).gender === 'male' && Boolean((p as any)?.assignments?.gems?.bibleReading);
                            }
                            return true;
                          })
                          .map(person => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Applique-toi au ministère */}
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader className="bg-orange-200 pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-900 text-lg">
                <Users className="h-5 w-5" />
                🗣️ Applique-toi au ministère
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {vcmData.sections.ministry.parts.map((part, index) => (
                <div key={part.id} className="flex items-center gap-2 py-2 border-b border-orange-200 last:border-b-0">
                  <span className="font-medium text-orange-900 min-w-[20px]">{part.number}.</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{part.title}</div>
                    {part.category && (
                      <div className="text-xs text-orange-600 font-medium">{part.category}</div>
                    )}
                    {part.description && (
                      <div className="text-xs text-orange-700">{part.description}</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                    {part.duration} min.
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Interlocuteur</span>
                    <Select
                      value={assignments[`${part.id}_student`] || 'unassigned'}
                      onValueChange={(value) => assignPerson(`${part.id}_student`, value === 'unassigned' ? '' : value)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section Vie chrétienne */}
          <Card className="border-red-300 bg-red-50">
            <CardHeader className="bg-red-200 pb-3">
              <CardTitle className="flex items-center gap-2 text-red-900 text-lg">
                <Heart className="h-5 w-5" />
                ❤️ Vie chrétienne
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {vcmData.sections.life.parts.map((part, index) => (
                <div key={part.id} className="flex items-center gap-2 py-2 border-b border-red-200 last:border-b-0">
                  <span className="font-medium text-red-900 min-w-[20px]">{part.number}.</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{part.title}</div>
                    {part.description && (
                      <div className="text-xs text-red-700">{part.description}</div>
                    )}
                    {part.type === 'etude_biblique' && (
                      <div className="text-xs text-red-600">Étude biblique de l'assemblée</div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                    {part.duration} min.
                  </Badge>
                  <div className="flex items-center gap-1">
                    {part.type === 'etude_biblique' ? (
                      <>
                        <span className="text-xs text-muted-foreground">EBA Lecteur</span>
                        <Select
                          value={assignments[`${part.id}_reader`] || 'unassigned'}
                          onValueChange={(value) => assignPerson(`${part.id}_reader`, value === 'unassigned' ? '' : value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Non assigné</SelectItem>
                            {people
                              .filter(p => p.spiritual.active)
                              .filter(p => (p as any).gender === 'male' && Boolean((p as any)?.assignments?.christianLife?.reader))
                              .map(person => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.firstName} {person.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground ml-2">Prière finale</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Partie</span>
                    )}
                    <Select
                      value={assignments[part.id] || 'unassigned'}
                      onValueChange={(value) => assignPerson(part.id, value === 'unassigned' ? '' : value)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-gray-300">
          <CardContent className="p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Aucun programme importé</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Importez le programme VCM pour cette semaine pour commencer les assignations.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer le programme
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClassicVcmInterface;