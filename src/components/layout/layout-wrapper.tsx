'use client';

import { useEffect, useState } from 'react';
import { AppShell } from './app-shell';

interface LayoutWrapperProps {
  children: React.ReactNode;
  isPortal: boolean;
}

/**
 * Décide intelligemment d'afficher AppShell ou pas.
 * Si l'utilisateur est connecté (admin_session), affiche AppShell même en mode portal.
 * Sinon, suit la config isPortal du serveur.
 */
export function LayoutWrapper({ children, isPortal }: LayoutWrapperProps) {
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
          console.log('✅ AppShell activé: Utilisateur connecté');
        }
      } catch (e) {
        console.error('Erreur parsing session:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Avant le chargement côté client, on affiche juste les enfants (pas de layout shift)
  if (!isLoaded) {
    return <>{children}</>;
  }

  // ✅ RÈGLE: Si connecté, toujours afficher AppShell (même en mode portal)
  // Sauf pour la page de téléchargement qui doit rester plein écran
  const isDownloadPage = typeof window !== 'undefined' && window.location.pathname.includes('/download');
  if (hasAdminSession && !isDownloadPage) {
    return <AppShell>{children}</AppShell>;
  }

  // Sinon: respecter la config isPortal
  if (isPortal) {
    return <>{children}</>;
  }

  // Mode local: afficher AppShell
  return <AppShell>{children}</AppShell>;
}
