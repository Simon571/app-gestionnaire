
'use client';

import { useEffect, useState } from 'react';
import DashboardEntry from "@/components/dashboard/dashboard-entry";
import { DownloadPortal } from "@/components/marketing/download-portal";

export default function Home() {
  const isPortal = process.env.NEXT_PUBLIC_PORTAL_MODE === '1';
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a une session admin
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.assemblyId || session.personId) {
          setHasAdminSession(true);
          console.log('✅ Session admin trouvée:', session.assemblyId ? 'Assemblée' : 'Personne');
        }
      } catch (e) {
        console.error('Erreur parsing session:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Si en cours de chargement, afficher un état vide
  if (!isLoaded) {
    return <div className="space-y-8"><h1 className="text-3xl font-semibold tracking-tight">Chargement...</h1></div>;
  }

  // Si l'utilisateur a une session, afficher le dashboard (même en mode portal)
  if (hasAdminSession) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
        <DashboardEntry />
      </div>
    );
  }

  // Sinon: si mode portal, afficher la page de téléchargement
  if (isPortal) {
    return <DownloadPortal />;
  }

  // Sinon: afficher le dashboard normal
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <DashboardEntry />
    </div>
  );
}
