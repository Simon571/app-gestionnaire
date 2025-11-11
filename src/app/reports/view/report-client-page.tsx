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
import { useTranslations } from 'next-intl';

export default function ReportsPage() {
  const t = useTranslations('ReportsPage');

  const chartData = [
    { month: t('months.january'), attendance: 95 },
    { month: t('months.february'), attendance: 102 },
    { month: t('months.march'), attendance: 98 },
    { month: t('months.april'), attendance: 105 },
    { month: t('months.may'), attendance: 110 },
    { month: t('months.june'), attendance: 108 },
  ];

  const chartConfig = {
    attendance: {
      label: t('chart_tooltip_label'),
      color: '#2563eb',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('export_reports')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('meeting_attendance')}</CardTitle>
          <CardDescription>{t('meeting_attendance_desc')}</CardDescription>
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
