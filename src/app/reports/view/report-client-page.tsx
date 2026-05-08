'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  const chartData = [
    { month: 'Janvier', attendance: 95 },
    { month: 'Février', attendance: 102 },
    { month: 'Mars', attendance: 98 },
    { month: 'Avril', attendance: 105 },
    { month: 'Mai', attendance: 110 },
    { month: 'Juin', attendance: 108 },
  ];

  const chartConfig = {
    attendance: {
      label: 'Assistance',
      color: '#2563eb',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rapports et Analyses</h2>
          <p className="text-muted-foreground">
            Visualisez les tendances et les statistiques de l&apos;assemblée.
          </p>
        </div>
        <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter les rapports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistance aux réunions</CardTitle>
          <CardDescription>Assistance moyenne mensuelle (6 derniers mois)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="attendance" fill="#2563eb" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
