
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Eye, X, Home, Calendar, Users, Map, User, Save, RefreshCw } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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


const PermissionRow = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center justify-between border-b py-3">
      <span className="text-sm">{label}</span>
      <RadioGroup
        defaultValue="edit"
        className="flex items-center gap-4"
      >
        <RadioGroupItem value="edit" id={`${label}-edit`} className="h-6 w-6 border-green-600 text-green-600 focus:ring-green-600" />
        <RadioGroupItem value="view" id={`${label}-view`} className="h-6 w-6 border-orange-500 text-orange-500 focus:ring-orange-500" />
        <RadioGroupItem value="none" id={`${label}-none`} className="h-6 w-6 border-red-600 text-red-600 focus:ring-red-600" />
      </RadioGroup>
    </div>
  );
};


export default function PermissionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission de l'utilisateur</CardTitle>
        <CardDescription>Gérer les autorisations d'accès pour l'utilisateur sélectionné.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        {permissionCategories.map((category) => (
          <div key={category.id}>
            <h3 className="mb-4 flex items-center text-lg font-semibold">
              <category.icon className="mr-3 h-5 w-5 text-primary" />
              {category.label}
            </h3>
            <div className="flex flex-col">
              {category.permissions.map((perm) => (
                <PermissionRow key={perm.id} label={perm.label} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </Button>
      </CardFooter>
    </Card>
  );
}
