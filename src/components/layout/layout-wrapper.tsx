'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
const DESKTOP_SESSION_KEY = 'gestionnaire_desktop_session';

export function LayoutWrapper({ children, isPortal }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isDesktopEntry = pathname === '/desktop' || pathname.startsWith('/desktop/');
  const [hasAdminSession, setHasAdminSession] = useState(false);
  const [hasDesktopSession, setHasDesktopSession] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // L'entrée /desktop active l'interface complète pour toute la session du MSI.
    // sessionStorage conserve ce mode lors des navigations et actualisations,
    // sans modifier durablement l'expérience du portail web public.
    if (isDesktopEntry) {
      sessionStorage.setItem(DESKTOP_SESSION_KEY, '1');
      setHasDesktopSession(true);
    } else {
      setHasDesktopSession(sessionStorage.getItem(DESKTOP_SESSION_KEY) === '1');
    }

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
  }, [isDesktopEntry]);

  // Avant le chargement côté client, on affiche juste les enfants (pas de layout shift)
  if (!isLoaded) {
    return <>{children}</>;
  }

  // Le mode bureau reste actif sur tous les modules ouverts depuis le MSI.
  if (hasDesktopSession || hasAdminSession) {
    return <AppShell>{children}</AppShell>;
  }

  // Sinon: respecter la config isPortal
  if (isPortal) {
    return <>{children}</>;
  }

  // Mode local: afficher AppShell
  return <AppShell>{children}</AppShell>;
}
