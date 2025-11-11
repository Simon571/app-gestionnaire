'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Globe,
  Palette,
  LayoutDashboard,
  Save,
  Lightbulb,
  Lock,
  User,
  Calendar,
  Clock,
  BookOpen,
  Mic,
  Briefcase,
  Printer,
} from 'lucide-react';
import { useAppSettings } from '@/context/app-settings-context';
import type { AppSettings } from '@/lib/app-settings';

export default function AppSettingsPage() {
  const { settings, updateSetting } = useAppSettings();

  const themes = [
    'Original', 'Royal', 'Nature', 'Marin', 'Acier', 'Radiant', 'Bleu', 'Mauve', 'Vert', 'Turquoise', 'Charbon'
  ];
  const initialViews = [
    'Moi', 'Programme', 'Assemblée'
  ];
  const displayNameFormats = [
    'Nom Prénom', 'Prénom Nom'
  ];
  const dateFormats = [
    'aaaa/MM/jj', 'jj/MM/aaaa', 'MM/jj/aaaa'
  ];
  const timeFormats = [
    '12h', '24h'
  ];
  const paperSizes = [
    'A4', 'Letter'
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Paramètres de l'application</h1>

      {/* Section Programme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Paramètres généraux du programme</CardTitle>
          <CardDescription>Configurez les préférences générales de l'application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Langue de l'application */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2"><Globe className="h-4 w-4" /> Langue de l'application</Label>
              <Select value={settings.language} onValueChange={(value: AppSettings['language']) => updateSetting('language', value)}>
                <SelectTrigger id="language"><SelectValue placeholder="Sélectionner une langue" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thème visuel */}
            <div className="space-y-2">
              <Label htmlFor="theme" className="flex items-center gap-2"><Palette className="h-4 w-4" /> Thème visuel</Label>
              <Select value={settings.theme} onValueChange={(value: AppSettings['theme']) => updateSetting('theme', value)}>
                <SelectTrigger id="theme"><SelectValue placeholder="Sélectionner un thème" /></SelectTrigger>
                <SelectContent>
                  {themes.map(theme => (
                    <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vue initiale */}
            <div className="space-y-2">
              <Label htmlFor="initialView" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Vue initiale</Label>
              <Select value={settings.initialView} onValueChange={(value: AppSettings['initialView']) => updateSetting('initialView', value)}>
                <SelectTrigger id="initialView"><SelectValue placeholder="Sélectionner une vue" /></SelectTrigger>
                <SelectContent>
                  {initialViews.map(view => (
                    <SelectItem key={view} value={view}>{view}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rappel de sauvegarde */}
            <div className="space-y-2">
              <Label htmlFor="saveReminderFrequency" className="flex items-center gap-2"><Save className="h-4 w-4" /> Fréquence de rappel de sauvegarde (semaines)</Label>
              <Input
                id="saveReminderFrequency"
                type="number"
                value={settings.saveReminderFrequency}
                onChange={(e) => updateSetting('saveReminderFrequency', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showTipsOnStartup"
                checked={settings.showTipsOnStartup}
                onCheckedChange={(checked: boolean) => updateSetting('showTipsOnStartup', checked)}
              />
              <Label htmlFor="showTipsOnStartup" className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Afficher les astuces au démarrage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="passwordProtectApp"
                checked={settings.passwordProtectApp}
                onCheckedChange={(checked: boolean) => updateSetting('passwordProtectApp', checked)}
              />
              <Label htmlFor="passwordProtectApp" className="flex items-center gap-2"><Lock className="h-4 w-4" /> Protéger par mot de passe l'accès à l'application</Label>
            </div>
          </div>

          {/* Paramètres d'affichage */}
          <h3 className="text-lg font-semibold mt-6">Paramètres d'affichage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Affichage du nom */}
            <div className="space-y-2">
              <Label htmlFor="displayNameFormat" className="flex items-center gap-2"><User className="h-4 w-4" /> Affichage du nom</Label>
              <Select value={settings.displayNameFormat} onValueChange={(value: AppSettings['displayNameFormat']) => updateSetting('displayNameFormat', value)}>
                <SelectTrigger id="displayNameFormat"><SelectValue placeholder="Sélectionner un format" /></SelectTrigger>
                <SelectContent>
                  {displayNameFormats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format de date */}
            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Format de date</Label>
              <Select value={settings.dateFormat} onValueChange={(value: AppSettings['dateFormat']) => updateSetting('dateFormat', value)}>
                <SelectTrigger id="dateFormat"><SelectValue placeholder="Sélectionner un format" /></SelectTrigger>
                <SelectContent>
                  {dateFormats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format de date courte */}
            <div className="space-y-2">
              <Label htmlFor="shortDateFormat" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Format de date courte</Label>
              <Select value={settings.shortDateFormat} onValueChange={(value: AppSettings['shortDateFormat']) => updateSetting('shortDateFormat', value)}>
                <SelectTrigger id="shortDateFormat"><SelectValue placeholder="Sélectionner un format" /></SelectTrigger>
                <SelectContent>
                  {dateFormats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format de plage de dates */}
            <div className="space-y-2">
              <Label htmlFor="dateRangeFormat" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Format de plage de dates</Label>
              <Input
                id="dateRangeFormat"
                value={settings.dateRangeFormat}
                onChange={(e) => updateSetting('dateRangeFormat', e.target.value)}
              />
            </div>

            {/* Format de l'heure */}
            <div className="space-y-2">
              <Label htmlFor="timeFormat" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Format de l'heure</Label>
              <Select value={settings.timeFormat} onValueChange={(value: AppSettings['timeFormat']) => updateSetting('timeFormat', value)}>
                <SelectTrigger id="timeFormat"><SelectValue placeholder="Sélectionner un format" /></SelectTrigger>
                <SelectContent>
                  {timeFormats.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Programmes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Paramètres des programmes</CardTitle>
          <CardDescription>Configurez les règles spécifiques aux programmes de réunion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">Réunion Vie et ministère</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temps minimum entre les attributions */}
            <div className="space-y-2">
              <Label htmlFor="meetingMinTimeBetweenAssignments" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Temps minimum entre les attributions (semaines)</Label>
              <Input
                id="meetingMinTimeBetweenAssignments"
                type="number"
                value={settings.meetingMinTimeBetweenAssignments}
                onChange={(e) => updateSetting('meetingMinTimeBetweenAssignments', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Temps minimum entre les devoirs d'élève */}
            <div className="space-y-2">
              <Label htmlFor="meetingMinTimeBetweenStudentDuties" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Temps minimum entre les devoirs d'élève (semaines)</Label>
              <Input
                id="meetingMinTimeBetweenStudentDuties"
                type="number"
                value={settings.meetingMinTimeBetweenStudentDuties}
                onChange={(e) => updateSetting('meetingMinTimeBetweenStudentDuties', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="meetingAvoidSameFamilySameDay"
              checked={settings.meetingAvoidSameFamilySameDay}
              onCheckedChange={(checked: boolean) => updateSetting('meetingAvoidSameFamilySameDay', checked)}
            />
            <Label htmlFor="meetingAvoidSameFamilySameDay" className="flex items-center gap-2"><User className="h-4 w-4" /> Éviter de programmer une même famille le même jour</Label>
          </div>

          <h3 className="text-lg font-semibold mt-6">Discours publics</h3>
          <div className="space-y-2">
            <Label htmlFor="publicTalkMaxExternalSpeakersPerWeek" className="flex items-center gap-2"><Mic className="h-4 w-4" /> Nombre maximal d'orateurs envoyés à l'extérieur par semaine</Label>
            <Input
              id="publicTalkMaxExternalSpeakersPerWeek"
              type="number"
              value={settings.publicTalkMaxExternalSpeakersPerWeek}
              onChange={(e) => updateSetting('publicTalkMaxExternalSpeakersPerWeek', parseInt(e.target.value) || 0)}
            />
          </div>

          <h3 className="text-lg font-semibold mt-6">Services</h3>
          <div className="space-y-2">
            <Label htmlFor="servicesMinTimeBetweenServices" className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Temps minimum entre les services (semaines)</Label>
            <Input
              id="servicesMinTimeBetweenServices"
              type="number"
              value={settings.servicesMinTimeBetweenServices}
              onChange={(e) => updateSetting('servicesMinTimeBetweenServices', parseInt(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Rapports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> Paramètres des rapports</CardTitle>
          <CardDescription>Configurez les options d'impression et de rapports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paperSize" className="flex items-center gap-2"><Printer className="h-4 w-4" /> Taille du papier pour les impressions</Label>
            <Select value={settings.paperSize} onValueChange={(value: AppSettings['paperSize']) => updateSetting('paperSize', value)}>
              <SelectTrigger id="paperSize"><SelectValue placeholder="Sélectionner une taille" /></SelectTrigger>
              <SelectContent>
                {paperSizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}