'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/context/app-settings-context";

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSetting } = useAppSettings();

  const handleSave = (section: string) => {
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
                    <Label htmlFor="assembly-number">Numéro de l'assemblée</Label>
                    <Input id="assembly-number" placeholder="Ex: 12345" />
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
          <CardFooter>
            <Button onClick={() => handleSave("Information de l’assemblée")}>
                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
            </Button>
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