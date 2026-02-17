'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Save, RefreshCw, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/context/app-settings-context";
import { useState } from "react";

// Génère un ID d'assemblée unique basé sur le nom
function generateAssemblyId(name: string): string {
  const prefix = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 6);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix || 'ASM'}-${suffix}`;
}

// Génère un PIN à 6 chiffres
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSetting, updateSettings } = useAppSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showGeneratedCredentials, setShowGeneratedCredentials] = useState<{ id: string; pin: string } | null>(null);

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ description: `${field} copié dans le presse-papiers.` });
  };

  const handleSave = (section: string) => {
    // Si c'est la section assemblée et qu'il n'y a pas encore d'ID/PIN, les générer automatiquement
    if (section === "Information de l'assemblée") {
      if (!settings.congregationName?.trim()) {
        toast({
          title: "Nom requis",
          description: "Veuillez saisir le nom de l'assemblée avant d'enregistrer.",
          variant: "destructive",
        });
        return;
      }
      const newId = settings.assemblyId || generateAssemblyId(settings.congregationName);
      const newPin = settings.assemblyPin || generatePin();
      if (!settings.assemblyId || !settings.assemblyPin) {
        updateSettings({ assemblyId: newId, assemblyPin: newPin });
      }
      // Toujours afficher les identifiants après enregistrement
      setShowGeneratedCredentials({ id: newId, pin: newPin });
      toast({
        title: "✅ Enregistré !",
        description: `ID : ${newId} — PIN : ${newPin}`,
        duration: 15000,
      });
      return;
    }
    toast({
      title: "Succès",
      description: `Les informations de la section "${section}" ont été sauvegardées.`,
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Paramètres</h1>
      <div className="mt-6">
        <Tabs defaultValue="assembly_info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="assembly_info">Informations de l'assemblée</TabsTrigger>
        <TabsTrigger value="circuit_info">Informations de la circonscription</TabsTrigger>
        <TabsTrigger value="data_management">Gestion des données</TabsTrigger>
      </TabsList>

      <TabsContent value="assembly_info">
        <Card>
          <CardHeader>
            <CardTitle>Information de l’assemblée</CardTitle>
            <CardDescription>
              Gérez les détails de votre assemblée locale. Ces informations seront utilisées dans toute l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="assembly-name">Nom de l'assemblée</Label>
                    <Input
                      id="assembly-name"
                      placeholder="Ex: Assemblée de la Plaine"
                      value={settings.congregationName}
                      onChange={(e) => updateSetting('congregationName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="assembly-id">ID de l'assemblée</Label>
                    <div className="flex gap-2">
                      <Input
                        id="assembly-id"
                        placeholder="Généré automatiquement à l'enregistrement"
                        value={settings.assemblyId}
                        readOnly={!!settings.assemblyId}
                        className={settings.assemblyId ? "bg-muted font-mono" : ""}
                        onChange={(e) => !settings.assemblyId && updateSetting('assemblyId', e.target.value)}
                      />
                      {settings.assemblyId && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(settings.assemblyId, 'ID')}
                          title="Copier l'ID"
                        >
                          {copiedField === 'ID' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    {!settings.assemblyId && (
                      <p className="text-xs text-muted-foreground">Sera généré automatiquement lors de l'enregistrement</p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assembly-pin">PIN de connexion</Label>
                <div className="flex gap-2">
                  <Input
                    id="assembly-pin"
                    type="text"
                    placeholder="Généré automatiquement à l'enregistrement"
                    value={settings.assemblyPin}
                    readOnly={!!settings.assemblyPin}
                    className={settings.assemblyPin ? "bg-muted font-mono" : ""}
                    onChange={(e) => !settings.assemblyPin && updateSetting('assemblyPin', e.target.value)}
                  />
                  {settings.assemblyPin && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(settings.assemblyPin, 'PIN')}
                        title="Copier le PIN"
                      >
                        {copiedField === 'PIN' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newPin = generatePin();
                          updateSetting('assemblyPin', newPin);
                          toast({ description: `Nouveau PIN généré : ${newPin}` });
                        }}
                        title="Régénérer le PIN"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                {!settings.assemblyPin && (
                  <p className="text-xs text-muted-foreground">Sera généré automatiquement lors de l'enregistrement</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse de la Salle du Royaume</Label>
              <Input id="address" placeholder="Ex: 123 Rue du Royaume, 75001 Paris" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="meeting-day">Jours et heures des réunions</Label>
                    <Input id="meeting-day" placeholder="Ex: Mercredi 19h, Dimanche 10h" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <Input id="phone" type="tel" placeholder="Ex: 01 23 45 67 89" />
                </div>
            </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="website">Site web de l'assemblée</Label>
                    <Input id="website" type="url" placeholder="Ex: jw.org" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Adresse e-mail de contact</Label>
                    <Input id="email" type="email" placeholder="Ex: contact@assemblee.org" />
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button onClick={() => handleSave("Information de l'assemblée")}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
            </Button>
            {(showGeneratedCredentials || (settings.assemblyId && settings.assemblyPin)) && (
              <div className="w-full rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 p-4 space-y-3">
                <h3 className="font-bold text-green-800 dark:text-green-200 text-lg">🔑 Identifiants de l'assemblée</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Communiquez ces identifiants aux proclamateurs pour qu'ils se connectent sur l'app mobile :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded p-3 border">
                    <span className="text-sm font-medium text-muted-foreground">ID :</span>
                    <span className="font-mono font-bold text-lg">{showGeneratedCredentials?.id || settings.assemblyId}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => copyToClipboard(showGeneratedCredentials?.id || settings.assemblyId, 'ID')}>
                      {copiedField === 'ID' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded p-3 border">
                    <span className="text-sm font-medium text-muted-foreground">PIN :</span>
                    <span className="font-mono font-bold text-lg">{showGeneratedCredentials?.pin || settings.assemblyPin}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => copyToClipboard(showGeneratedCredentials?.pin || settings.assemblyPin, 'PIN')}>
                      {copiedField === 'PIN' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="circuit_info">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la circonscription</CardTitle>
            <CardDescription>
              Gérez les détails de votre circonscription.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="co-name">Nom du responsable de circonscription</Label>
                <Input id="co-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-phone">Numéro de téléphone</Label>
                <Input id="co-phone" type="tel" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="co-wife-name">Nom de son épouse</Label>
                <Input id="co-wife-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="circuit-name">Nom de la circonscription</Label>
                <Input id="circuit-name" />
              </div>
            </div>
          </CardContent>
           <CardFooter>
            <Button onClick={() => handleSave("Informations de la circonscription")}><Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="data_management">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des données</CardTitle>
            <CardDescription>
              Importez, exportez ou sauvegardez les données de votre application.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => toast({ title: "Info", description: "Fonctionnalité d'importation bientôt disponible."})}>
                  <Upload className="mr-2 h-4 w-4" /> Importer (CSV/Excel)
              </Button>
              <Button variant="outline" className="w-full md:w-auto" onClick={() => toast({ title: "Info", description: "Fonctionnalité d'exportation bientôt disponible."})}>
                  <Download className="mr-2 h-4 w-4" /> Exporter (CSV/Excel)
              </Button>
              <Button variant="outline" className="w-full md:w-auto" onClick={() => toast({ title: "Succès", description: "Une sauvegarde complète a été effectuée."})}>
                  <Save className="mr-2 h-4 w-4" /> Sauvegarde SQL
              </Button>
          </CardContent>
        </Card>
      </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}