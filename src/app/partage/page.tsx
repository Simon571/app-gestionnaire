'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlusCircle, Trash2, Pencil, Eye, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePeople } from '@/context/people-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import du hook pour les toasts

type TaskPermission = 'authorized' | 'view-only' | 'not-authorized';

type User = {
    id: number;
    name: string;
    permission: 'admin';
    taskPermissions: { [taskName: string]: TaskPermission };
}

const continents = {
    africa: "Afrique",
    antarctica: "Antarctique",
    asia: "Asie",
    europe: "Europe",
    north_america: "Amérique du Nord",
    oceania: "Océanie",
    south_america: "Amérique du Sud"
};

const adminTasks = [
  "Administration de l’assemblée", "Tableau d’affichage", "Événements de l’assemblée",
  "Activité de prédication de l’assemblée (S-1)", "Autres groupes", "Assistance aux réunions",
  "Publications", "Informations sur la personne", "Personne Spirituel", "Personne Attribuer",
  "Réunion Vie et ministère", "Besoins de l’assemblée", "Discours publics",
  "Prédication et Témoignage public", "Services", "Maintenance",
  "Nettoyage et Entretien des espaces verts", "Tâches"
];

export default function SharingPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const { toast } = useToast(); // Initialisation du hook

  const { people } = usePeople();
  const admins = people.filter(p => p.spiritual.function === 'elder');

  React.useEffect(() => {
    const savedUsers = localStorage.getItem('sharing-users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('sharing-users', JSON.stringify(users));
  }, [users]);

  const handleSaveUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    
    if (users.some(u => u.name === name)) {
        toast({
            title: "Erreur",
            description: "Cet administrateur a déjà été ajouté.",
            variant: "destructive",
        });
        return;
    }

    if(name) {
        const newUser: User = {
            id: Date.now(),
            name,
            permission: 'admin',
            taskPermissions: adminTasks.reduce((acc, task) => ({ ...acc, [task]: 'not-authorized' }), {})
        };
        setUsers(prev => [...prev, newUser]);
        setIsFormOpen(false);
        toast({
            title: "Succès",
            description: `L'administrateur ${name} a été ajouté.`,
        });
    }
  };

  const handlePermissionChange = (userId: number, taskName: string, value: TaskPermission) => {
    setUsers(prev => prev.map(user => 
        user.id === userId 
        ? { ...user, taskPermissions: { ...user.taskPermissions, [taskName]: value } } 
        : user
    ));
    toast({
        description: `Permission pour "${taskName}" mise à jour.`,
    });
  };

  const handleDeleteUser = (userId: number) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedUserId === userId) setSelectedUserId(null);
    if (userToDelete) {
        toast({
            title: "Succès",
            description: `L'administrateur ${userToDelete.name} a été supprimé.`,
            variant: "destructive"
        });
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Colonne 1: Données de connexion */}
      <div className="lg:w-1/3 flex flex-col">
        <Card>
          <CardHeader>
            <CardTitle>Données de connexion</CardTitle>
            <CardDescription>Gérez les identifiants de connexion pour le partage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="assembly-id">ID de l’assemblée</Label>
              <Input id="assembly-id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connection-password">Mot de passe de connexion</Label>
              <Input id="connection-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sharing-region">Région de partage</Label>
              <Select>
                <SelectTrigger id="sharing-region">
                  <SelectValue placeholder="Sélectionner un continent" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(continents).map(([key, value]) => (
                     <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colonne 2: Utilisateurs de partage */}
      <div className="lg:w-1/3 flex flex-col">
        <Card className="flex-grow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Utilisateurs de partage</CardTitle>
                <CardDescription>Gérez les accès des administrateurs.</CardDescription>
              </div>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                      <Button size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Ajouter
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Ajouter un administrateur</DialogTitle>
                          <DialogDescription>Sélectionnez un ancien.</DialogDescription>
                      </DialogHeader>
                      <form id="user-form" onSubmit={handleSaveUser}>
                          <div className="grid gap-4 py-4">
                              <Label htmlFor="name">Nom de l'ancien</Label>
                              <Select name="name" required>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Sélectionner un nom" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {admins.map(admin => (
                                          <SelectItem key={admin.id} value={admin.displayName}>
                                              {admin.displayName}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <DialogFooter>
                              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Annuler</Button>
                              <Button type="submit">Sauvegarder</Button>
                          </DialogFooter>
                      </form>
                  </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Administrateurs ajoutés</Label>
                  {users.length > 0 ? (
                      <ul className="rounded-md border p-2 space-y-2">
                          {users.map(user => (
                              <li key={user.id} className="flex items-center justify-between">
                                  <span>{user.name}</span>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-muted-foreground">Aucun administrateur ajouté.</p>
                  )}
              </div>
              {users.length > 0 && (
                  <div className="space-y-2">
                      <Label htmlFor="permission-select">Gérer les permissions pour</Label>
                      <Select onValueChange={(value) => setSelectedUserId(Number(value))}>
                          <SelectTrigger id="permission-select">
                              <SelectValue placeholder="Sélectionner un administrateur..." />
                          </SelectTrigger>
                          <SelectContent>
                              {users.map(user => (
                                  <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              )}
              {selectedUser && (
                <div className="border-t pt-6 mt-4">
                    <h3 className="text-lg font-medium mb-4">Permissions pour {selectedUser.name}</h3>
                    <div className="space-y-4 h-96 overflow-y-auto pr-4">
                        {adminTasks.map((task, index) => (
                            <div key={`${selectedUser.id}-task-${index}`} className="flex items-center justify-between rounded-md border p-3">
                                <Label className="text-sm font-medium flex-1">{task}</Label>
                                <RadioGroup 
                                    value={selectedUser.taskPermissions?.[task] || 'not-authorized'}
                                    onValueChange={(value) => handlePermissionChange(selectedUser.id, task, value as TaskPermission)}
                                    className="flex items-center space-x-2"
                                >
                                    <div>
                                        <RadioGroupItem value="authorized" id={`auth-${selectedUser.id}-${index}`} className="sr-only" />
                                        <Label htmlFor={`auth-${selectedUser.id}-${index}`} title="Autoriser" className={cn("flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer transition-colors", selectedUser.taskPermissions?.[task] === 'authorized' ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                                            <Pencil className="h-4 w-4" />
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="view-only" id={`view-${selectedUser.id}-${index}`} className="sr-only" />
                                        <Label htmlFor={`view-${selectedUser.id}-${index}`} title="Voir" className={cn("flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer transition-colors", selectedUser.taskPermissions?.[task] === 'view-only' ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                                            <Eye className="h-4 w-4" />
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="not-authorized" id={`not-auth-${selectedUser.id}-${index}`} className="sr-only" />
                                        <Label htmlFor={`not-auth-${selectedUser.id}-${index}`} title="Non autorisé" className={cn("flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer transition-colors", selectedUser.taskPermissions?.[task] === 'not-authorized' ? "bg-destructive text-destructive-foreground" : "hover:bg-accent")}>
                                            <X className="h-4 w-4" />
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        ))}
                    </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Colonne 3: Journaux du partage */}
      <div className="lg:w-1/3 flex flex-col">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Journaux du partage</CardTitle>
            <CardDescription>Historique des activités de partage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center pt-10">
                <p>La fonctionnalité de journalisation sera bientôt disponible.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}