'use client';

/**
 * use-session-role.ts
 * Role de l'utilisateur connecte, pour adapter l'interface.
 *
 * La source de verite est le serveur (`GET /api/auth/session`), qui lit le
 * cookie signe. `localStorage` sert uniquement de valeur d'affichage immediate,
 * le temps de la requete : il est modifiable par l'utilisateur et ne doit donc
 * jamais decider seul de ce qui est visible.
 *
 * Masquer un module n'est de toute facon qu'un confort : le refus effectif est
 * prononce par le middleware (`api-auth-policy`), qui renvoie 403
 * `publisher-read-only` sur toute modification hors du perimetre personnel.
 */
import { useEffect, useState } from 'react';
import { getApiBase } from '@/lib/api-base';

export type SessionRole =
  | 'super-admin'
  | 'assembly-admin'
  | 'elder'
  | 'servant'
  | 'publisher';

export interface SessionRoleState {
  role: SessionRole | null;
  displayName: string | null;
  /** Vrai tant que la reponse du serveur n'est pas arrivee. */
  loading: boolean;
  /** Vrai pour les roles qui administrent l'assemblee. */
  isAdmin: boolean;
}

const ADMIN_ROLES: SessionRole[] = ['super-admin', 'assembly-admin', 'elder', 'servant'];

function readCachedRole(): { role: SessionRole | null; displayName: string | null } {
  try {
    const raw = localStorage.getItem('admin_session');
    if (!raw) return { role: null, displayName: null };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Les sessions d'assemblee stockent `role`, celles de personne `function`.
    const value = String(parsed.role ?? parsed.function ?? '');
    const role = (ADMIN_ROLES as string[]).includes(value) || value === 'publisher'
      ? (value as SessionRole)
      : null;
    return { role, displayName: (parsed.displayName as string) ?? null };
  } catch {
    return { role: null, displayName: null };
  }
}

export function useSessionRole(): SessionRoleState {
  const [role, setRole] = useState<SessionRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = readCachedRole();
    if (initial.role) setRole(initial.role);
    if (initial.displayName) setDisplayName(initial.displayName);

    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`${getApiBase()}/api/auth/session`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (data?.session?.role) setRole(data.session.role as SessionRole);
        if (data?.session?.displayName) setDisplayName(data.session.displayName as string);
      } catch {
        // Hors ligne : on garde la valeur en cache, l'API tranchera de toute facon.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    displayName,
    loading,
    // Sans role connu on suppose l'administration : c'est le comportement
    // historique du MSI mono-poste, et l'API refuse de toute facon ce qui doit
    // l'etre.
    isAdmin: role === null || ADMIN_ROLES.includes(role),
  };
}
