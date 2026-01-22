
import DashboardEntry from "@/components/dashboard/dashboard-entry";
import { DownloadPortal } from "@/components/marketing/download-portal";

export { generateStaticParams } from './generateStaticParams';

export default function Home() {
  const isPortal = process.env.NEXT_PUBLIC_PORTAL_MODE === '1';

  if (isPortal) {
    return <DownloadPortal />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <DashboardEntry />
    </div>
  );
}
