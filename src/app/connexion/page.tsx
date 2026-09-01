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
import { getApiBase } from "@/lib/api-base"

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
  /**
   * L'application sert plusieurs assemblees : un proclamateur doit indiquer
   * laquelle, sinon le serveur ne sait pas dans quel jeu de donnees chercher son
   * compte. Prerempli depuis la derniere connexion sur cet appareil.
   */
  const [personAssemblyId, setPersonAssemblyId] = useState("");
  const [assemblyPin, setAssemblyPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'person' | 'assembly'>('person');

  useEffect(() => {
    // Identifiant d'assemblee memorise sur l'appareil : ce n'est pas un secret
    // (le PIN, lui, n'est jamais stocke), et le resaisir a chaque connexion
    // serait penible sur mobile.
    const remembered = localStorage.getItem('lastAssemblyId');
    if (remembered) {
      setPersonAssemblyId(remembered);
      setAssemblyId(remembered);
    }
  }, []);

  useEffect(() => {
    // Log au chargement pour vérifier que la page charge
    console.log('📄 Page Connexion chargée');
    console.log('✅ Mode de connexion:', loginMode);
  }, [loginMode]);

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

      // On tente d'abord la verification serveur, qui delivre un cookie de
      // session utilisable par l'API. Tant que les PIN ne sont pas synchronises
      // cote serveur, la route repond 409 et on retombe sur la verification
      // locale : la personne peut se connecter a l'interface, mais sans session
      // serveur.
      const response = await fetch(`${getApiBase()}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: 'person',
          personId: selectedPerson.id,
          pin,
          assemblyId: personAssemblyId,
        }),
      });

      const serverAuthenticated = response.ok;
      const pinRejected = response.status === 401;
      const result = serverAuthenticated ? await response.json().catch(() => ({})) : {};

      if (pinRejected || (!serverAuthenticated && selectedPerson.pin !== pin)) {
        toast({
          title: "Échec de connexion",
          description: "PIN incorrect.",
          variant: "destructive"
        });
        return;
      }

      if (!serverAuthenticated) {
        console.warn(
          'Connexion validee localement : aucun PIN enregistre cote serveur pour cette personne. ' +
            'Les appels API resteront non authentifies.'
        );
      } else {
        localStorage.setItem('lastAssemblyId', personAssemblyId);
      }

      localStorage.setItem('admin_session', JSON.stringify({
        personId: selectedPerson.id,
        displayName: selectedPerson.displayName,
        // Le role vient du serveur, qui l'a deduit de la fonction inscrite sur la
        // fiche. C'est lui qui decide des modules affiches ; la valeur locale
        // n'est qu'un affichage immediat, revalide au chargement suivant.
        role: result?.session?.role ?? undefined,
        function: selectedPerson.spiritual?.function || 'publisher',
        loggedInAt: new Date().toISOString(),
        expiresAt: result?.session?.expiresAt
          ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${selectedPerson.displayName}!`,
      });

      router.push('/');
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
      // Les identifiants sont verifies par le serveur (/api/auth/session), qui
      // pose un cookie de session HttpOnly. Ils ne sont plus presents dans le
      // bundle client.
      const response = await fetch(`${getApiBase()}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode: 'assembly', assemblyId, assemblyPin }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast({
          title: "Échec de connexion",
          description: result?.error ?? "ID ou PIN de l'assemblée incorrect.",
          variant: "destructive"
        });
        return;
      }

      const session = result.session ?? {};
      localStorage.setItem('lastAssemblyId', session.sub ?? assemblyId);

      // Le cookie porte l'authentification cote serveur. localStorage ne sert
      // plus qu'a l'affichage de l'interface (AppShell, nom affiche).
      localStorage.setItem('admin_session', JSON.stringify({
        assemblyId: session.sub ?? assemblyId,
        displayName: session.displayName ?? assemblyId,
        role: session.role ?? 'assembly-admin',
        loggedInAt: new Date().toISOString(),
        expiresAt: session.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, administrateur de ${session.displayName ?? assemblyId}!`,
      });

      router.push('/');
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
                  <Label htmlFor="person-assembly">Identifiant de l&apos;assemblée</Label>
                  <Input
                    id="person-assembly"
                    placeholder="Ex: ASSEMB-XXXX"
                    value={personAssemblyId}
                    onChange={(e) => setPersonAssemblyId(e.target.value.trim().toUpperCase())}
                    required
                    disabled={isLoading}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fourni par l&apos;ancien de votre assemblée. Il détermine les données
                    auxquelles votre compte accède.
                  </p>
                </div>
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
                <Button type="submit" className="w-full" disabled={isLoading || !selectedPersonId || pin.length !== 4 || !personAssemblyId}>
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
                    placeholder="ex: ASSEMB-XXXX"
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
                    placeholder="Code à 6 chiffres"
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
