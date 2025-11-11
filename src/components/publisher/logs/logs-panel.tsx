"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

export interface PublisherLogRecord {
  id: string;
  type: "Envoyé" | "Reçu";
  message: string;
  createdAt: string;
}

interface LogsPanelProps {
  entries: PublisherLogRecord[];
}

export function LogsPanel({ entries }: LogsPanelProps) {
  return (
    <Card className="h-full border border-sky-600 shadow-none">
      <ScrollArea className="h-full">
        <ul className="space-y-2 p-4 text-sm text-slate-700">
          {entries.length === 0 ? (
            <li className="flex h-64 items-center justify-center text-slate-500">
              Aucun journal disponible
            </li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id} className="rounded border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>{entry.type}</span>
                  <span>{entry.createdAt}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{entry.message}</p>
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </Card>
  );
}
