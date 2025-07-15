
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'assemblée</CardTitle>
          <CardDescription>
            Gérez les détails de votre assemblée locale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Année de service</Label>
              <Input id="year" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assembly-name">Nom de l'assemblée</Label>
              <Input id="assembly-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-id">ID de l'assemblée</Label>
              <Input id="assembly-id" />
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="address">Adresse de la Salle du Royaume</Label>
              <Input id="address" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="meeting-times">Jours et heures des réunions</Label>
                <Input id="meeting-times" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="zoom-link">Lien Zoom</Label>
                <Input id="zoom-link" type="url" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button><Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications</Button>
          </div>
        </CardContent>
      </Card>

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
          <div className="flex justify-end">
            <Button><Save className="mr-2 h-4 w-4" /> Sauvegarder les modifications</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des données</CardTitle>
          <CardDescription>
            Importez, exportez ou sauvegardez les données de votre application.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
            <Button variant="outline" className="w-full md:w-auto">
                <Upload className="mr-2 h-4 w-4" /> Importer (CSV/Excel)
            </Button>
            <Button variant="outline" className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" /> Exporter (CSV/Excel)
            </Button>
            <Button variant="outline" className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" /> Sauvegarde SQL
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
