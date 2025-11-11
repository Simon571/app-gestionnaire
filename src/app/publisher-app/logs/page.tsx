'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadCloud, HelpCircle } from "lucide-react";
import { LogsPanel, PublisherLogRecord } from "@/components/publisher/logs/logs-panel";

const demoLogs: PublisherLogRecord[] = [
  { id: 'log-001', type: 'Envoyé', message: 'Rapport d’activité mensuel transmis à 10:45.', createdAt: '2025/11/05 10:45' },
  { id: 'log-002', type: 'Reçu', message: 'Programme hebdomadaire importé.', createdAt: '2025/11/04 09:18' },
  { id: 'log-003', type: 'Envoyé', message: 'Mise à jour des personnes envoyée.', createdAt: '2025/11/03 19:22' },
];

type LogFilter = 'all' | 'sent' | 'received';

const filterOptions: Array<{ value: LogFilter; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'received', label: 'Reçu' },
];

export default function LogsPage() {
  const [filter, setFilter] = useState<LogFilter>('sent');

  const filteredLogs = useMemo(() => {
    if (filter === 'all') {
      return demoLogs;
    }
    if (filter === 'sent') {
      return demoLogs.filter((log) => log.type === 'Envoyé');
    }
    return demoLogs.filter((log) => log.type === 'Reçu');
  }, [filter]);

  const handleDownload = () => {
    // placeholder export action
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journaux-${filter}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid min-h-[580px] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="border-2 border-sky-600 shadow-none">
        <CardContent className="flex h-full flex-col gap-4 pt-6">
          <Select value={filter} onValueChange={(value: LogFilter) => setFilter(value)}>
            <SelectTrigger className="w-full border-sky-600">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="mt-2 flex w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleDownload}
          >
            <DownloadCloud className="h-4 w-4" />
            Télécharger
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-sky-600 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Journaux</CardTitle>
          <HelpCircle className="h-5 w-5 text-sky-600" />
        </CardHeader>
        <CardContent className="h-[480px] pb-6">
          <LogsPanel entries={filteredLogs} />
        </CardContent>
        <div className="border-t border-sky-200 bg-sky-600 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white">
          Ouvrir les journaux complets
        </div>
      </Card>
    </div>
  );
}
