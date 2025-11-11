
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

export default function DevicesPage() {
  const { devices, replaceDevices } = usePeople();
  const [filter, setFilter] = useState<ExpirationFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const filteredDevices = useMemo(() => {
    const lower = search.trim().toLowerCase();
    const now = new Date();
    return devices.filter((device) => {
      const matchesSearch =
        !lower ||
        device.personName?.toLowerCase().includes(lower) ||
        device.personId.toLowerCase().includes(lower) ||
        device.deviceModel.toLowerCase().includes(lower);

      if (!matchesSearch) {
        return false;
      }

      if (filter === 'all') {
        return true;
      }

      const expiration = parseDate(device.expirationDate);
      if (Number.isNaN(expiration.getTime())) {
        return true;
      }

      if (filter === 'expired') {
        return expiration < now;
      }

      const diff = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= EXPIRATION_THRESHOLD_DAYS;
    });
  }, [devices, filter, search]);

  const rows = filteredDevices.map((device) => ({
    deviceId: device.deviceId,
    personId: device.personId,
    personName: device.personName ?? '—',
    deviceModel: device.deviceModel,
    appVersion: device.appVersion,
    expirationDate: device.expirationDate,
    icon: undefined,
    alert: device.alert,
  }));

  const totalCount = filteredDevices.length;

  const handleRefresh = () => {
    // In a real implementation we would refetch from the backend.
    // For now, simply reset to the existing array to mimic refresh.
    replaceDevices([...devices]);
  };

  const handleRemove = () => {
    if (!selectedDeviceId) {
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
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
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
