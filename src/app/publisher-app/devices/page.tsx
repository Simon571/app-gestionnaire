
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PublisherDevicesTable } from "@/components/publisher/publisher-devices-table";
import { usePeople } from "@/context/people-context";
import { RefreshCw, Trash2 } from "lucide-react";

type ExpirationFilter = 'all' | 'soon' | 'expired';

const EXPIRATION_THRESHOLD_DAYS = 14;

const parseDate = (value: string) => {
  const normalized = value.replace(/\//g, '-');
  const parts = normalized.split('-');
  if (parts.length === 3) {
    // assume yyyy-mm-dd
    return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
  }
  return new Date(value);
};

const readArrayFromStorage = <T,>(key: string): T[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch (err) {
    console.error(`Failed to read ${key} from localStorage`, err);
    return null;
  }
};

export default function DevicesPage() {
  const { devices, people, replaceDevices, replacePeople } = usePeople();
  const [filter, setFilter] = useState<ExpirationFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deviceByPersonId = useMemo(
    () => new Map(devices.map((device) => [device.personId, device])),
    [devices]
  );

  const rows = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const now = new Date();

    return people
      .map((person) => {
        const device = deviceByPersonId.get(person.id);
        const expirationDate = device?.expirationDate ?? '—';

        const expiration = expirationDate !== '—' ? parseDate(expirationDate) : null;
        const diffDays =
          expiration && !Number.isNaN(expiration.getTime())
            ? (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            : null;

        return {
          deviceId: device?.deviceId ?? '—',
          personId: person.id,
          personName: person.displayName,
          deviceModel: device?.deviceModel ?? 'Non renseigné',
          appVersion: device?.appVersion ?? 'Non connecté',
          expirationDate,
          icon: undefined,
          alert: device?.alert,
          diffDays,
        };
      })
      // Trier pour garder un affichage stable et lisible
      .sort((a, b) => a.personName.localeCompare(b.personName, 'fr'))
      .filter((row) => {
        const matchesSearch =
          !lower ||
          row.personName.toLowerCase().includes(lower) ||
          row.personId.toLowerCase().includes(lower) ||
          row.deviceModel.toLowerCase().includes(lower);

        if (!matchesSearch) {
          return false;
        }

        if (filter === 'all' || row.expirationDate === '—') {
          return true;
        }

        if (row.diffDays === null) {
          return true;
        }

        if (filter === 'expired') {
          return row.diffDays < 0;
        }

        return row.diffDays >= 0 && row.diffDays <= EXPIRATION_THRESHOLD_DAYS;
      });
  }, [people, deviceByPersonId, search, filter]);

  const totalCount = rows.length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Recharger depuis le stockage local pour synchroniser avec la page Personnes.
    const storedPeople = readArrayFromStorage<typeof people[number]>('people');
    const storedDevices = readArrayFromStorage<typeof devices[number]>('publisherDevices');

    // Toujours déclencher un set-state pour forcer le re-render, même si rien n'a changé.
    replacePeople(storedPeople ?? [...people]);
    replaceDevices(storedDevices ?? [...devices]);
    setIsRefreshing(false);
  };

  const handleRemove = () => {
    if (!selectedDeviceId || selectedDeviceId === '—') {
      return;
    }
    replaceDevices(devices.filter((d) => d.deviceId !== selectedDeviceId));
    setSelectedDeviceId(null);
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Appareils mobiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filter} onValueChange={(value: ExpirationFilter) => setFilter(value)}>
              <SelectTrigger className="w-40 border-sky-600">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="soon">Expiration proche</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation…' : 'Actualiser'}
            </Button>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher..."
              className="w-full max-w-sm border-sky-600"
            />
            <div className="ml-auto text-sm font-medium text-slate-600">
              {totalCount} appareil{totalCount > 1 ? 's' : ''}
            </div>
          </div>

          <PublisherDevicesTable
            rows={rows}
            selectedDeviceId={selectedDeviceId}
            onRowSelect={(deviceId) =>
              setSelectedDeviceId((prev) => (prev === deviceId ? null : deviceId))
            }
          />

          <div className="flex justify-end">
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              disabled={!selectedDeviceId}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
              Enlever l'appareil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
