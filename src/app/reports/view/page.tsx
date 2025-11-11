'use client';

import dynamic from 'next/dynamic';

const ReportClientPage = dynamic(
  () => import('./report-client-page'),
  { ssr: false }
);

export default function ReportsPage() {
  return <ReportClientPage />;
}