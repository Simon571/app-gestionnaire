import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  Map, 
  BarChart3,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';

// Types pour les rapports
export interface ReportData {
  attendanceByMonth: { month: string; attendance: number; }[];
  territoryProgress: { status: string; count: number; color: string; }[];
  assignmentCoverage: { week: string; covered: number; total: number; }[];
  publisherActivity: { category: string; count: number; }[];
  monthlyTrends: { month: string; territories: number; assignments: number; attendance: number; }[];
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  reportType: 'overview' | 'attendance' | 'territories' | 'assignments' | 'publishers';
  groupBy: 'month' | 'week' | 'quarter';
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  success: '#22C55E',
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#22C55E'];

export function AdvancedReports() {
  const [filters, setFilters] = React.useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1), // Début d'année
    endDate: new Date(),
    reportType: 'overview',
    groupBy: 'month',
  });

  const [reportData, setReportData] = React.useState<ReportData>({
    attendanceByMonth: [
      { month: 'Jan', attendance: 142 },
      { month: 'Fév', attendance: 138 },
      { month: 'Mar', attendance: 145 },
      { month: 'Avr', attendance: 140 },
      { month: 'Mai', attendance: 147 },
      { month: 'Jun', attendance: 144 },
      { month: 'Jul', attendance: 139 },
      { month: 'Aoû', attendance: 143 },
      { month: 'Sep', attendance: 148 },
      { month: 'Oct', attendance: 146 },
      { month: 'Nov', attendance: 149 },
      { month: 'Déc', attendance: 151 },
    ],
    territoryProgress: [
      { status: 'Terminé', count: 23, color: COLORS.success },
      { status: 'En cours', count: 15, color: COLORS.primary },
      { status: 'Non attribué', count: 7, color: COLORS.warning },
      { status: 'En retard', count: 3, color: COLORS.danger },
    ],
    assignmentCoverage: [
      { week: 'S1', covered: 18, total: 20 },
      { week: 'S2', covered: 19, total: 20 },
      { week: 'S3', covered: 20, total: 20 },
      { week: 'S4', covered: 17, total: 20 },
      { week: 'S5', covered: 19, total: 20 },
      { week: 'S6', covered: 20, total: 20 },
    ],
    publisherActivity: [
      { category: 'Proclamateurs actifs', count: 127 },
      { category: 'Proclamateurs irréguliers', count: 18 },
      { category: 'Proclamateurs inactifs', count: 23 },
      { category: 'Pionniers auxiliaires', count: 8 },
      { category: 'Pionniers permanents', count: 3 },
    ],
    monthlyTrends: [
      { month: 'Jan', territories: 20, assignments: 85, attendance: 142 },
      { month: 'Fév', territories: 22, assignments: 88, attendance: 138 },
      { month: 'Mar', territories: 25, assignments: 92, attendance: 145 },
      { month: 'Avr', territories: 23, assignments: 90, attendance: 140 },
      { month: 'Mai', territories: 28, assignments: 95, attendance: 147 },
      { month: 'Jun', territories: 30, assignments: 93, attendance: 144 },
    ],
  });

  // Calculer les statistiques clés
  const calculateStats = () => {
    const totalPublishers = reportData.publisherActivity.reduce((sum, item) => sum + item.count, 0);
    const activePublishers = reportData.publisherActivity.find(item => item.category === 'Proclamateurs actifs')?.count || 0;
    const totalTerritories = reportData.territoryProgress.reduce((sum, item) => sum + item.count, 0);
    const completedTerritories = reportData.territoryProgress.find(item => item.status === 'Terminé')?.count || 0;
    const avgAttendance = reportData.attendanceByMonth.reduce((sum, item) => sum + item.attendance, 0) / reportData.attendanceByMonth.length;
    
    return {
      totalPublishers,
      activePublishers,
      activeRate: Math.round((activePublishers / totalPublishers) * 100),
      totalTerritories,
      completedTerritories,
      completionRate: Math.round((completedTerritories / totalTerritories) * 100),
      avgAttendance: Math.round(avgAttendance),
    };
  };

  const stats = calculateStats();

  // Exporter rapport en PDF/CSV
  const exportReport = (format: 'pdf' | 'csv') => {
    // TODO: Implémenter l'exportation réelle
    console.log(`Exportation en ${format.toUpperCase()}`);
  };

  // Générer rapport personnalisé
  const generateCustomReport = () => {
    // TODO: Implémenter la génération de rapport avec les filtres
    console.log('Génération rapport personnalisé', filters);
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Paramètres du Rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type de rapport</label>
            <Select 
              value={filters.reportType} 
              onValueChange={(value: any) => setFilters({...filters, reportType: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Vue d'ensemble</SelectItem>
                <SelectItem value="attendance">Assistance</SelectItem>
                <SelectItem value="territories">Territoires</SelectItem>
                <SelectItem value="assignments">Assignations</SelectItem>
                <SelectItem value="publishers">Proclamateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Grouper par</label>
            <Select 
              value={filters.groupBy} 
              onValueChange={(value: any) => setFilters({...filters, groupBy: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date de début</label>
            <DatePicker 
              date={filters.startDate}
              setDate={(date) => setFilters({...filters, startDate: date!})}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date de fin</label>
            <DatePicker 
              date={filters.endDate}
              setDate={(date) => setFilters({...filters, endDate: date!})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proclamateurs Totaux</p>
                <p className="text-2xl font-bold">{stats.totalPublishers}</p>
                <p className="text-xs text-green-600">+5 ce mois</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'Activité</p>
                <p className="text-2xl font-bold">{stats.activeRate}%</p>
                <p className="text-xs text-green-600">+2% ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Territoires Terminés</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-blue-600">{stats.completedTerritories}/{stats.totalTerritories}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assistance Moyenne</p>
                <p className="text-2xl font-bold">{stats.avgAttendance}</p>
                <p className="text-xs text-green-600">+3 personnes</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assistance mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle>Assistance aux Réunions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.attendanceByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progression des territoires */}
        <Card>
          <CardHeader>
            <CardTitle>État des Territoires</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.territoryProgress}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.territoryProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Couverture des assignations */}
        <Card>
          <CardHeader>
            <CardTitle>Couverture des Assignations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.assignmentCoverage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="covered" fill={COLORS.success} name="Couvertes" />
                <Bar dataKey="total" fill={COLORS.warning} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activité des proclamateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Proclamateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.publisherActivity} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions d'exportation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter le Rapport
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => exportReport('pdf')} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exporter en PDF
          </Button>
          <Button onClick={() => exportReport('csv')} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter en CSV
          </Button>
          <Button onClick={generateCustomReport} variant="secondary" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Générer Rapport Personnalisé
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}