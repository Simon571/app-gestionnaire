'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PublisherUser } from '@/lib/publisher-user-data';
import { RefreshCw, KeyRound, UserCog, Mail, Printer } from 'lucide-react';
import { PublisherUsersTable } from '@/components/publisher-users-table';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';

// Helper function to map Person to PublisherUser
const mapPersonToPublisherUser = (person: Person, preachingGroups: { id: string; name: string }[]): PublisherUser => {
  const groupName = preachingGroups.find(g => g.id === person.spiritual.group)?.name || 'Non assigné';
  
  // Placeholder for PIN and delegate as these are not in Person type
  const pin = person.pin || 'N/A';
  const delegate = undefined; // Or fetch from another source if available

  let status: PublisherUser['status'] = 'Non connecté'; // Default to non-connected
  if (person.spiritual.active) {
    status = 'Actif';
  } else if (person.spiritual.isDeleted) {
    status = 'Inactif'; // Assuming deleted means inactive
  }

  return {
    id: person.id,
    lastName: person.lastName,
    firstName: person.firstName,
    email: person.email1 || person.email2 || '', // Use email1 or email2 from Person
    pin: pin,
    delegate: delegate,
    status: status,
    group: groupName,
    devices: [], // Person type does not track devices
  };
};

export default function PublisherUsersPage() {
  const { people, preachingGroups } = usePeople();
  const [selectedUser, setSelectedUser] = React.useState<PublisherUser | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  const handleSendInvitation = React.useCallback(() => {
    if (!selectedUser?.email) {
      return;
    }

    window.location.href = `mailto:${selectedUser.email}?subject=Invitation à utiliser l'application Publisher&body=Bonjour,`;
  }, [selectedUser]);

  const publisherUsers = React.useMemo(() => {
    return people.map(p => mapPersonToPublisherUser(p, preachingGroups));
  }, [people, preachingGroups]);

  const filteredUsers = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return publisherUsers.filter(user => {
      const statusMatch = selectedStatus === 'all' || user.status === selectedStatus;
      const groupMatch = selectedGroup === 'all' || user.group === selectedGroup;
      const searchMatch =
        !needle ||
        user.firstName.toLowerCase().includes(needle) ||
        user.lastName.toLowerCase().includes(needle) ||
        user.pin?.toLowerCase().includes(needle) ||
        (user.email ?? '').toLowerCase().includes(needle);
      return statusMatch && groupMatch && searchMatch;
    });
  }, [publisherUsers, selectedStatus, selectedGroup, search]);

  const isActionDisabled = !selectedUser;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Action Bar (Left) */}
      <div className="flex flex-col gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Button variant="outline" disabled={isActionDisabled} className="justify-start gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Actualiser la personne</span>
                </Button>
                <Button variant="outline" disabled={isActionDisabled} className="justify-start gap-2">
                    <KeyRound className="h-4 w-4" />
                    <span>Réinitialiser le PIN</span>
                </Button>
                <Button variant="outline" disabled={isActionDisabled} className="justify-start gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Attribuer un délégué</span>
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    <span>Imprimer</span>
                </Button>
        <Button
          variant="outline"
          className="justify-start gap-2"
          disabled={isActionDisabled}
          onClick={handleSendInvitation}
        >
          <Mail className="h-4 w-4" />
          <span>Envoyer un e-mail d’invitation</span>
        </Button>
            </CardContent>
        </Card>
      </div>

      {/* Main Content (Right) */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Rechercher par nom, PIN ou e-mail..."
              className="max-w-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="flex gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                        <SelectItem value="Non connecté">Non connecté</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger>
                        <SelectValue placeholder="Groupe" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les groupes</SelectItem>
                        {preachingGroups.map(group => (
                            <SelectItem key={group.id} value={group.name}>{group.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Users Table */}
        <PublisherUsersTable users={filteredUsers} onSelectionChange={setSelectedUser} />
      </div>
    </div>
  );
}