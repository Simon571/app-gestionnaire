'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PublisherUser } from '@/lib/publisher-user-data';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SortKey = keyof Omit<PublisherUser, 'devices' | 'id'>;

interface PublisherUsersTableProps {
  users: PublisherUser[];
  onSelectionChange: (user: PublisherUser | null) => void;
}

export function PublisherUsersTable({ users, onSelectionChange }: PublisherUsersTableProps) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const sortedUsers = React.useMemo(() => {
    let sortableUsers = [...users];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
    const va = a[sortConfig.key] as any;
    const vb = b[sortConfig.key] as any;
    if (va === undefined && vb !== undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
    if (vb === undefined && va !== undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (va < vb) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (va > vb) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelecteds = new Set(users.map(u => u.id));
      setSelectedRows(newSelecteds);
      onSelectionChange(users[users.length - 1] || null);
    } else {
      setSelectedRows(new Set());
      onSelectionChange(null);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelecteds = new Set(selectedRows);
    if (checked) {
      newSelecteds.add(id);
    } else {
      newSelecteds.delete(id);
    }
    setSelectedRows(newSelecteds);

    if (newSelecteds.size === 0) {
        onSelectionChange(null);
    } else {
        const lastSelectedId = Array.from(newSelecteds).pop();
        const selectedUser = users.find(u => u.id === lastSelectedId);
        onSelectionChange(selectedUser || null);
    }
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Checkbox
                                checked={selectedRows.size > 0 && selectedRows.size === users.length}
                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                            />
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('lastName')}>
                                Nom de famille
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>
                             <Button variant="ghost" onClick={() => requestSort('firstName')}>
                                Prénom
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Délégué</TableHead>
                        <TableHead>Appareils connectés</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedUsers.map((user) => (
                        <TableRow 
                            key={user.id} 
                            className={cn(
                                'hover:bg-muted/50',
                                user.status === 'Non connecté' && 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30',
                                selectedRows.has(user.id) && 'bg-blue-100 dark:bg-blue-900/20'
                            )}
                            onClick={() => handleSelectRow(user.id, !selectedRows.has(user.id))}
                        >
                            <TableCell>
                                <Checkbox checked={selectedRows.has(user.id)} />
                            </TableCell>
                            <TableCell>{user.lastName}</TableCell>
                            <TableCell>{user.firstName}</TableCell>
                            <TableCell>{user.pin}</TableCell>
                            <TableCell>{user.delegate || 'N/A'}</TableCell>
                            <TableCell>
                                {user.devices.length > 0 ? `${user.devices.length} appareil(s)` : 'Non connecté'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
