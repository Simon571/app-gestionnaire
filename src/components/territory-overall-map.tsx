
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TerritoryOverallMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carte d'ensemble du Territoire</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[600px] bg-muted/50 rounded-md">
        <p className="text-muted-foreground">La carte complète de tous les territoires sera intégrée ici.</p>
      </CardContent>
    </Card>
  );
}
