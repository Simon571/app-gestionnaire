'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Users,
  Map,
  CalendarCheck,
  BarChart3,
  Activity,
  Sparkles,
  ArrowUpRight,
  ClipboardEdit,
  FileBarChart,
  PieChart,
} from 'lucide-react';

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      type: 'spring',
      stiffness: 140,
      damping: 18,
    },
  }),
};

const shimmerTransition = {
  ease: 'linear',
  duration: 4.5,
  repeat: Infinity,
};

export function DynamicDashboard() {
  const stats = useMemo(
    () => [
      {
        title: 'Proclamateurs actifs',
        value: '147',
        delta: '+5 ce mois-ci',
        icon: Users,
        accent: 'from-sky-500/30 via-sky-500/10 to-sky-500/0',
      },
      {
        title: 'Territoires en cours',
        value: '12 / 45',
        delta: '27% à suivre',
        icon: Map,
        accent: 'from-emerald-500/30 via-emerald-500/10 to-emerald-500/0',
      },
      {
        title: 'Présence moyenne',
        value: '93%',
        delta: 'Objectif dépassé',
        icon: CalendarCheck,
        accent: 'from-violet-500/30 via-violet-500/10 to-violet-500/0',
      },
      {
        title: 'Taux de rapports reçus',
        value: '89%',
        delta: '+8% vs dernier mois',
        icon: BarChart3,
        accent: 'from-amber-500/30 via-amber-500/10 to-amber-500/0',
      },
    ],
    []
  );

  const coverage = useMemo(
    () => [
      {
        title: 'Assignations couvertes',
        value: 0.89,
        description: '89 assignations validées sur 100 planifiées.',
        accent: 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent',
      },
      {
        title: 'Territoires revisités',
        value: 0.62,
        description: '38 territoires prêts pour une nouvelle campagne.',
        accent: 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent',
      },
      {
        title: 'Activités jeunes proclamateurs',
        value: 0.74,
        description: 'Participation soutenue des nouveaux proclamateurs.',
        accent: 'bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent',
      },
    ],
    []
  );

  const attendanceTrend = useMemo(
    () => [
      { mois: 'Jan', presence: 82, objectif: 90 },
      { mois: 'Fév', presence: 85, objectif: 90 },
      { mois: 'Mar', presence: 87, objectif: 90 },
      { mois: 'Avr', presence: 88, objectif: 90 },
      { mois: 'Mai', presence: 91, objectif: 90 },
      { mois: 'Juin', presence: 92, objectif: 90 },
      { mois: 'Juil', presence: 93, objectif: 90 },
    ],
    []
  );

  const chartConfig: ChartConfig = {
    presence: {
      label: 'Présence moyenne',
      color: 'hsl(var(--chart-1))',
    },
    objectif: {
      label: 'Objectif',
      color: 'hsl(var(--chart-3))',
    },
  };

  const recentActivities = useMemo(
    () => [
      {
        id: '1',
        title: 'Territoire 18 terminé',
        description: 'Léa Dubois a remis le rapport détaillé avec photos à jour.',
        time: 'Il y a 12 minutes',
        icon: Map,
        accent: 'text-emerald-500',
      },
      {
        id: '2',
        title: 'Session jeunes proclamateurs',
        description: 'Atelier interactif confirmé pour le 15 décembre.',
        time: 'Il y a 32 minutes',
        icon: Activity,
        accent: 'text-sky-500',
      },
      {
        id: '3',
        title: 'Discours du week-end',
        description: 'Assignation envoyée à Frère Martin avec rappels automatiques activés.',
        time: 'Il y a 1 heure',
        icon: ClipboardEdit,
        accent: 'text-violet-500',
      },
    ],
    []
  );

  const quickActions = useMemo(
    () => [
      {
        label: 'Planifier une réunion',
        href: '/evenements/nouveau',
        icon: CalendarCheck,
        gradient: 'from-sky-500 to-blue-500',
      },
      {
        label: 'Nouveau proclamateur',
        href: '/personnes/nouveau',
        icon: Users,
        gradient: 'from-emerald-500 to-lime-500',
      },
      {
        label: 'Suivi des territoires',
        href: '/territories',
        icon: Map,
        gradient: 'from-amber-500 to-orange-500',
      },
      {
        label: 'Rapports mensuels',
        href: '/reports',
        icon: FileBarChart,
        gradient: 'from-violet-500 to-fuchsia-500',
      },
    ],
    []
  );

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-slate-950/10 to-primary/0 p-8 shadow-lg">
        <motion.div
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_55%)]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={shimmerTransition}
        />
        <motion.div
          className="absolute -right-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={shimmerTransition}
        />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="inline-flex items-center gap-2 bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Intéractions en direct
            </Badge>
            <motion.h1
              className="text-3xl font-semibold leading-tight sm:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
            >
              Tableau de bord dynamique
            </motion.h1>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              Visualisez l&apos;activité de l&apos;assemblée en temps réel, suivez la progression des territoires et prenez des décisions éclairées grâce à un rendu riche et animé.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="gap-2">
                <Link href="/programme">
                  Explorer le programme
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/40 text-primary">
                <Link href="/reports">
                  Voir les rapports
                </Link>
              </Button>
            </div>
          </div>
          <motion.div
            className="grid w-full grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 backdrop-blur lg:max-w-sm"
            initial="hidden"
            animate="visible"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4"
                  variants={statVariants}
                  custom={index}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-semibold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.delta}
                      </p>
                    </div>
                    <span className="rounded-full bg-background/70 p-2 text-primary shadow-inner">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tendance de présence</CardTitle>
              <CardDescription>
                Comparatif entre l&apos;objectif fixé et la présence réelle sur les 7 derniers mois.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary">
              +11% depuis janvier
            </Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <AreaChart data={attendanceTrend} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id="presenceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="presence"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#presenceGradient)"
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="objectif"
                  stroke="hsl(var(--chart-3))"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  fill="transparent"
                  activeDot={{ r: 4 }}
                />
                <ChartLegend
                  verticalAlign="top"
                  content={<ChartLegendContent className="pt-0" />}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progressions clés</CardTitle>
            <CardDescription>Mise à jour automatique toutes les 30 minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {coverage.map((item) => (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="font-mono text-sm text-muted-foreground">
                    {(item.value * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full ${item.accent}`}
                    initial={{ width: '0%' }}
                    whileInView={{ width: `${Math.round(item.value * 100)}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
            <CardDescription>Suivi instantané des actions clés de l&apos;assemblée.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-2xl border border-border/40 bg-card/70 p-4 backdrop-blur"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                  >
                    <span className={`rounded-full bg-background/80 p-3 shadow-inner ${activity.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground/80">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accès direct aux sections les plus utilisées.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-2xl border border-border/40 bg-card/70 p-3"
                >
                  <Button asChild variant="ghost" className="h-auto w-full justify-between gap-3 px-3 py-4 text-left">
                    <Link href={action.href} className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-xl bg-gradient-to-br ${action.gradient} p-2.5 text-white shadow-inner`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">{action.label}</span>
                      </div>
                      <PieChart className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default DynamicDashboard;
