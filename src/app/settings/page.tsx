import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Save } from "lucide-react"
import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations('SettingsPage');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('assembly_info_title')}</CardTitle>
          <CardDescription>
            {t('assembly_info_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="assembly-name">{t('assembly_name')}</Label>
              <Input id="assembly-name" defaultValue="Assemblée Centrale" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-id">{t('assembly_id')}</Label>
              <Input id="assembly-id" defaultValue="FR-12345" />
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="address">{t('kh_address')}</Label>
              <Input id="address" defaultValue="123 Rue de la Paix, 75001 Paris" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="meeting-times">{t('meeting_times')}</Label>
                <Input id="meeting-times" defaultValue="Mercredi 19:30, Dimanche 10:00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="zoom-link">{t('zoom_link')}</Label>
                <Input id="zoom-link" type="url" defaultValue="https://zoom.us/j/1234567890" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button><Save className="mr-2 h-4 w-4" /> {t('save_changes')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('data_management_title')}</CardTitle>
          <CardDescription>
            {t('data_management_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
            <Button variant="outline" className="w-full md:w-auto">
                <Upload className="mr-2 h-4 w-4" /> {t('import_button')}
            </Button>
            <Button variant="outline" className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" /> {t('export_button')}
            </Button>
            <Button variant="outline" className="w-full md:w-auto">
                <Save className="mr-2 h-4 w-4" /> {t('backup_button')}
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
