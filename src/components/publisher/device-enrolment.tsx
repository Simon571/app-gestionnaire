'use client';

/**
 * Enrolement des telephones, appareil par appareil.
 *
 * Remplace l'usage de l'identite partagee `mobile-main` : chaque telephone
 * recoit sa propre cle, visible **une seule fois** a l'enrolement, et revocable
 * seule si l'appareil est perdu.
 */
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Smartphone, Trash2 } from 'lucide-react';

interface MobileDevice {
  id: string;
  label: string;
  status: string;
  lastRotatedAt?: string | null;
}

export function MobileDeviceEnrolment() {
  const [devices, setDevices] = React.useState<MobileDevice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [label, setLabel] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [issued, setIssued] = React.useState<{ id: string; apiKey: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/publisher-app/mobile-devices', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      setDevices(Array.isArray(data.devices) ? data.devices : []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const enrol = async () => {
    if (!label.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/publisher-app/mobile-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Enrôlement refusé.");
        return;
      }
      setIssued({ id: data.device?.id ?? '', apiKey: data.apiKey ?? '' });
      setLabel('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Révoquer cet appareil ? Le téléphone ne pourra plus se synchroniser.")) return;
    setBusy(true);
    try {
      await fetch(`/api/publisher-app/mobile-devices?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Nom du proclamateur ou du téléphone"
          className="max-w-xs"
          disabled={busy}
        />
        <Button size="sm" onClick={enrol} disabled={busy || !label.trim()}>
          <Smartphone className="mr-2 h-4 w-4" /> Enrôler
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {issued && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">
            Clé de l’appareil — elle ne sera plus affichée
          </p>
          <p className="text-amber-800">
            À saisir maintenant sur le téléphone. Le serveur n’en conserve qu’une
            empreinte : si elle est perdue, il faut enrôler l’appareil à nouveau.
          </p>
          <code className="block break-all rounded bg-white px-2 py-1 font-mono text-xs">
            {issued.apiKey}
          </code>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-800">Identifiant : {issued.id}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard?.writeText(issued.apiKey)}
            >
              <Copy className="mr-2 h-3 w-3" /> Copier
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIssued(null)}>
              J’ai noté
            </Button>
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">Chargement…</p>}

      {!loading && devices.length === 0 && (
        <p className="text-sm text-slate-500">
          Aucun appareil enrôlé. Tant qu’aucun ne l’est, les téléphones utilisent
          la clé partagée livrée avec l’application.
        </p>
      )}

      {!loading && devices.length > 0 && (
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-2 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-sm"
            >
              <span className="font-medium">{device.label}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    device.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {device.status === 'active' ? 'Actif' : 'Révoqué'}
                </span>
                {device.status === 'active' && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => revoke(device.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MobileDeviceEnrolment;
