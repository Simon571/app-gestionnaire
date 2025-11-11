'use client';

import * as React from 'react';
import { Check, Eye, X, Home, Calendar, Users, Map, User, Save, RefreshCw } from 'lucide-react';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';

type Permission = 'edit' | 'view' | 'none';

type PermissionCategory = {
  id: 'assembly' | 'schedule' | 'people' | 'territory' | 'me';
  label: string;
  icon: React.ElementType;
  permissions: {
    id: string;
    label: string;
  }[];
};

const permissionCategories: PermissionCategory[] = [
  {
    id: 'assembly',
    label: 'Assemblée',
    icon: Home,
    permissions: [
      { id: 'assembly_admin', label: "Administration de l'assemblée" },
      { id: 'bulletin_board', label: "Tableau d'affichage" },
      { id: 'events', label: "Évènements de l'assemblée" },
      { id: 'preaching_activity', label: "Activité de prédication" },
      { id: 'other_groups', label: "Autres groupes" },
      { id: 'meeting_attendance', label: "Assistance aux réunions" },
      { id: 'publications', label: "Publications" },
    ],
  },
  {
    id: 'schedule',
    label: 'Programme',
    icon: Calendar,
    permissions: [
      { id: 'life_and_ministry_meeting', label: "Réunion Vie et ministère" },
      { id: 'congregation_needs', label: "Besoins de l'assemblée" },
      { id: 'public_talks', label: "Discours publics" },
      { id: 'preaching_and_witnessing', label: "Prédication et Témoignage" },
      { id: 'services', label: "Services" },
      { id: 'maintenance', label: "Maintenance" },
      { id: 'cleaning', label: "Nettoyage et Entretien" },
    ],
  },
  {
    id: 'people',
    label: 'Personnes',
    icon: Users,
    permissions: [
      { id: 'personal_info', label: "Informations sur la personne" },
      { id: 'spiritual_person', label: "Personne Spirituel" },
      { id: 'assign_person', label: "Personne Attribuer" },
      { id: 'publisher_reports', label: "Rapports du proclamateur" },
    ],
  },
  {
    id: 'territory',
    label: 'Territoire',
    icon: Map,
    permissions: [{ id: 'territories', label: 'Territoires' }],
  },
  {
    id: 'me',
    label: 'Moi',
    icon: User,
    permissions: [{ id: 'tasks', label: 'Tâches' }],
  },
];

const PermissionRow = ({ label, value, onChange }: { label: string, value: Permission, onChange: (value: Permission) => void }) => {
  const uniqueId = React.useId();
  return (
    <div className="flex items-center justify-between border-b py-3">
      <span className="text-sm">{label}</span>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex items-center gap-4"
      >
        <RadioGroupItem value="edit" id={`${uniqueId}-edit`} className="h-6 w-6 border-green-600 text-green-600 focus:ring-green-600" />
        <RadioGroupItem value="view" id={`${uniqueId}-view`} className="h-6 w-6 border-orange-500 text-orange-500 focus:ring-orange-500" />
        <RadioGroupItem value="none" id={`${uniqueId}-none`} className="h-6 w-6 border-red-600 text-red-600 focus:ring-red-600" />
      </RadioGroup>
    </div>
  );
};

type PermissionsState = {
  [key: string]: Permission;
};

const getDefaultPermissions = (): PermissionsState => {
    return permissionCategories.flatMap(category => category.permissions).reduce((acc, perm) => {
        if (perm.id === 'publisher_reports' || perm.id === 'territories') {
            acc[perm.id] = 'view';
        } else {
            acc[perm.id] = 'none';
        }
        return acc;
    }, {} as PermissionsState);
};

const UserList = ({ users, selectedUser, onSelectUser }: { users: Person[], selectedUser: Person | null, onSelectUser: (user: Person) => void }) => {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Utilisateurs de partage</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <Table>
                        <TableBody>
                            {users.map(user => (
                                <TableRow 
                                    key={user.id} 
                                    onClick={() => onSelectUser(user)}
                                    className={cn("cursor-pointer", selectedUser?.id === user.id && "bg-accent")}
                                >
                                    <TableCell>{user.displayName}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default function PermissionsPage() {
  const { people, updatePerson } = usePeople();
  const [selectedUser, setSelectedUser] = React.useState<Person | null>(null);
  const [permissions, setPermissions] = React.useState<PermissionsState>(getDefaultPermissions());

  React.useEffect(() => {
    if (selectedUser) {
      // @ts-ignore - sharingPermissions will be added to the Person type
      setPermissions(selectedUser.sharingPermissions || getDefaultPermissions());
    } else {
      setPermissions(getDefaultPermissions());
    }
  }, [selectedUser]);

  const handlePermissionChange = (permId: string, value: Permission) => {
    setPermissions(prev => ({ ...prev, [permId]: value }));
  };

  const handleReset = () => {
     const resetPermissions = Object.keys(permissions).reduce((acc, key) => {
        acc[key] = 'none';
        return acc;
    }, {} as PermissionsState);
    setPermissions(resetPermissions);
  }

  const handleSave = () => {
    if (selectedUser) {
        const updatedUser = {
            ...selectedUser,
            // @ts-ignore
            sharingPermissions: permissions,
        };
        updatePerson(updatedUser);
        alert('Permissions sauvegardées !');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <UserList users={people} selectedUser={selectedUser} onSelectUser={setSelectedUser} />
        <Card>
        <CardHeader>
            <CardTitle>
                Permissions pour {selectedUser ? selectedUser.displayName : 'aucun utilisateur sélectionné'}
            </CardTitle>
            <CardDescription>Gérer les autorisations d'accès pour l'utilisateur sélectionné.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
            {permissionCategories.map((category) => (
            <div key={category.id}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-lg font-semibold">
                        <category.icon className="mr-3 h-5 w-5 text-primary" />
                        {category.label}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Modifier</span>
                        <span>Voir</span>
                        <span>Aucun</span>
                    </div>
                </div>
                <div className="flex flex-col">
                {category.permissions.map((perm) => (
                    <PermissionRow 
                        key={perm.id} 
                        label={perm.label} 
                        value={permissions[perm.id] || 'none'}
                        onChange={(value) => handlePermissionChange(perm.id, value)}
                    />
                ))}
                </div>
            </div>
            ))}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!selectedUser}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réinitialiser
            </Button>
            <Button onClick={handleSave} disabled={!selectedUser}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
            </Button>
        </CardFooter>
        </Card>
    </div>
  );
}