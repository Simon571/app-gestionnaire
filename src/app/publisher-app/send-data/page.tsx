
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';

interface DataItem {
  id: string;
  label: string;
  count: number;
}

interface NotificationRecord {
  id: string;
  notification: string;
  person: string;
  device: string;
  result: 'success' | 'error' | 'pending';
}

const staticData: DataItem[] = [];

export default function SendDataPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isSending, setIsSending] = useState(false);

  const pushNotification = (withAlert: boolean) => {
    setIsSending(true);
    setTimeout(() => {
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          notification: withAlert ? 'Envoi avec notifications' : 'Envoi sans notifications',
          person: '—',
          device: '—',
          result: 'pending',
        },
        ...prev,
      ]);
      setIsSending(false);
    }, 600);
  };

  const clearNotifications = () => setNotifications([]);

  const getStatusIcon = (result: NotificationRecord['result']) => {
    if (result === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (result === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <div className="w-3 h-3 rounded-full bg-slate-300" />;
  };

  return (
    <div className="grid min-h-[620px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)]">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-1 flex-col border-2 border-sky-600 shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-semibold">Données en attente d'envoi</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            <div className="border border-sky-600">
              <div className="grid grid-cols-[1fr_auto] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
                <span>Les données</span>
                <span className="text-right">Nombre</span>
              </div>
              {staticData.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] items-center border-b border-sky-400 bg-yellow-200 px-3 py-3 last:border-b-0"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-right font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto space-y-2">
          <Button
            className="flex h-12 w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => pushNotification(true)}
            disabled={isSending}
          >
            <Upload className="h-4 w-4" />
            <Volume2 className="h-4 w-4" />
            Envoyer avec notifications
          </Button>
          <Button
            className="flex h-12 w-full items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => pushNotification(false)}
            disabled={isSending}
          >
            <Upload className="h-4 w-4" />
            <VolumeX className="h-4 w-4" />
            Envoyer sans notifications
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="flex h-12 items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setNotifications((prev) => prev.slice(1))}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Effacer
            </Button>
            <Button
              className="flex h-12 items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={clearNotifications}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Tout effacer
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[3fr_2fr_2fr_auto] border-b-2 border-sky-600 bg-sky-100 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Notification</span>
              <span>Personne</span>
              <span>Appareils</span>
              <span className="text-center">Resultats</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-[380px] items-center justify-center text-sm text-slate-500">
                  Aucun
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[3fr_2fr_2fr_auto] items-center border-b border-sky-200 px-3 py-2 text-sm last:border-b-0"
                  >
                    <span className="truncate text-xs sm:text-sm">{item.notification}</span>
                    <span className="truncate text-xs sm:text-sm">{item.person}</span>
                    <span className="truncate text-xs sm:text-sm">{item.device}</span>
                    <span className="flex justify-center">{getStatusIcon(item.result)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
