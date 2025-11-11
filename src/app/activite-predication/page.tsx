
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
  participated: boolean;
  studies: number | null;
  isAuxiliary: boolean;
  hours: number | null;
  credit: number | null;
  isLate: boolean;
  remarks: string | null;
  pioneerStatus?: 'aux-permanent' | 'permanent' | 'special' | 'missionary' | null;
};

const getProductionData = (monthKey: string, people: Person[]) => {
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

    const publisherReports: PublisherReport[] = people
        .filter(p => p.spiritual.function) // Include anyone with a spiritual function
        .map(p => {
            const activity = p.activity?.find(a => a.month === monthKey);
            return {
                id: p.id,
                lastName: p.lastName,
                firstName: p.firstName,
                participated: activity?.participated ?? false,
                studies: activity?.bibleStudies ?? null,
                isAuxiliary: activity?.isAuxiliaryPioneer ?? false,
                hours: activity?.hours ?? null,
                credit: activity?.credit ?? null,
                isLate: activity?.isLate ?? false,
                remarks: activity?.remarks ?? null,
                pioneerStatus: p.spiritual.pioneer.status,
            };
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
  const [status, setStatus] = React.useState<'sent' | 'not_sent'>('not_sent');
  const [publisherFilter, setPublisherFilter] = React.useState('all');
  const [selectedGroup, setSelectedGroup] = React.useState('all-groups');
  const { toast } = useToast();

  React.useEffect(() => {
    setReportData(getProductionData(selectedMonth, people));
    setStatus('not_sent');
  }, [selectedMonth, people]);

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

  const handleSendReport = () => {
      setStatus('sent');
      toast({
          title: "Rapport envoyé",
          description: `Le rapport pour ${selectedMonthLabel} a été marqué comme envoyé.`
      });
  }

  const handleCancelSend = () => {
      setStatus('not_sent');
      toast({
          title: "Envoi annulé",
          description: `Le rapport pour ${selectedMonthLabel} a été marqué comme non envoyé.`,
          variant: "destructive"
      });
  }

  const handlePrint = () => {
    window.print();
  }

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
                                    <p className="text-green-600 font-semibold">Envoyé</p>
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
                                    <TableCell><Checkbox checked={report.participated} /></TableCell>
                                    <TableCell>{report.studies}</TableCell>
                                    <TableCell><Checkbox checked={report.isAuxiliary} /></TableCell>
                                    <TableCell>{report.hours !== null ? report.hours.toFixed(0) : ''}</TableCell>
                                    <TableCell>{report.credit}</TableCell>
                                    <TableCell><Checkbox checked={report.isLate} /></TableCell>
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
