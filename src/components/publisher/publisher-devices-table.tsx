"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BellRing, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PublisherDeviceRow {
  personId: string;
  personName: string;
  deviceId: string;
  deviceModel: string;
  appVersion: string;
  expirationDate: string;
  alert?: boolean;
  icon?: React.ReactNode;
}

export interface PublisherDevicesTableProps {
  rows: PublisherDeviceRow[];
  selectedDeviceId?: string | null;
  onRowSelect?: (deviceId: string) => void;
}

export function PublisherDevicesTable({ rows, selectedDeviceId, onRowSelect }: PublisherDevicesTableProps) {
  return (
    <div className="border border-sky-600">
      <div className="grid grid-cols-[0.6fr_1.2fr_1.4fr_0.8fr_0.9fr_0.4fr] items-center border-b-2 border-sky-600 bg-sky-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900">
        <span>ID</span>
        <span>Personne</span>
        <span>Appareil</span>
        <span>Version</span>
        <span>Expiration</span>
        <span className="text-center">Alerte</span>
      </div>
      <ScrollArea className="max-h-[520px]">
        {rows.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
            Aucun appareil enregistré
          </div>
        ) : (
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow className="hidden">
                <TableHead>ID</TableHead>
                <TableHead>Personne</TableHead>
                <TableHead>Appareil</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Alerte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={`${row.personId}-${row.deviceId}`}
                  className={cn(
                    "cursor-pointer border-b border-sky-200 last:border-b-0 transition hover:bg-sky-50",
                    selectedDeviceId === row.deviceId && "bg-sky-100"
                  )}
                  onClick={() => onRowSelect?.(row.deviceId)}
                >
                  <TableCell className="px-3 py-2 text-xs font-medium text-slate-700">
                    {row.personId}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-slate-700">
                    {row.personName}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-slate-700">
                    {row.deviceModel}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-slate-700">
                    {row.appVersion}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-slate-700">
                    {row.expirationDate}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center text-slate-700">
                    {row.icon ?? (row.alert ? (
                      <BellRing className="mx-auto h-4 w-4 text-amber-500" />
                    ) : (
                      <Home className="mx-auto h-4 w-4 text-slate-500" />
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}
