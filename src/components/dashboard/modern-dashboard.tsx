import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Map, 
  Calendar, 
  BarChart3, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Composant de tableau de bord moderne
export function ModernDashboard() {
  const stats = [
    {
      title: "Proclamateurs Actifs",
      value: "147",
      change: "+5 ce mois",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Territoires Terminés",
      value: "23/45",
      change: "51%",
      trend: "up",
      icon: Map,
      color: "text-green-600"
    },
    {
      title: "Réunions ce Mois",
      value: "12",
      change: "100% présence",
      trend: "stable",
      icon: Calendar,
      color: "text-purple-600"
    },
    {
      title: "Assignations",
      value: "89%",
      change: "Couvertes",
      trend: "up",
      icon: BarChart3,
      color: "text-orange-600"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "assignment",
      message: "Frère Martin assigné au discours du 15 décembre",
      time: "Il y a 5 min",
      icon: CheckCircle2,
      color: "text-green-600"
    },
    {
      id: 2,
      type: "territory",
      message: "Territoire T-042 marqué comme terminé",
      time: "Il y a 1h",
      icon: Map,
      color: "text-blue-600"
    },
    {
      id: 3,
      type: "alert",
      message: "5 assignations en attente pour la semaine prochaine",
      time: "Il y a 2h",
      icon: AlertCircle,
      color: "text-amber-600"
    }
  ];

  return (
    <div className="grid gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités Récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activités Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 ${activity.color} mt-0.5`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Progression Mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progression du Mois
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Territoires Terminés</span>
                <span>23/45</span>
              </div>
              <Progress value={51} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Assignations Couvertes</span>
                <span>89/100</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Présence aux Réunions</span>
                <span>95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Ajouter Personne</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Programmer Réunion</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Map className="h-6 w-6" />
              <span className="text-sm">Assigner Territoire</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Voir Rapports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}