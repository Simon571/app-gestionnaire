'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePeople } from '@/context/people-context';
import { Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getApiBase } from '@/lib/api-base';

export default function ExportPublisherUsersPage() {
  const { people } = usePeople();
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportResult, setExportResult] = React.useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const handleExport = React.useCallback(async () => {
    if (people.length === 0) {
      setExportResult({
        success: false,
        message: 'Aucune personne à exporter',
      });
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const response = await fetch(`${getApiBase()}/api/export-people-to-publisher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          people,
          assemblyId: 'KINYOL-WGHK',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setExportResult({
          success: true,
          message: result.message || 'Export réussi!',
          count: result.count,
        });
      } else {
        setExportResult({
          success: false,
          message: result.error || 'Erreur lors de l\'export',
        });
      }
    } catch (error) {
      setExportResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [people]);

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export pour Flutter</h1>
          <p className="text-gray-500 mt-2">Exporter les utilisateurs vers l'application mobile</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KIN YOLO EST Français</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Assemblée:</strong> KIN YOLO EST Français<br />
                <strong>ID:</strong> KINYOL-WGHK<br />
                <strong>Utilisateurs à exporter:</strong> {people.length}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Cliquez sur le bouton ci-dessous pour exporter les {people.length} utilisateurs vers le fichier <code className="bg-gray-100 px-2 py-1 rounded text-xs">data/publisher-users.json</code> pour l'APK Flutter.
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting || people.length === 0}
              className="w-full h-12 gap-2"
              size="lg"
            >
              <Download className="h-5 w-5" />
              {isExporting ? 'Export en cours...' : `Exporter ${people.length} utilisateurs`}
            </Button>

            {exportResult && (
              <Alert variant={exportResult.success ? 'default' : 'destructive'}>
                <div className="flex gap-2">
                  {exportResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <strong>{exportResult.message}</strong>
                    {exportResult.count && (
                      <p className="text-sm mt-1">
                        {exportResult.count} utilisateurs sauvegardés dans publisher-users.json
                      </p>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>✅ Exporter les utilisateurs via ce bouton</li>
              <li>🔁 Synchroniser l'APK avec le fichier publisher-users.json</li>
              <li>📱 Reinstaller l'APK sur le téléphone (gestionnaire-app-arm64-v8a-release.apk)</li>
              <li>🔓 Se connecter avec les identifiants KIN YOLO EST</li>
              <li>👤 Sélectionner l'utilisateur par nom et PIN</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
