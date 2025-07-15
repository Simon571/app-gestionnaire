
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type User = {
    id: number;
    name: string;
    permission: 'admin' | 'editor' | 'viewer';
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

export default function SharingPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const getPermissionLabel = (permission: string) => {
    if (permission === 'admin') return "Admin";
    if (permission === 'editor') return "Éditeur";
    return "Lecteur";
  };
  
  const handleSaveUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const permission = formData.get('permission') as User['permission'];

    if(name && permission) {
        const newUser: User = {
            id: Date.now(),
            name,
            permission,
        };
        setUsers(prevUsers => [...prevUsers, newUser]);
        setIsFormOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Données de connexion</CardTitle>
          <CardDescription>Gérez les identifiants de connexion pour le partage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="assembly-id">ID de l’assemblée</Label>
              <Input id="assembly-id" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="connection-password">
                Mot de passe de connexion
              </Label>
              <Input
                id="connection-password"
                type="password"
              />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utilisateurs de partage</CardTitle>
              <CardDescription>Gérez qui est autorisé à accéder aux données partagées.</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un utilisateur
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
                        <DialogDescription>
                            Entrez le nom et la permission pour le nouvel utilisateur.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="user-form" onSubmit={handleSaveUser}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nom</Label>
                                <Input id="name" name="name" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="permission" className="text-right">Permission</Label>
                                <Select name="permission" defaultValue="viewer">
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Lecteur</SelectItem>
                                        <SelectItem value="editor">Éditeur</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Annuler</Button>
                        <Button type="submit" form="user-form">Sauvegarder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.permission === 'admin'
                          ? 'default'
                          : user.permission === 'editor'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {getPermissionLabel(user.permission)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link href="/partage/permissions">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setUsers(prev => prev.filter(u => u.id !== user.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
