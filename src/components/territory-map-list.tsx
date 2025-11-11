
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TerritoryListTable } from '@/components/territory-list-table';

export function TerritoryMapList() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Territory List Table */}
      <div>
        <TerritoryListTable />
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Carte des Territoires</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px] bg-muted/50 rounded-md">
          <p className="text-muted-foreground">La carte interactive sera intégrée ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
