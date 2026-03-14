'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function AssemblySettingsPage() {
  const [assemblyId, setAssemblyId] = React.useState('');
  const [assemblyPin, setAssemblyPin] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('appSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        setAssemblyId(settings.assemblyId || '');
        setAssemblyPin(settings.assemblyPin || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setLoaded(true);
  }, []);

  const handleSave = React.useCallback(() => {
    try {
      const settings = {
        assemblyId: assemblyId.trim(),
        assemblyPin: assemblyPin.trim(),
      };
      localStorage.setItem('appSettings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [assemblyId, assemblyPin]);

  if (!loaded) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuration d'Assemblée</h1>
          <p className="text-gray-500 mt-2">
            Configurez l'assemblée pour la synchronisation automatique avec Flutter APK
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identifiants de l'Assemblée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                These settings are stored locally and used to automatically sync users from the web app to Flutter.
                Every user added here will be tagged with this assembly ID.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ID Assemblée</label>
              <Input
                placeholder="Ex: KINYOL-WGHK"
                value={assemblyId}
                onChange={(e) => setAssemblyId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Cet ID identifie votre assemblée pour la synchronisation
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PIN Assemblée</label>
              <Input
                placeholder="Ex: 136573"
                type="password"
                value={assemblyPin}
                onChange={(e) => setAssemblyPin(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Ce PIN est utilisé dans l'APK pour accéder aux données
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={!assemblyId.trim() || !assemblyPin.trim()}
              className="w-full h-10"
            >
              Enregistrer la configuration
            </Button>

            {saved && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Configuration sauvegardée! Les utilisateurs vont maintenant synchroniser automatiquement avec:
                  <br />
                  <strong>AssemblyId:</strong> {assemblyId} <br />
                  <strong>PIN:</strong> {'•'.repeat(assemblyPin.length)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🔄 Synchronisation Automatique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p>Une fois configuré, chaque modification est automatiquement synchronisée:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>✅ Ajouter un utilisateur → mis à jour dans publisher-users.json</li>
                <li>✅ Modifier un utilisateur → synchronisé en temps réel</li>
                <li>✅ Supprimer un utilisateur → retiré du fichier</li>
                <li>✅ L'APK Flutter peut charger les données à jour</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration pour KIN YOLO EST:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>ID Assemblée: <code className="bg-gray-100 px-1">KINYOL-WGHK</code></li>
              <li>PIN Assemblée: <code className="bg-gray-100 px-1">136573</code></li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
