
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Save, Eye, EyeOff, Check, X, Globe, Bell, Link2, User } from 'lucide-react';
import { AuditLog } from '@/lib/encryption-service';

// Types
interface UserProfile {
  nom: string;
  email: string;
  photo?: string;
  dateCreation: string;
}

interface UserPreferences {
  langue: string;
  fuseau: string;
  theme: string;
}

interface NotificationSettings {
  emailAlerts: boolean;
  whatsappAlerts: boolean;
  whatsappNumber?: string;
  typesNotifications: {
    nouvellesTaches: boolean;
    rappels: boolean;
    alertesSecurite: boolean;
    exportsCompletes: boolean;
    tachesAssignees: boolean;
  };
}

interface IntegrationSettings {
  webhookUrl?: string;
  webhookActive: boolean;
  slackWebhook?: string;
  slackActive: boolean;
}

// Constantes
const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

const TIMEZONES = [
  { code: 'UTC', label: 'UTC' },
  { code: 'Europe/Paris', label: 'Europe/Paris (UTC+1/+2)' },
  { code: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
  { code: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1/+2)' },
  { code: 'Europe/Madrid', label: 'Europe/Madrid (UTC+1/+2)' },
  { code: 'America/New_York', label: 'America/New York (UTC-5/-4)' },
  { code: 'America/Chicago', label: 'America/Chicago (UTC-6/-5)' },
  { code: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-8/-7)' },
  { code: 'America/Toronto', label: 'America/Toronto (UTC-5/-4)' },
  { code: 'America/Mexico_City', label: 'America/Mexico City (UTC-6/-5)' },
  { code: 'America/Buenos_Aires', label: 'America/Buenos Aires (UTC-3)' },
  { code: 'America/Sao_Paulo', label: 'America/São Paulo (UTC-3/-2)' },
  { code: 'Africa/Cairo', label: 'Africa/Cairo (UTC+2)' },
  { code: 'Africa/Johannesburg', label: 'Africa/Johannesburg (UTC+2)' },
  { code: 'Africa/Lagos', label: 'Africa/Lagos (UTC+1)' },
  { code: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { code: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { code: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (UTC+8)' },
  { code: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+7)' },
  { code: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
  { code: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
  { code: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10/+11)' },
  { code: 'Australia/Melbourne', label: 'Australia/Melbourne (UTC+10/+11)' },
  { code: 'Australia/Brisbane', label: 'Australia/Brisbane (UTC+10)' },
  { code: 'Pacific/Auckland', label: 'Pacific/Auckland (UTC+12/+13)' },
];

const NOTIFICATION_TYPES = [
  { key: 'nouvellesTaches', label: 'Nouvelles tâches assignées' },
  { key: 'rappels', label: 'Rappels de tâches' },
  { key: 'alertesSecurite', label: 'Alertes de sécurité' },
  { key: 'exportsCompletes', label: 'Exports complétés' },
  { key: 'tachesAssignees', label: 'Tâches assignées à d\'autres' },
];

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<'profil' | 'preferences' | 'notifications' | 'integrations'>('profil');
  
  // État du profil
  const [profile, setProfile] = useState<UserProfile>({
    nom: '',
    email: '',
    photo: '',
    dateCreation: new Date().toISOString().split('T')[0],
  });

  // État des préférences
  const [preferences, setPreferences] = useState<UserPreferences>({
    langue: 'fr',
    fuseau: 'UTC',
    theme: 'light',
  });

  // État des notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    whatsappAlerts: false,
    whatsappNumber: '',
    typesNotifications: {
      nouvellesTaches: true,
      rappels: true,
      alertesSecurite: true,
      exportsCompletes: true,
      tachesAssignees: false,
    },
  });

  // État des intégrations
  const [integrations, setIntegrations] = useState<IntegrationSettings>({
    webhookUrl: '',
    webhookActive: false,
    slackWebhook: '',
    slackActive: false,
  });

  // États UI
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [showWebhookInput, setShowWebhookInput] = useState(false);
  const [showSlackInput, setShowSlackInput] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Charger les données au montage
  useEffect(() => {
    const loadData = () => {
      try {
        const profileData = localStorage.getItem('user_profile');
        const preferencesData = localStorage.getItem('user_preferences');
        const notificationsData = localStorage.getItem('user_notifications');
        const integrationsData = localStorage.getItem('user_integrations');

        if (profileData) setProfile(JSON.parse(profileData));
        if (preferencesData) setPreferences(JSON.parse(preferencesData));
        if (notificationsData) setNotifications(JSON.parse(notificationsData));
        if (integrationsData) setIntegrations(JSON.parse(integrationsData));

        // Charger la photo
        const photoData = localStorage.getItem('user_photo');
        if (photoData) setPhotoPreview(photoData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setSaveMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
      }
    };
    loadData();
  }, []);

  // Gestion de la photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setProfile(prev => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Sauvegarde du profil
  const handleSaveProfile = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        localStorage.setItem('user_profile', JSON.stringify(profile));
        if (photoPreview) {
          localStorage.setItem('user_photo', photoPreview);
        }
        
        // Audit logging
        const auditLog = AuditLog.getInstance();
        auditLog.log('PROFILE_UPDATED', { updatedFields: ['nom', 'email'] });

        setSaveMessage({ type: 'success', text: 'Profil sauvegardé avec succès' });
        setTimeout(() => setSaveMessage(null), 3000);
        setLoading(false);
      }, 500);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      setLoading(false);
    }
  };

  // Sauvegarde des préférences
  const handleSavePreferences = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        localStorage.setItem('user_preferences', JSON.stringify(preferences));
        
        // Audit logging
        const auditLog = AuditLog.getInstance();
        auditLog.log('PREFERENCES_UPDATED', { langue: preferences.langue, fuseau: preferences.fuseau });

        setSaveMessage({ type: 'success', text: 'Préférences sauvegardées avec succès' });
        setTimeout(() => setSaveMessage(null), 3000);
        setLoading(false);
      }, 500);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      setLoading(false);
    }
  };

  // Sauvegarde des notifications
  const handleSaveNotifications = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
        
        // Audit logging
        const auditLog = AuditLog.getInstance();
        auditLog.log('NOTIFICATIONS_UPDATED', { 
          emailAlerts: notifications.emailAlerts,
          whatsappAlerts: notifications.whatsappAlerts 
        });

        setSaveMessage({ type: 'success', text: 'Notifications sauvegardées avec succès' });
        setTimeout(() => setSaveMessage(null), 3000);
        setLoading(false);
      }, 500);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      setLoading(false);
    }
  };

  // Sauvegarde des intégrations
  const handleSaveIntegrations = () => {
    setLoading(true);
    try {
      setTimeout(() => {
        localStorage.setItem('user_integrations', JSON.stringify(integrations));
        
        // Audit logging
        const auditLog = AuditLog.getInstance();
        auditLog.log('INTEGRATIONS_UPDATED', { 
          webhookActive: integrations.webhookActive,
          slackActive: integrations.slackActive 
        });

        setSaveMessage({ type: 'success', text: 'Intégrations sauvegardées avec succès' });
        setTimeout(() => setSaveMessage(null), 3000);
        setLoading(false);
      }, 500);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec Onglets */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: 'profil', icon: User, label: 'Profil' },
          { id: 'preferences', icon: Globe, label: 'Préférences' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'integrations', icon: Link2, label: 'Intégrations' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* TAB 1: Profil */}
      {activeTab === 'profil' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mon Profil
            </CardTitle>
            <CardDescription>Gérez vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Photo de profil</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profil"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
                  >
                    Changer la photo
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG ou GIF (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Nom */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Nom complet</label>
              <Input
                type="text"
                placeholder="Votre nom complet"
                value={profile.nom}
                onChange={(e) => setProfile(prev => ({ ...prev, nom: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Adresse email</label>
              <Input
                type="email"
                placeholder="votre.email@exemple.com"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">Cet email est utilisé pour les notifications et la récupération de compte</p>
            </div>

            {/* Date de création */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Compte créé le</label>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                {new Date(profile.dateCreation).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Préférences */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Préférences
            </CardTitle>
            <CardDescription>Configurez votre langue et votre fuseau horaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Langue */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Langue</label>
              <Select value={preferences.langue} onValueChange={(value) => setPreferences(prev => ({ ...prev, langue: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">L'interface de l'application changera dans la langue sélectionnée</p>
            </div>

            {/* Fuseau horaire */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Fuseau horaire</label>
              <Select value={preferences.fuseau} onValueChange={(value) => setPreferences(prev => ({ ...prev, fuseau: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner un fuseau horaire" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.code} value={tz.code}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Utilisé pour afficher les dates et heures correctement</p>
            </div>

            {/* Thème */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Thème</label>
              <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="auto">Automatique (système)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Disponibilité futur du mode sombre</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSavePreferences}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Alertes Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertes Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">Recevoir les alertes par email</p>
                  <p className="text-xs text-gray-500">Notifications envoyées à {profile.email || 'votre email'}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.emailAlerts ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.emailAlerts ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notifications.emailAlerts && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium text-gray-700">Types de notifications</p>
                  {NOTIFICATION_TYPES.map(type => (
                    <div key={type.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`email-${type.key}`}
                        checked={notifications.typesNotifications[type.key as keyof typeof notifications.typesNotifications]}
                        onChange={(e) => setNotifications(prev => ({
                          ...prev,
                          typesNotifications: {
                            ...prev.typesNotifications,
                            [type.key]: e.target.checked,
                          }
                        }))}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <label htmlFor={`email-${type.key}`} className="text-sm text-gray-700 cursor-pointer">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertes WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertes WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">Recevoir les alertes par WhatsApp</p>
                  <p className="text-xs text-gray-500">Notifications SMS via WhatsApp</p>
                </div>
                <button
                  onClick={() => {
                    setNotifications(prev => ({ ...prev, whatsappAlerts: !prev.whatsappAlerts }));
                    setShowWhatsappInput(!showWhatsappInput);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.whatsappAlerts ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.whatsappAlerts ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notifications.whatsappAlerts && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro WhatsApp</label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={notifications.whatsappNumber || ''}
                      onChange={(e) => setNotifications(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">Format international avec code pays</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Types de notifications</p>
                    {NOTIFICATION_TYPES.map(type => (
                      <div key={type.key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`whatsapp-${type.key}`}
                          checked={notifications.typesNotifications[type.key as keyof typeof notifications.typesNotifications]}
                          onChange={(e) => setNotifications(prev => ({
                            ...prev,
                            typesNotifications: {
                              ...prev.typesNotifications,
                              [type.key]: e.target.checked,
                            }
                          }))}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <label htmlFor={`whatsapp-${type.key}`} className="text-sm text-gray-700 cursor-pointer">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveNotifications}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 4: Intégrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Recevez les mises à jour en temps réel via webhooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">Activer les webhooks</p>
                  <p className="text-xs text-gray-500">Recevez les événements en temps réel</p>
                </div>
                <button
                  onClick={() => {
                    setIntegrations(prev => ({ ...prev, webhookActive: !prev.webhookActive }));
                    setShowWebhookInput(!showWebhookInput);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    integrations.webhookActive ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      integrations.webhookActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {integrations.webhookActive && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL du webhook</label>
                    <Input
                      type="url"
                      placeholder="https://votre-domaine.com/webhook"
                      value={integrations.webhookUrl || ''}
                      onChange={(e) => setIntegrations(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">L'URL doit commencer par https://</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-800 mb-2">Événements webhooks:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• task.created - Une nouvelle tâche est créée</li>
                      <li>• task.updated - Une tâche est modifiée</li>
                      <li>• task.completed - Une tâche est complétée</li>
                      <li>• notification.sent - Une notification est envoyée</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slack */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Slack
              </CardTitle>
              <CardDescription>Recevez les notifications dans Slack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-800">Activer l'intégration Slack</p>
                  <p className="text-xs text-gray-500">Envoyez les notifications à Slack</p>
                </div>
                <button
                  onClick={() => {
                    setIntegrations(prev => ({ ...prev, slackActive: !prev.slackActive }));
                    setShowSlackInput(!showSlackInput);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    integrations.slackActive ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      integrations.slackActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {integrations.slackActive && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL Slack</label>
                    <Input
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={integrations.slackWebhook || ''}
                      onChange={(e) => setIntegrations(prev => ({ ...prev, slackWebhook: e.target.value }))}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Créer un webhook Slack
                      </a>
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-purple-800 mb-2">Notifications Slack:</p>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• Nouvelles tâches assignées</li>
                      <li>• Rappels de tâches</li>
                      <li>• Alertes de sécurité</li>
                      <li>• Tâches complétées</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveIntegrations}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
