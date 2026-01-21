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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Trouver la personne sélectionnée
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

      // Vérifier le PIN
      if (selectedPerson.pin === pin) {
        // Sauvegarder la session
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

        // Rediriger vers la page d'accueil
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Church className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Sélectionnez votre nom et entrez votre PIN pour accéder à l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="person">Nom</Label>
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
              <p className="text-xs text-muted-foreground text-center mt-2">
                Aucune personne trouvée. Veuillez d'abord ajouter des personnes dans l'application.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
