'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: Record<string, any> = {};

      // 1. Check localStorage
      try {
        const appSettings = localStorage.getItem('appSettings');
        results.localStorage = {
          status: 'ok',
          appSettings: appSettings ? JSON.parse(appSettings) : null,
          allKeys: Object.keys(localStorage),
        };
      } catch (e) {
        results.localStorage = { status: 'error', error: String(e) };
      }

      // 2. Check API endpoints
      const apiBase = '';  // Relative for web, absolute for MSI
      const assemblyId = (() => {
        try {
          const raw = localStorage.getItem('appSettings');
          if (raw) return (JSON.parse(raw) as Record<string, string>)?.assemblyId || 'DEFAULT';
        } catch (_) {}
        return 'DEFAULT';
      })();

      // Test Users endpoint
      try {
        const response = await fetch(
          `${apiBase}/api/publisher-app/users/export?assemblyId=${assemblyId}`,
          { signal: AbortSignal.timeout(5000) }
        );
        let bodyPreview = '';
        if (response.ok) {
          const json = await response.json();
          bodyPreview = JSON.stringify(json).slice(0, 200);
        } else {
          const text = await response.text();
          bodyPreview = text.slice(0, 200);
        }
        results.usersEndpoint = {
          status: response.ok ? 'ok' : 'error',
          statusCode: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries()),
          bodyPreview: bodyPreview,
        };
      } catch (e) {
        results.usersEndpoint = { status: 'error', error: String(e) };
      }

      // Test Families endpoint
      try {
        const response = await fetch(
          `${apiBase}/api/families`,
          { signal: AbortSignal.timeout(5000) }
        );
        results.familiesEndpoint = {
          status: response.ok ? 'ok' : 'error',
          statusCode: response.status,
          statusText: response.statusText,
        };
      } catch (e) {
        results.familiesEndpoint = { status: 'error', error: String(e) };
      }

      // Test Groups endpoint
      try {
        const response = await fetch(
          `${apiBase}/api/preaching-groups`,
          { signal: AbortSignal.timeout(5000) }
        );
        results.groupsEndpoint = {
          status: response.ok ? 'ok' : 'error',
          statusCode: response.status,
          statusText: response.statusText,
        };
      } catch (e) {
        results.groupsEndpoint = { status: 'error', error: String(e) };
      }

      // 3. Check environment
      results.environment = {
        NEXT_PUBLIC_PORTAL_MODE: process.env.NEXT_PUBLIC_PORTAL_MODE,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NODE_ENV: process.env.NODE_ENV,
      };

      setDiagnostics(results);
      setIsLoading(false);
    };

    runDiagnostics();
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic de l'application</CardTitle>
          <CardDescription>
            Vérification des configurations et endpoints API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              Exécution des diagnostics...
            </div>
          ) : (
            <>
              {/* localStorage */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIcon status={diagnostics.localStorage?.status} />
                  <h3 className="font-semibold">LocalStorage</h3>
                </div>
                {diagnostics.localStorage?.status === 'ok' ? (
                  <div className="bg-muted p-3 rounded text-sm space-y-2">
                    <p><strong>AssemblyId:</strong> {diagnostics.localStorage?.appSettings?.assemblyId || 'NOT SET'}</p>
                    <details>
                      <summary className="cursor-pointer">Tous les paramètres</summary>
                      <pre className="text-xs bg-background p-2 mt-2 overflow-auto">
                        {JSON.stringify(diagnostics.localStorage?.appSettings, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{diagnostics.localStorage?.error}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* API Endpoints */}
              {['usersEndpoint', 'familiesEndpoint', 'groupsEndpoint'].map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={diagnostics[key]?.status} />
                    <h3 className="font-semibold capitalize">
                      {key.replace('Endpoint', '')}
                    </h3>
                  </div>
                  {diagnostics[key]?.status === 'ok' ? (
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="text-green-700">✓ Endpoint accessible (Status: {diagnostics[key]?.statusCode})</p>
                    </div>
                  ) : (
                    <Alert variant="destructive" className="text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {diagnostics[key]?.error || `Error: ${diagnostics[key]?.statusCode} ${diagnostics[key]?.statusText}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}

              {/* Environment */}
              <div className="space-y-2">
                <h3 className="font-semibold">Configuration</h3>
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  <p><strong>Mode:</strong> {diagnostics.environment?.NEXT_PUBLIC_PORTAL_MODE === '1' ? 'Web (Vercel)' : 'MSI (Tauri)'}</p>
                  <p><strong>NODE_ENV:</strong> {diagnostics.environment?.NODE_ENV}</p>
                </div>
              </div>

              {/* Recommendation */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Prochaines étapes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Vérifiez que votre assemblyId est correctement configuré</li>
                    <li>Si les endpoints échouent, vérifiez votre connexion réseau</li>
                    <li>Appuyez sur F12 pour voir les erreurs détaillées dans la Console</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={() => window.location.reload()} variant="outline">
        Recharger et réinitialiser diagnostics
      </Button>
    </div>
  );
}
