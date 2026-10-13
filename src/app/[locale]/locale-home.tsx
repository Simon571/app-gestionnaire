'use client';

import { useEffect, useState } from 'react';
import DashboardEntry from "@/components/dashboard/dashboard-entry";

/**
 * Accueil de l'application installee (poste Windows).
 *
 * Ce composant n'est atteint que lorsque `NEXT_PUBLIC_PORTAL_MODE` vaut '0',
 * c'est-a-dire dans le build du poste de travail. Il n'y a pas de visiteur
 * anonyme a servir : l'application s'ouvre directement sur le tableau de bord.
 *
 * La verification de session reste faite dans le navigateur, car l'export
 * statique n'a pas de serveur pour la faire avant l'envoi de la page.
 */
export function LocaleHome() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Avant le chargement côté client, on affiche un état d'attente : le tableau
  // de bord lit des donnees locales que le rendu serveur ne connait pas.
  if (!isLoaded) {
    return <div className="space-y-8"><h1 className="text-3xl font-semibold tracking-tight">Chargement...</h1></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tableau de bord</h1>
      <DashboardEntry />
    </div>
  );
}