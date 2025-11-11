'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Upload } from 'lucide-react';
import { mockTerritories, Territory } from '@/lib/territory-data';
import { usePeople } from '@/context/people-context';
import { TerritoryListTable } from '@/components/territory-list-table';
import { TerritoryMapList } from '@/components/territory-map-list';
import { TerritoryOverallMap } from '@/components/territory-overall-map';
import { TerritoryCampaigns } from '@/components/territory-campaigns';
import TerritorySettings from '@/components/territory-settings';

const COLORS = {
  'Terminé': '#4CAF50',
  'En cours': '#2196F3',
  'Non travaillé': '#9E9E9E',
  'En retard': '#F44336',
  'Attribué': '#FFC107',
  'Non attribué': '#795548',
};

export default function TerritoriesPage() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { people } = usePeople();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentUserId = localStorage.getItem('currentUserId');
    // Allow explicit dev override
    const devAdmin = localStorage.getItem('isAdmin');
    if (devAdmin === '1') {
      setIsAdmin(true);
      return;
    }
    if (!currentUserId) {
      setIsAdmin(false);
      return;
    }
    const me = people.find(p => p.id === currentUserId);
    setIsAdmin(!!me && me.spiritual && me.spiritual.function === 'elder');
  }, [people]);

  const exportTerritories = () => {
    try {
      const dataStr = JSON.stringify(mockTerritories, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `territories-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportSourcesOpen, setExportSourcesOpen] = React.useState(false);
  const [exportFolder, setExportFolder] = React.useState<string | null>(null);

  const importTerritories = () => {
    // open the import menu dialog (see screenshot)
    setImportDialogOpen(true);
  };

  const exportTerritoriesDialog = () => setExportDialogOpen(true);

  const downloadCSV = (rows: any[], filename = 'export.csv') => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
      const v = r[h];
      if (v === undefined || v === null) return '';
      if (v instanceof Date) return v.toISOString();
      return String(v).replace(/"/g, '""');
    }).map(cell => `"${cell}"`).join(','))).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportTerritoriesCSV = () => {
    const rows = mockTerritories.map(t => ({ id: t.id, number: t.number, location: t.location, status: t.status, assignee: t.assignee || '', type: t.type, assignmentDate: t.assignmentDate?.toISOString() || '', completionDate: t.completionDate?.toISOString() || '', notes: t.notes }));
    downloadCSV(rows, `territories-${new Date().toISOString().slice(0,10)}.csv`);
    setExportDialogOpen(false);
    setExportSourcesOpen(false);
  };

  const chooseExportFolder = async () => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const selected = await (window as any).__TAURI__?.dialog?.open({ directory: true });
        if (typeof selected === 'string') {
          setExportFolder(selected);
          alert(`Dossier choisi: ${selected}`);
        } else if (Array.isArray(selected) && selected.length > 0) {
          setExportFolder(selected[0]);
          alert(`Dossier choisi: ${selected[0]}`);
        } else {
          setExportFolder(null);
        }
      } catch (err) {
        console.error('Failed to open folder picker', err);
        alert('Impossible d\'ouvrir le sélecteur de dossier.');
      }
    } else {
      alert('Sélection de dossier non disponible dans le navigateur. Cette fonctionnalité nécessite l\'application de bureau (Tauri).');
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Invalid format: expected array');
      console.log('Imported territories (preview):', parsed.slice(0, 10));
      // TODO: validate shape and merge/apply into app state
      alert(`Import réussi: ${parsed.length} éléments (voir console pour aperçu).`);
    } catch (err: any) {
      console.error('Import failed', err);
      alert('Échec de l\'import: fichier invalide.');
    } finally {
      // reset input so same file can be chosen again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Data Calculations ---
  const stats = React.useMemo(() => {
    const total = mockTerritories.length;
    const assigned = mockTerritories.filter(t => t.status === 'Attribué' || t.status === 'En cours' || t.status === 'En retard').length;
    const unassigned = total - assigned;
    const completed = mockTerritories.filter(t => t.status === 'Terminé').length;
    const inProgress = mockTerritories.filter(t => t.status === 'En cours').length;
    const notWorked = mockTerritories.filter(t => t.status === 'Non travaillé').length;

    const completedTerritories = mockTerritories.filter(t => t.status === 'Terminé' && t.assignmentDate && t.completionDate);
    const avgTimeToComplete = completedTerritories.length > 0
      ? completedTerritories.reduce((acc, t) => {
          const diff = t.completionDate!.getTime() - t.assignmentDate!.getTime();
          return acc + diff;
        }, 0) / completedTerritories.length / (1000 * 60 * 60 * 24)
      : 0;

    const estimatedTotalTime = avgTimeToComplete > 0 ? (avgTimeToComplete * total) / 30 : 0; // In months

    return {
      total,
      assigned,
      unassigned,
      completed,
      inProgress,
      notWorked,
      avgTimeToComplete: Math.round(avgTimeToComplete),
      estimatedTotalTime: estimatedTotalTime.toFixed(1),
    };
  }, []);

  const monthlyData = React.useMemo(() => {
    const data: { [key: string]: { completed: number, assigned: number } } = {};
    mockTerritories.forEach(t => {
      if (t.completionDate) {
        const month = t.completionDate.toISOString().slice(0, 7); // YYYY-MM
        if (!data[month]) data[month] = { completed: 0, assigned: 0 };
        data[month].completed++;
      }
      if (t.assignmentDate) {
        const month = t.assignmentDate.toISOString().slice(0, 7);
        if (!data[month]) data[month] = { completed: 0, assigned: 0 };
        data[month].assigned++;
      }
    });
    return Object.entries(data).map(([month, values]) => ({ month, ...values })).sort((a, b) => a.month.localeCompare(b.month));
  }, []);

  const statusDistribution = React.useMemo(() => {
    const data = mockTerritories.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, []);

  // --- Render --- 
  return (
    <div className="space-y-6 p-4">
  <h1 className="text-3xl font-bold">Territoires</h1>
      <div className="px-2">
        <h2 id="dashboard-title" className="text-2xl font-bold border-b pb-2">Tableau de Bord</h2>
      </div>
      <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
        <TabsTrigger value="list">Liste</TabsTrigger>
        <TabsTrigger value="map-list">Liste & Carte</TabsTrigger>
        <TabsTrigger value="map-overview">Carte d'ensemble</TabsTrigger>
        <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
        {/* Settings will be in the main settings page */}
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4 py-4">
        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Territoires</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attribués</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.assigned}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Attribués</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.unassigned}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps moyen (jours)</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.avgTimeToComplete}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimation (mois)</CardTitle>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.estimatedTotalTime}</div></CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Évolution du travail par mois</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" fill="#8884d8" name="Attribués" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Terminés" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Répartition des statuts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Placeholder for other tabs */}
      <TabsContent value="list">
        <TerritoryListTable />
      </TabsContent>
      <TabsContent value="map-list">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-medium">Liste & Carte</h3>
           <div className="flex items-center gap-2">
               <Button variant="outline" onClick={exportTerritoriesDialog}>
                 <Download className="mr-2 h-4 w-4" />Exporter
               </Button>
               <Button variant="outline" onClick={importTerritories}>
                 <Upload className="mr-2 h-4 w-4" />Importer
               </Button>
               <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
             </div>

            {/* Import Dialog - shows grouped import options similar to provided screenshot */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Importer</DialogTitle>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Format de date</label>
                      <select className="border rounded px-2 py-1 text-sm">
                        <option>MM/dd/yyyy</option>
                        <option>dd/MM/yyyy</option>
                        <option>yyyy-MM-dd</option>
                      </select>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <h4 className="font-semibold mb-2">De CSV file</h4>
                    <div className="space-y-2">
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => fileInputRef.current?.click()}>📄 Territoires</Button>
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Importer: Adresses du territoire - non implémenté')}>📄 Adresses du territoire</Button>
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Importer: Les numéros de téléphone - non implémenté')}>📄 Les numéros de téléphone</Button>
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Importer: Attributions de territoire - non implémenté')}>📄 Attributions de territoire</Button>
                    </div>

                    <h4 className="font-semibold mt-6 mb-2">De Google KML</h4>
                    <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Importer: Google KML - non implémenté')}>G Territoires</Button>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">De Territory Helper / Tools</h4>
                    <div className="space-y-2">
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Territoires - non implémenté')}>📍 Territoires</Button>
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Lieux (Adresses) - non implémenté')}>📍 Lieux (Adresses)</Button>
                      <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Attributions de territoire - non implémenté')}>📍 Attributions de territoire</Button>
                    </div>

                    <h4 className="font-semibold mt-6 mb-2">De Territory Assistant</h4>
                    <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TA Territoires - non implémenté')}>TA Territoires</Button>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Fermer</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Dialog (simple CSV options like screenshot) */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Exporter</DialogTitle>
                    <div />
                  </div>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  <Button className="w-full bg-sky-600 text-white justify-start" onClick={exportTerritoriesCSV}>📄 Territoires</Button>
                  <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Export: Adresses du territoire - non implémenté')}>📄 Adresses du territoire</Button>
                  <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Export: Les numéros de téléphone - non implémenté')}>📄 Les numéros de téléphone</Button>
                  <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Export: Attributions de territoire - non implémenté')}>📄 Attributions de territoire</Button>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Fermer</Button>
                </div>
              </DialogContent>
            </Dialog>

              {/* Export Sources Dialog - mirrors import menu grouping; CSV Territoires button triggers CSV download */}
              <Dialog open={exportSourcesOpen} onOpenChange={setExportSourcesOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>Exporter - Sources</DialogTitle>
                      <div />
                    </div>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <h4 className="font-semibold mb-2">De Territory Helper</h4>
                      <div className="space-y-2">
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Territoires - export non implémenté')}>📍 Territoires</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Lieux (Adresses) - export non implémenté')}>📍 Lieux (Adresses)</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TH Attributions de territoire - export non implémenté')}>📍 Attributions de territoire</Button>
                      </div>

                      <h4 className="font-semibold mt-6 mb-2">De CSV file</h4>
                      <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-sky-600 text-white justify-start" onClick={exportTerritoriesCSV}>📄 Territoires (CSV)</Button>
                            {isAdmin ? (
                              <Button variant="outline" onClick={chooseExportFolder}>📁 Choisir dossier</Button>
                            ) : (
                              <div className="flex items-center text-sm text-muted-foreground">(Admins seulement)</div>
                            )}
                          </div>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('CSV Adresses du territoire - export non implémenté')}>📄 Adresses du territoire</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('CSV Les numéros de téléphone - export non implémenté')}>📄 Les numéros de téléphone</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('CSV Attributions de territoire - export non implémenté')}>📄 Attributions de territoire</Button>
                      </div>

                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">De Territory Assistant / OTM / Alba / Hourglass</h4>
                      <div className="space-y-2">
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('TA Territoires - export non implémenté')}>TA Territoires</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('OTM Territoires - export non implémenté')}>OTM Territoires</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Alba Adresses - export non implémenté')}>Alba Adresses du territoire</Button>
                        <Button className="w-full bg-sky-600 text-white justify-start" onClick={() => alert('Hourglass Territoires - export non implémenté')}>Hourglass Territoires</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={() => setExportSourcesOpen(false)}>Fermer</Button>
                  </div>
                  {exportFolder && <div className="mt-2 text-sm text-muted-foreground">Dossier choisi: {exportFolder}</div>}
                </DialogContent>
              </Dialog>
         </div>
         <TerritoryMapList />
      </TabsContent>
      <TabsContent value="map-overview">
         <TerritoryOverallMap />
      </TabsContent>
      <TabsContent value="campaigns">
         <TerritoryCampaigns />
      </TabsContent>
      <TabsContent value="settings">
         <TerritorySettings />
      </TabsContent>

    </Tabs>
    </div>
  );
}