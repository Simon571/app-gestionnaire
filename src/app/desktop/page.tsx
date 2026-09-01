'use client';

import DashboardEntry from '@/components/dashboard/dashboard-entry';

export default function DesktopPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <DashboardEntry />
    </div>
  );
}
