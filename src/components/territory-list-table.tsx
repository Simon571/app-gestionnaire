
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTerritories, Territory } from '@/lib/territory-data';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';

type SortKey = string; // allow dynamic keys used by UI (kept simple to avoid refactor)

export function TerritoryListTable() {
  const [territories, setTerritories] = React.useState<Territory[]>(mockTerritories);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filterType, setFilterType] = React.useState('all');
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);

  const filteredTerritories = React.useMemo(() => {
    let filtered = territories.filter(t => 
      t.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const va = (a as any)[sortConfig.key];
        const vb = (b as any)[sortConfig.key];
        if (va === undefined && vb !== undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (vb === undefined && va !== undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (va < vb) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [territories, searchTerm, filterStatus, filterType, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Territoires</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <Input
            placeholder="Rechercher par numéro ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Attribué">Attribué</SelectItem>
              <SelectItem value="Non attribué">Non attribué</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Non travaillé">Non travaillé</SelectItem>
              <SelectItem value="En retard">En retard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Présentiel">Présentiel</SelectItem>
              <SelectItem value="Téléphonique">Téléphonique</SelectItem>
              <SelectItem value="Courrier">Courrier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('number')}>
                  Numéro {getSortIndicator('number')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('location')}>
                  Lieu {getSortIndicator('location')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('status')}>
                  Statut {getSortIndicator('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('assignee')}>
                  Attribué à {getSortIndicator('assignee')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('type')}>
                  Type {getSortIndicator('type')}
                </Button>
              </TableHead>
              <TableHead>Date d'attribution</TableHead>
              <TableHead>Date de fin</TableHead>
              <TableHead>Dernier travail</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerritories.map((territory) => (
              <TableRow 
                key={territory.id}
                className={cn(
                  territory.status === 'En retard' && 'bg-red-100 dark:bg-red-900/20',
                  territory.status === 'Terminé' && 'bg-green-100 dark:bg-green-900/20',
                )}
              >
                <TableCell>{territory.number}</TableCell>
                <TableCell>{territory.location}</TableCell>
                <TableCell>{territory.status}</TableCell>
                <TableCell>{territory.assignee || 'Non attribué'}</TableCell>
                <TableCell>{territory.type}</TableCell>
                <TableCell>{territory.assignmentDate?.toLocaleDateString() || 'N/A'}</TableCell>
                <TableCell>{territory.completionDate?.toLocaleDateString() || 'N/A'}</TableCell>
                <TableCell>{territory.lastWorkedDate?.toLocaleDateString() || 'N/A'}</TableCell>
                <TableCell className="max-w-[200px] truncate">{territory.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
