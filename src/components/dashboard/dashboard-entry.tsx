'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingState = () => (
  <div className="space-y-6">
    <Skeleton className="h-48 w-full rounded-3xl" />
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  </div>
);

const DynamicDashboard = dynamic(() => import('@/components/dashboard/dynamic-dashboard'), {
  ssr: false,
  loading: LoadingState,
});

export default function DashboardEntry() {
  return (
    <div className="space-y-6">
      <DynamicDashboard />
    </div>
  );
}
