'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Church, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Person {
  id: string;
  displayName: string;
  pin: string;
  spiritual?: {
    function?: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [pin, setPin] = useState("");
  const [assemblyId, setAssemblyId] = useState("");
  const [assemblyPin, setAssemblyPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'person' | 'assembly'>('person');

  useEffect(() => {
    // Charger les personnes depuis localStorage
    const storedPeople = localStorage.getItem('people');
    if (storedPeople) {
      try {
        const parsed = JSON.parse(storedPeople);
        if (Array.isArray(parsed)) {
          // Filtrer pour avoir les personnes avec un nom
          const validPeople = parsed.filter((p: Person) => p.displayName && p.displayName.trim() !== '');
          // Trier par nom
          validPeople.sort((a: Person, b: Person) => a.displayName.localeCompare(b.displayName));
          setPeople(validPeople);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des personnes:', e);
      }
    }
  }, []);

  const handlePersonLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const selectedPerson = people.find(p => p.id === selectedPersonId);
      
      if (!selectedPerson) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une personne.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (selectedPerson.pin === pin) {
        localStorage.setItem('admin_session', JSON.stringify({
          personId: selectedPerson.id,
          displayName: selectedPerson.displayName,
          function: selectedPerson.spiritual?.function || 'publisher',
          loggedInAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));

        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${selectedPerson.displayName}!`,
        });

        router.push('/');
      } else {
        toast({
          title: "Échec de connexion",
          description: "PIN incorrect.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la connexion.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssemblyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Identifiants valides pour l'administrateur (KIN YOLO EST)
      const VALID_ASSEMBLY_ID = 'KINYOL-WGHK';
      const VALID_ASSEMBLY_PIN = '136573';
      const VALID_ASSEMBLY_NAME = 'KIN YOLO EST Français';

      // Vérifier les identifiants
      if (assemblyId === VALID_ASSEMBLY_ID && assemblyPin === VALID_ASSEMBLY_PIN) {
        localStorage.setItem('admin_session', JSON.stringify({
          assemblyId: VALID_ASSEMBLY_ID,
          displayName: VALID_ASSEMBLY_NAME,
          role: 'assembly-admin',
          loggedInAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }));

        // Aussi initialiser appSettings pour future référence
        localStorage.setItem('appSettings', JSON.stringify({
          assemblyId: VALID_ASSEMBLY_ID,
          assemblyPin: VALID_ASSEMBLY_PIN,
          assemblyName: VALID_ASSEMBLY_NAME
        }));

        toast({
          title: "Connexion réussie",
          description: `Bienvenue, administrateur de ${VALID_ASSEMBLY_NAME}!`,
        });

        router.push('/');
      } else {
        toast({
          title: "Échec de connexion",
          description: "ID ou PIN de l'assemblée incorrect.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la connexion.",
        variant: "destructive"
      });
      console.error('Assembly login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <Church className="mx-auto mb-4 h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Sélectionnez votre mode de connexion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginMode} onValueChange={(v) => setLoginMode(v as 'person' | 'assembly')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="person">Individu</TabsTrigger>
              <TabsTrigger value="assembly">Administrateur</TabsTrigger>
            </TabsList>

            {/* Mode Individu */}
            <TabsContent value="person">
              <form onSubmit={handlePersonLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="person">Sélectionner une personne</Label>
                  <Select
                    value={selectedPersonId}
                    onValueChange={setSelectedPersonId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="person">
                      <SelectValue placeholder="Sélectionnez votre nom..." />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pin">Code PIN (4 chiffres)</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    placeholder="****"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !selectedPersonId || pin.length !== 4}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Connexion"
                  )}
                </Button>
                {people.length === 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Aucune personne trouvée.
                  </p>
                )}
              </form>
            </TabsContent>

            {/* Mode Administrateur */}
            <TabsContent value="assembly">
              <form onSubmit={handleAssemblyLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assembly-id">ID de l'assemblée</Label>
                  <Input
                    id="assembly-id"
                    type="text"
                    placeholder="ex: KINYOL-WGHK"
                    value={assemblyId}
                    onChange={(e) => setAssemblyId(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assembly-pin">PIN de l'assemblée</Label>
                  <Input
                    id="assembly-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    placeholder="ex: 136573"
                    value={assemblyPin}
                    onChange={(e) => setAssemblyPin(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={isLoading}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !assemblyId || !assemblyPin}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Connexion"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
