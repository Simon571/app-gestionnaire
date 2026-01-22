
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Printer, HelpCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePeople } from '@/context/people-context';
import type { Person } from '@/app/personnes/page';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api-client';

const generateMonths = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
      label: date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
    });
  }
  return months;
};

type PublisherReport = {
  id: string;
  lastName: string;
  firstName: string;
    status?: 'received' | 'validated';
  participated: boolean;
  studies: number | null;
  isAuxiliary: boolean;
  hours: number | null;
  credit: number | null;
  isLate: boolean;
  remarks: string | null;
  pioneerStatus?: 'aux-permanent' | 'permanent' | 'special' | 'missionary' | null;
};

type IncomingReportLite = {
    status?: 'received' | 'validated';
    totals?: { hours?: number; bibleStudies?: number; credit?: number };
    didPreach?: boolean;
    isLate?: boolean;
};

type MonthSubmission = {
    month: string;
    sentAt: string;
    lateUserIds: string[];
};

const getProductionData = (
        monthKey: string,
        people: Person[],
        incoming: Record<string, IncomingReportLite> = {},
) => {
    const reportData = {
        publishers: { reports: 0, studies: 0, hours: null },
        auxiliary_pioneers: { reports: 0, studies: 0, hours: 0 },
        permanent_pioneers: { reports: 0, studies: 0, hours: 0 },
        special_pioneers: { reports: 0, studies: 0, hours: 0 },
        missionaries: { reports: 0, studies: 0, hours: 0 },
        direct_reports: { reports: 0, studies: 0, hours: 0 },
        weekend_attendance: 0,
        publisherReports: [] as PublisherReport[],
    };

        const publisherReports: PublisherReport[] = people.map(p => {
                const activity = p.activity?.find(a => a.month === monthKey);
                const incomingData = incoming[`${p.id}_${monthKey}`];
                const useIncoming = !!incomingData; // affiche les chiffres dès réception, et a fortiori après validation

                const hours = useIncoming
                    ? incomingData?.totals?.hours ?? 0
                    : activity?.hours ?? null;
                const bibleStudies = useIncoming
                    ? incomingData?.totals?.bibleStudies ?? 0
                    : activity?.bibleStudies ?? null;
                const credit = useIncoming ? incomingData?.totals?.credit ?? 0 : activity?.credit ?? null;
                const participated = useIncoming
                    ? (incomingData?.didPreach ?? ((hours !== null && hours > 0) || (bibleStudies !== null && bibleStudies > 0)))
                    : activity?.participated ?? false;

                return {
                        id: p.id,
                        lastName: p.lastName,
                        firstName: p.firstName,
                        status: incomingData?.status,
                        participated,
                        studies: bibleStudies,
                        isAuxiliary: activity?.isAuxiliaryPioneer ?? false,
                        hours,
                        credit,
                        isLate: activity?.isLate ?? false,
                        remarks: activity?.remarks ?? null,
                        pioneerStatus: p.spiritual.pioneer.status,
                };
            }).sort((a, b) => {
                const ln = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
                if (ln !== 0) return ln;
                return a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
            });

    publisherReports.forEach(report => {
        if (report.participated) {
            let category: keyof typeof reportData | null = null;

            if (report.pioneerStatus === 'permanent') {
                category = 'permanent_pioneers';
            } else if (report.pioneerStatus === 'special') {
                category = 'special_pioneers';
            } else if (report.pioneerStatus === 'missionary') {
                category = 'missionaries';
            } 
            else if (report.isAuxiliary || (report.hours !== null && report.hours > 0)) {
                category = 'auxiliary_pioneers';
            }
            else {
                category = 'publishers';
            }

            if (category) {
                reportData[category].reports++;
                if (report.studies) {
                    reportData[category].studies += report.studies;
                }
                if (report.hours && reportData[category].hours !== null) {
                    (reportData[category].hours as number) += report.hours;
                }
            }
        }
    });
    
    reportData.publisherReports = publisherReports;
    return reportData;
};

type ReportData = ReturnType<typeof getProductionData>;
type ReportDataKey = keyof Omit<ReportData, 'weekend_attendance' | 'publisherReports'>;

const reportRows: {key: ReportDataKey, label: string}[] = [
  { key: 'publishers', label: 'Proclamateurs' },
  { key: 'auxiliary_pioneers', label: 'Pionniers auxiliaires' },
  { key: 'permanent_pioneers', label: 'Pionniers permanents' },
  { key: 'special_pioneers', label: 'Pionniers spéciaux' },
  { key: 'missionaries', label: 'Missionnaires affectés dans le territoire' },
  { key: 'direct_reports', label: 'Rapports envoyés directement à la filiale' },
];

export default function PreachingActivityPage() {
  const { people, preachingGroups, isLoaded } = usePeople();
  const months = React.useMemo(() => generateMonths(), []);
  const [selectedMonth, setSelectedMonth] = React.useState(months[0].key);
  const [activeTab, setActiveTab] = React.useState('assembly');
    const [reportData, setReportData] = React.useState<ReportData>(() => getProductionData(selectedMonth, people));
    const [incomingReports, setIncomingReports] = React.useState<Record<string, IncomingReportLite>>({});
  const [status, setStatus] = React.useState<'sent' | 'not_sent'>('not_sent');
  const [publisherFilter, setPublisherFilter] = React.useState('all');
  const [selectedGroup, setSelectedGroup] = React.useState('all-groups');
  const [monthSubmissions, setMonthSubmissions] = React.useState<MonthSubmission[]>([]);
  const { toast } = useToast();

  // Determine if current month was already sent
  const currentMonthSubmission = React.useMemo(() => {
    return monthSubmissions.find(s => s.month === selectedMonth);
  }, [monthSubmissions, selectedMonth]);

  React.useEffect(() => {
        setReportData(getProductionData(selectedMonth, people, incomingReports));
        setStatus(currentMonthSubmission ? 'sent' : 'not_sent');
    }, [selectedMonth, people, incomingReports, currentMonthSubmission]);

    // Charge les rapports reçus/validés pour afficher des badges et totaux issus de l'app mobile.
    React.useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await apiFetch('api/publisher-app/activity');
                if (!res.ok) return;
                const data = await res.json();
                if (!data?.reports) return;
                const map: Record<string, IncomingReportLite> = {};
                for (const r of data.reports as any[]) {
                    if (r.userId && r.month) {
                        map[`${r.userId}_${r.month}`] = {
                            status: r.status,
                            totals: r.totals,
                            didPreach: r.didPreach,
                        };
                    }
                }
                setIncomingReports(map);
            } catch (err) {
                console.error('Failed to load preaching activity statuses', err);
            }
        };
        fetchReports();
    }, []);

    // Charge les soumissions de mois (envoyé à la filiale)
    React.useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await apiFetch('api/publisher-app/activity/submit-to-branch');
                if (!res.ok) return;
                const data = await res.json();
                if (data?.submissions) {
                    setMonthSubmissions(data.submissions);
                }
            } catch (err) {
                console.error('Failed to load month submissions', err);
            }
        };
        fetchSubmissions();
    }, []);

  const filteredPublisherReports = React.useMemo(() => {
    return reportData.publisherReports.filter(report => {
      const person = people.find(p => p.id === report.id);
      if (!person) return false;

      const groupMatch = selectedGroup === 'all-groups' || person.spiritual.group === selectedGroup;
      if (!groupMatch) return false;

      switch (publisherFilter) {
        case 'all':
          return true;
        case 'missing_report':
          return !report.participated;
        case 'elders':
          return person.spiritual.function === 'elder';
        case 'servants':
          return person.spiritual.function === 'servant';
        case 'publishers':
          return person.spiritual.function === 'publisher';
        case 'unbaptized_publishers':
          return person.spiritual.function === 'unbaptized';
        case 'auxiliary_pioneers':
          return report.isAuxiliary;
        case 'permanent_pioneers':
          return person.spiritual.pioneer.status === 'permanent';
        case 'special_pioneers':
          return person.spiritual.pioneer.status === 'special';
        case 'missionaries':
          return person.spiritual.pioneer.status === 'missionary';
        default:
          return true;
      }
    });
  }, [reportData.publisherReports, publisherFilter, people, selectedGroup]);


  const totals = React.useMemo(() => {
    return reportRows.reduce(
      (acc, row) => {
        const item = reportData[row.key];
        acc.reports += item.reports;
        acc.studies += item.studies;
        if (item.hours !== null) {
          acc.hours = (acc.hours ?? 0) + item.hours;
        }
        return acc;
      },
      { reports: 0, studies: 0, hours: 0 }
    );
  }, [reportData]);
  
  const summary = React.useMemo(() => {
      return {
          active_publishers: totals.reports,
          irregular_publishers: 0,
          inactive_publishers: 0,
          new_inactive: 0,
          reactivated_publishers: 0,
      }
  }, [totals.reports]);

  const selectedMonthLabel = months.find(m => m.key === selectedMonth)?.label;

  const handleSendReport = async () => {
      // Find users who haven't submitted a report (no status or not validated/received)
      const lateUserIds = reportData.publisherReports
          .filter(r => !r.participated && !incomingReports[`${r.id}_${selectedMonth}`]?.status)
          .map(r => r.id);
      
      try {
          const res = await apiFetch('api/publisher-app/activity/submit-to-branch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ month: selectedMonth, lateUserIds }),
          });
          
          if (!res.ok) throw new Error('submit failed');
          
          const data = await res.json();
          
          // Update submissions state
          setMonthSubmissions(prev => {
              const filtered = prev.filter(s => s.month !== selectedMonth);
              return [...filtered, data.submission];
          });
          
          // Update incoming reports to mark late users
          setIncomingReports(prev => {
              const updated = { ...prev };
              for (const userId of lateUserIds) {
                  const key = `${userId}_${selectedMonth}`;
                  updated[key] = { ...updated[key], isLate: true };
              }
              return updated;
          });
          
          setStatus('sent');
          toast({
              title: "Rapport envoyé à la filiale",
              description: `Le rapport pour ${selectedMonthLabel} a été envoyé. ${lateUserIds.length} proclamateur(s) marqué(s) en retard.`
          });
      } catch (err) {
          console.error(err);
          toast({
              title: "Erreur",
              description: "Impossible d'envoyer le rapport à la filiale.",
              variant: "destructive"
          });
      }
  }

  const handleCancelSend = async () => {
      try {
          const res = await apiFetch('api/publisher-app/activity/submit-to-branch', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ month: selectedMonth }),
          });
          
          if (!res.ok) throw new Error('cancel failed');
          
          // Get the submission to restore late flags
          const submission = monthSubmissions.find(s => s.month === selectedMonth);
          
          // Update submissions state
          setMonthSubmissions(prev => prev.filter(s => s.month !== selectedMonth));
          
          // Remove late flags from incoming reports
          if (submission) {
              setIncomingReports(prev => {
                  const updated = { ...prev };
                  for (const userId of submission.lateUserIds) {
                      const key = `${userId}_${selectedMonth}`;
                      if (updated[key]) {
                          updated[key] = { ...updated[key], isLate: false };
                      }
                  }
                  return updated;
              });
          }
          
          setStatus('not_sent');
          toast({
              title: "Envoi annulé",
              description: `Le rapport pour ${selectedMonthLabel} a été marqué comme non envoyé.`,
              variant: "destructive"
          });
      } catch (err) {
          console.error(err);
          toast({
              title: "Erreur",
              description: "Impossible d'annuler l'envoi.",
              variant: "destructive"
          });
      }
  }

  const handlePrint = () => {
    window.print();
  }

    const handleValidateReport = async (userId: string) => {
        try {
            const res = await apiFetch('api/publisher-app/activity', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, month: selectedMonth, status: 'validated' }),
            });
            if (!res.ok) throw new Error('validate');
            const data = await res.json().catch(() => null);
            const totals = data?.report?.totals ?? incomingReports[`${userId}_${selectedMonth}`]?.totals;
            setIncomingReports((prev) => ({
                ...prev,
                [`${userId}_${selectedMonth}`]: {
                    ...(prev[`${userId}_${selectedMonth}`] ?? {}),
                    status: 'validated',
                    totals,
                    didPreach: true,
                },
            }));
            toast({ 
                title: 'Rapport validé', 
                description: 'Le rapport est maintenant marqué comme validé et synchronisé dans la page Personnes.' 
            });
        } catch (err) {
            console.error(err);
            toast({ title: 'Validation impossible', description: 'Réessayez ou vérifiez la connexion.', variant: 'destructive' });
        }
    };

    const handleValidateAll = async () => {
        const pendingIds = filteredPublisherReports
            .filter((r) => incomingReports[`${r.id}_${selectedMonth}`]?.status === 'received')
            .map((r) => r.id);
        if (!pendingIds.length) {
            toast({ title: 'Rien à valider', description: 'Aucun rapport reçu en attente pour ce mois.' });
            return;
        }
        try {
            await Promise.all(
                pendingIds.map(async (id) => {
                    const res = await apiFetch('api/publisher-app/activity', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: id, month: selectedMonth, status: 'validated' }),
                    });
                    if (!res.ok) throw new Error('validate-all');
                    const data = await res.json().catch(() => null);
                    const totals = data?.report?.totals;
                    setIncomingReports((prev) => ({
                        ...prev,
                        [`${id}_${selectedMonth}`]: {
                            ...(prev[`${id}_${selectedMonth}`] ?? {}),
                            status: 'validated',
                            totals,
                            didPreach: true,
                        },
                    }));
                })
            );
            toast({ title: 'Validation groupée', description: `${pendingIds.length} rapport(s) validé(s).` });
        } catch (err) {
            console.error(err);
            toast({ title: 'Validation groupée impossible', description: 'Réessayez ou vérifiez la connexion.', variant: 'destructive' });
        }
    };

  if (!isLoaded) {
    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-lg text-muted-foreground">Chargement des données...</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <div className="md:col-span-1 no-print">
        <Card>
          <ScrollArea className="h-[70vh]">
            <div className="p-2">
              {months.map((month) => (
                <Button
                  key={month.key}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-sm',
                    selectedMonth === month.key && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => setSelectedMonth(month.key)}
                >
                  {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <div className="md:col-span-3">
         <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="assembly">
            <div className="flex justify-between items-start no-print">
                 <TabsList>
                    <TabsTrigger value="assembly">Assemblée</TabsTrigger>
                    <TabsTrigger value="jw_org">JW.ORG (S-1)</TabsTrigger>
                    <TabsTrigger value="publishers">Proclamateurs</TabsTrigger>
                </TabsList>
                 <div className="flex items-center gap-2">
                                        {activeTab === 'publishers' && (
                                            <Button size="sm" variant="secondary" onClick={handleValidateAll}>
                                                Valider tous les reçus
                                            </Button>
                                        )}
                    <Button variant="ghost" size="icon" onClick={handlePrint}>
                    <Printer className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            <TabsContent value="assembly">
                <Card className="mt-4 printable-area">
                    <CardHeader className="no-print">
                        <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Activité de prédication de l'assemblée
                        </p>
                        <CardTitle className="text-2xl capitalize">
                            {selectedMonthLabel}
                        </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="print-only hidden my-4">
                            <h2 className="text-xl font-bold text-center">Activité de prédication de l'assemblée</h2>
                            <h3 className="text-lg text-center capitalize">{selectedMonthLabel}</h3>
                        </div>
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="w-2/5">Type</TableHead>
                            <TableHead className="text-right">Nombre de rap</TableHead>
                            <TableHead className="text-right">Cours bibliques</TableHead>
                            <TableHead className="text-right">Heures</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportRows.map((row) => (
                            <TableRow key={row.key}>
                                <TableCell className="font-medium">{row.label}</TableCell>
                                <TableCell className="text-right">{reportData[row.key].reports}</TableCell>
                                <TableCell className="text-right">{reportData[row.key].studies}</TableCell>
                                <TableCell className="text-right">
                                {reportData[row.key].hours ?? '—'}
                                </TableCell>
                            </TableRow>
                            ))}
                            <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">{totals.reports}</TableCell>
                            <TableCell className="text-right">{totals.studies}</TableCell>
                            <TableCell className="text-right">{totals.hours}</TableCell>
                            </TableRow>
                        </TableBody>
                        </Table>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 no-print">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Proclamateurs actifs</span>
                                    <span>{summary.active_publishers}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Proclamateurs irréguliers</span>
                                    <span>{summary.irregular_publishers}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Proclamateurs inactifs</span>
                                    <span>{summary.inactive_publishers}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Nouveaux proclamateurs inactifs</span>
                                    <span>{summary.new_inactive}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Proclamateurs réactivés</span>
                                    <span>{summary.reactivated_publishers}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-end md:items-end mt-6 md:mt-0">
                                {status === 'not_sent' ? (
                                    <>
                                        <p className="text-destructive font-semibold mb-2">Non envoyé</p>
                                        <Button onClick={handleSendReport}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Envoyé à la filiale
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-green-600 font-semibold">Envoyé</p>
                                        <Button variant="link" className="text-destructive hover:text-destructive p-0 h-auto" onClick={handleCancelSend}>
                                            Annuler l'envoi
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="jw_org" className="printable-area">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-2xl capitalize text-primary">
                             {selectedMonthLabel}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Card>
                            <CardContent className="p-4 space-y-2">
                                <h3 className="font-bold text-primary">Proclamateurs actifs</h3>
                                <p className="text-xs text-muted-foreground">Compte de tous les membres de l'assemblée ayant remis un rapport au moins une fois au cours des 6 derniers mois.</p>
                                <p className="text-2xl font-bold">{summary.active_publishers}</p>
                                <hr className="my-2"/>
                                <h3 className="font-bold text-primary">Assistance moyenne aux réunions le week-end</h3>
                                <p className="text-2xl font-bold">{reportData.weekend_attendance}</p>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Proclamateurs</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nombre de rap</span><span className="font-semibold">{reportData.publishers.reports}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cours bibliques</span><span className="font-semibold">{reportData.publishers.studies}</span></div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-lg">Pionniers auxiliaires</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nombre de rap</span><span className="font-semibold">{reportData.auxiliary_pioneers.reports}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Heures</span><span className="font-semibold">{reportData.auxiliary_pioneers.hours}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cours bibliques</span><span className="font-semibold">{reportData.auxiliary_pioneers.studies}</span></div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="text-lg">Pionniers permanents</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nombre de rap</span><span className="font-semibold">{reportData.permanent_pioneers.reports}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Heures</span><span className="font-semibold">{reportData.permanent_pioneers.hours}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cours bibliques</span><span className="font-semibold">{reportData.permanent_pioneers.studies}</span></div>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="flex justify-end pt-4 no-print">
                                {status === 'sent' ? (
                                     <div className="text-right">
                                        <p className="text-green-600 font-semibold">Envoyé</p>
                                        <Button variant="link" className="text-destructive hover:text-destructive p-0 h-auto" onClick={handleCancelSend}>
                                            Annuler l'envoi
                                        </Button>
                                    </div>
                                ) : (
                                    <Button onClick={handleSendReport}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Envoyé à la filiale
                                    </Button>
                                )}
                            </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="publishers" className="printable-area">
                 <Card className="mt-4">
                     <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Rapports des proclamateurs
                                </p>
                                <CardTitle className="text-2xl capitalize">
                                    {selectedMonthLabel}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Tous les groupes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all-groups">Tous les groupes</SelectItem>
                                        {preachingGroups.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <Select value={publisherFilter} onValueChange={setPublisherFilter}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Tous" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="missing_report">Rapport manquant</SelectItem>
                                        <SelectItem value="elders">Anciens</SelectItem>
                                        <SelectItem value="servants">Assistants</SelectItem>
                                        <SelectItem value="publishers">Proclamateurs</SelectItem>
                                        <SelectItem value="unbaptized_publishers">Proclamateurs non baptisés</SelectItem>
                                        <SelectItem value="auxiliary_pioneers">Pionniers auxiliaires</SelectItem>
                                        <SelectItem value="permanent_pioneers">Pionniers permanents</SelectItem>
                                        <SelectItem value="special_pioneers">Pionniers spéciaux</SelectItem>
                                        <SelectItem value="missionaries">Missionnaires affectés dans le territoire</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="include-inactives" />
                                    <label
                                        htmlFor="include-inactives"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Inclure les inactifs
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom de famille</TableHead>
                                    <TableHead>Prénom</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>A participé</TableHead>
                                    <TableHead>Cours bibl.</TableHead>
                                    <TableHead>Pion. aux.</TableHead>
                                    <TableHead>Heures</TableHead>
                                    <TableHead>Crédit</TableHead>
                                    <TableHead>En retard</TableHead>
                                    <TableHead>Remarques</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPublisherReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.lastName}</TableCell>
                                    <TableCell>{report.firstName}</TableCell>
                                    <TableCell className="space-y-1">
                                        {report.status === 'validated' && (
                                            <Badge className="bg-green-600 text-white">Validé</Badge>
                                        )}
                                        {report.status === 'received' && (
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-amber-500 text-white">Reçu</Badge>
                                                <Button size="sm" variant="secondary" onClick={() => handleValidateReport(report.id)}>
                                                    Valider
                                                </Button>
                                            </div>
                                        )}
                                        {!report.status && (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell><Checkbox checked={report.participated} /></TableCell>
                                    <TableCell>{report.studies}</TableCell>
                                    <TableCell><Checkbox checked={report.isAuxiliary} /></TableCell>
                                    <TableCell>{report.hours !== null ? report.hours.toFixed(0) : ''}</TableCell>
                                    <TableCell>{report.credit}</TableCell>
                                    <TableCell><Checkbox checked={report.isLate || incomingReports[`${report.id}_${selectedMonth}`]?.isLate} /></TableCell>
                                    <TableCell>{report.remarks}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}









