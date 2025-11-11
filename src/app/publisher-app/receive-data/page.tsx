
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, Download, Square, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DataType = 'Rapport' | 'Assistance' | 'Personnes' | 'Programme';

interface IncomingDataItem {
  id: string;
  type: DataType;
  description: string;
  person: string;
  details: Array<{ label: string; value: string }>;
}

export default function ReceiveDataPage() {
  const { toast } = useToast();
  const [pendingData, setPendingData] = useState<IncomingDataItem[]>([]);
  const [processedData, setProcessedData] = useState<IncomingDataItem[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; person: string; message: string; type: DataType }>>([]);
  const [selectedType, setSelectedType] = useState<DataType | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const typesWithCount = useMemo(() => {
    const grouped = pendingData.reduce<Partial<Record<DataType, number>>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([type, count]) => ({ type: type as DataType, count: count ?? 0 }));
  }, [pendingData]);

  const filteredItems = useMemo(() => {
    if (selectedType === 'all') {
      return pendingData;
    }
    return pendingData.filter((item) => item.type === selectedType);
  }, [pendingData, selectedType]);

  const selectedItem = useMemo(
    () => pendingData.find((item) => item.id === selectedItemId) ?? null,
    [pendingData, selectedItemId]
  );

  const handleSelectType = (type: DataType) => {
    setSelectedType((prev) => (prev === type ? 'all' : type));
    setSelectedItemId(null);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
  };

  const resolveDestination = (type: DataType) => {
    switch (type) {
      case 'Rapport':
        return 'Rapports de prédication';
      case 'Assistance':
        return 'Historique d’assistance';
      case 'Personnes':
        return 'Fiches éditeurs';
      case 'Programme':
        return 'Programme hebdomadaire';
      default:
        return 'Données diverses';
    }
  };

  const handleImport = () => {
    if (!selectedItem) {
      toast({
        title: 'Aucune donnée sélectionnée',
        description: 'Choisissez une information avant de lancer l’importation.',
        variant: 'destructive',
      });
      return;
    }

    setPendingData((prev) => prev.filter((item) => item.id !== selectedItem.id));
    setProcessedData((prev) => [...prev, selectedItem]);
    setNotifications((prev) => [
      {
        id: `${selectedItem.id}-${Date.now()}`,
        person: selectedItem.person,
        message: `Notification envoyée pour la donnée "${selectedItem.description}" (${resolveDestination(selectedItem.type)}).`,
        type: selectedItem.type,
      },
      ...prev,
    ]);

    toast({
      title: 'Importation réussie',
      description: `${selectedItem.description} a été dirigée vers ${resolveDestination(selectedItem.type)}.`,
    });

    setSelectedItemId(null);
  };

  const handleResetSelection = () => {
    setSelectedItemId(null);
    setSelectedType('all');
  };

  const handleClearNotifications = () => setNotifications([]);

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="grid min-h-[700px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,32%)_minmax(0,32%)_minmax(0,36%)]">
      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Données en attente de réception</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[3fr_auto] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Type</span>
              <span className="text-right">Nombre</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {typesWithCount.map(({ type, count }) => (
                <button
                  key={type}
                  className={`grid w-full grid-cols-[3fr_auto] items-center border-b border-sky-200 px-3 py-2 text-left text-sm transition hover:bg-sky-50 ${
                    selectedType === type ? 'bg-sky-100 font-semibold' : ''
                  }`}
                  onClick={() => handleSelectType(type)}
                >
                  <span>{type}</span>
                  <span className="text-right">{count}</span>
                </button>
              ))}
              {typesWithCount.length === 0 && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Aucune donnée en attente
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Détails</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[3fr_2fr] items-center border-b-2 border-sky-600 bg-yellow-200 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Description</span>
              <span>Personne</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`grid w-full grid-cols-[3fr_2fr] items-center border-b border-sky-200 px-3 py-2 text-left text-sm transition hover:bg-sky-50 ${
                    selectedItemId === item.id ? 'bg-sky-100 font-semibold' : ''
                  }`}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <span className="truncate text-xs sm:text-sm">{item.description}</span>
                  <span className="truncate text-xs sm:text-sm">{item.person}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
                  Aucune donnée pour ce type
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Aperçu</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="flex h-[436px] flex-col border border-sky-600 px-4 py-4 text-sm text-slate-700">
            {selectedItem ? (
              <>
                <div className="space-y-1">
                  <p className="text-base font-semibold">{selectedItem.description}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{selectedItem.type}</p>
                  <p className="text-xs text-slate-600">Personne concernée : {selectedItem.person}</p>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  {selectedItem.details.map((detail) => (
                    <div key={detail.label} className="flex justify-between gap-4 border-b border-dashed border-slate-200 pb-1">
                      <dt className="font-medium text-slate-600">{detail.label}</dt>
                      <dd className="text-right text-slate-800">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                <p>Sélectionner une donnée pour afficher son aperçu détaillé.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-full flex flex-wrap justify-center gap-3">
        <Button className="flex h-12 min-w-[110px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleImport}>
          <CheckSquare className="h-4 w-4" />
          Accepter
        </Button>
        <Button className="flex h-12 min-w-[110px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleResetSelection}>
          <Square className="h-4 w-4" />
          Réinitialiser
        </Button>
        <Button className="flex h-12 min-w-[140px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleImport}>
          <Download className="h-4 w-4" />
          Importer
        </Button>
        <Button className="flex h-12 min-w-[140px] items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleClearNotifications} disabled={!notifications.length}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <Card className="col-span-full border-2 border-sky-600 shadow-none">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg font-semibold">Historique des notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="border border-sky-600">
            <div className="grid grid-cols-[2fr_3fr_2fr_auto] border-b-2 border-sky-600 bg-sky-100 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
              <span>Type</span>
              <span>Message</span>
              <span>Personne</span>
              <span className="text-center">Action</span>
            </div>
            <div className="max-h-[220px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">
                  Aucune notification envoyée
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="grid grid-cols-[2fr_3fr_2fr_auto] items-center border-b border-sky-200 px-3 py-2 text-sm last:border-b-0">
                    <span className="uppercase tracking-wide text-xs text-slate-500">{notif.type}</span>
                    <span className="text-xs sm:text-sm">{notif.message}</span>
                    <span className="text-xs sm:text-sm">{notif.person}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notif.id)}>
                      Retirer
                    </Button>
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
