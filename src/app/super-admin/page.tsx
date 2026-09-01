'use client';

/**
 * Console d'administration de la plateforme : liste des assemblees, etat de leur
 * abonnement et actions de gestion (creation, renouvellement, suspension,
 * regeneration du PIN).
 *
 * Toutes les operations passent par /api/super-admin/*, protege par le
 * middleware et re-verifie dans chaque handler. Un 401 renvoie vers la page de
 * connexion.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KeyRound, Loader2, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { getApiBase } from '@/lib/api-base';
import type { AssemblySummary } from '@/lib/tenants/assembly-registry';
import type { SubscriptionPlan } from '@/lib/tenants/subscription';

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: 'Essai',
  monthly: 'Mensuel',
  yearly: 'Annuel',
};

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trial: { label: 'Essai', variant: 'secondary' },
  active: { label: 'Actif', variant: 'default' },
  expired: { label: 'Expire — lecture seule', variant: 'outline' },
  suspended: { label: 'Suspendu', variant: 'destructive' },
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Sans echeance';
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed)
    ? '—'
    : new Date(parsed).toLocaleDateString('fr-FR', { dateStyle: 'medium' });
}

export default function SuperAdminConsolePage() {
  const router = useRouter();
  const [assemblies, setAssemblies] = useState<AssemblySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // PIN affiche une seule fois apres creation ou rotation : il n'est stocke
  // que sous forme de hash et ne pourra pas etre relu.
  const [revealedPin, setRevealedPin] = useState<{ name: string; id: string; pin: string } | null>(
    null
  );

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState<SubscriptionPlan>('trial');
  const [isCreating, setIsCreating] = useState(false);

  const call = useCallback(
    async (path: string, init?: RequestInit) => {
      const response = await fetch(`${getApiBase()}/api/super-admin${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });

      if (response.status === 401) {
        router.push('/super-admin/login');
        throw new Error('Session expiree');
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);
      return data;
    },
    [router]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await call('/assemblies');
      setAssemblies(data.assemblies ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [call]);

  useEffect(() => {
    void load();
  }, [load]);

  async function withBusy(id: string, task: () => Promise<void>) {
    setBusyId(id);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      const data = await call('/assemblies', {
        method: 'POST',
        body: JSON.stringify({ name: newName, contactEmail: newEmail, plan: newPlan }),
      });
      setRevealedPin({ name: data.assembly.name, id: data.assembly.id, pin: data.pin });
      setNewName('');
      setNewEmail('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  }

  const renew = (assembly: AssemblySummary, plan: SubscriptionPlan) =>
    withBusy(assembly.id, async () => {
      await call(`/assemblies/${assembly.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'renew', plan }),
      });
      await load();
    });

  const toggleSuspension = (assembly: AssemblySummary) =>
    withBusy(assembly.id, async () => {
      await call(`/assemblies/${assembly.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: assembly.subscription.status === 'suspended' ? 'reactivate' : 'suspend',
        }),
      });
      await load();
    });

  const regeneratePin = (assembly: AssemblySummary) =>
    withBusy(assembly.id, async () => {
      const data = await call(`/assemblies/${assembly.id}/pin`, { method: 'POST' });
      setRevealedPin({ name: assembly.name, id: assembly.id, pin: data.pin });
    });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-700">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Plateforme</span>
          </div>
          <h1 className="text-2xl font-bold">Assemblees et abonnements</h1>
          <p className="text-sm text-muted-foreground">
            {assemblies.length} assemblee{assemblies.length > 1 ? 's' : ''} enregistree
            {assemblies.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {revealedPin && (
        <Alert>
          <KeyRound className="h-4 w-4" />
          <AlertTitle>PIN de {revealedPin.name}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Identifiant <code className="font-semibold">{revealedPin.id}</code> — PIN{' '}
              <code className="text-lg font-bold tracking-widest">{revealedPin.pin}</code>
            </p>
            <p className="text-xs">
              Ce PIN ne sera plus affiche : il est conserve uniquement sous forme de hash.
              Transmettez-le maintenant, puis regenerez-le s&apos;il est perdu.
            </p>
            <Button size="sm" variant="outline" onClick={() => setRevealedPin(null)}>
              J&apos;ai note le PIN
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nouvelle assemblee</CardTitle>
          <CardDescription>
            Le PIN administrateur est genere automatiquement et affiche une seule fois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;assemblee</Label>
              <Input
                id="name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ex : Kinshasa Yolo Est"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Email de contact</Label>
              <Input
                id="contact"
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="ancien@example.org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Formule</Label>
              <Select value={newPlan} onValueChange={(value) => setNewPlan(value as SubscriptionPlan)}>
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLAN_LABELS) as SubscriptionPlan[]).map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {PLAN_LABELS[plan]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Creer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parc des assemblees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && assemblies.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement du registre…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assemblee</TableHead>
                  <TableHead>Identifiant</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Echeance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assemblies.map((assembly) => {
                  const status = STATUS_STYLES[assembly.state.status] ?? {
                    label: assembly.state.status,
                    variant: 'outline' as const,
                  };
                  const days = assembly.state.daysRemaining;
                  const busy = busyId === assembly.id;

                  return (
                    <TableRow key={assembly.id}>
                      <TableCell>
                        <div className="font-medium">{assembly.name}</div>
                        {assembly.contactEmail && (
                          <div className="text-xs text-muted-foreground">
                            {assembly.contactEmail}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{assembly.id}</code>
                      </TableCell>
                      <TableCell>{PLAN_LABELS[assembly.subscription.plan]}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{formatDate(assembly.subscription.expiresAt)}</div>
                        {days !== null && (
                          <div
                            className={`text-xs ${
                              days < 0
                                ? 'text-destructive'
                                : assembly.state.expiringSoon
                                  ? 'text-amber-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {days < 0 ? `Expire depuis ${-days} j` : `${days} j restants`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void renew(assembly, 'monthly')}
                        >
                          +1 mois
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void renew(assembly, 'yearly')}
                        >
                          +1 an
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            assembly.subscription.status === 'suspended' ? 'default' : 'destructive'
                          }
                          disabled={busy}
                          onClick={() => void toggleSuspension(assembly)}
                        >
                          {assembly.subscription.status === 'suspended' ? 'Reactiver' : 'Suspendre'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void regeneratePin(assembly)}
                        >
                          Nouveau PIN
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

