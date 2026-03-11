'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DataLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
        <p className="text-lg text-muted-foreground">Chargement des données...</p>
        <p className="text-sm text-muted-foreground">Cela peut prendre quelques secondes</p>
      </div>
    </div>
  );
}

export function DataErrorState({
  title,
  message,
  error
}: {
  title?: string;
  message?: string;
  error?: string;
} = {}) {
  const displayTitle = title ?? "Erreur de chargement";
  const displayMessage = message ?? "Les données n'ont pas pu être chargées. Veuillez recharger la page.";
  
  return (
    <div className="space-y-4 py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{displayTitle}</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>{displayMessage}</p>
          {error && (
            <details className="text-xs bg-background rounded p-2 max-h-40 overflow-auto mt-2">
              <summary className="cursor-pointer font-semibold">Détails de l'erreur</summary>
              <pre className="whitespace-pre-wrap break-words mt-2">{error}</pre>
            </details>
          )}
        </AlertDescription>
      </Alert>
      <div className="text-sm text-muted-foreground">
        <p>Consultez la page de <a href="/diagnostics" className="underline text-blue-500">diagnostic</a> pour plus d'informations.</p>
      </div>
    </div>
  );
}

export function DataEmptyState({
  title,
  message,
  action
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
} = {}) {
  const displayTitle = title ?? "Aucune donnée";
  const displayMessage = message ?? "Aucune donnée disponible pour afficher.";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayTitle}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-muted-foreground">
          <p>{displayMessage}</p>
        </div>
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
}
