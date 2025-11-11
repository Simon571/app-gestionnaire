'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Loader2, Home, Building2, Users, CalendarDays, Map, Smartphone, User, FileText, Settings, CircleHelp } from 'lucide-react';
import { navItems as appNavItems } from '@/lib/nav-data';
import { cn } from '@/lib/utils';

const ICON_SIZE = 30;
const ICON_STROKE = 2.8;

// MODIFICATION: Le bouton utilise maintenant useTransition pour un retour visuel immédiat
function IconBtn({
  href, label, active, children,
}: {
  href: string; label: string; active?: boolean; children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.push(href))}
      aria-label={label}
      title={label}
      aria-busy={isPending}
      disabled={isPending}
      className={cn(
        "relative inline-grid place-items-center w-14 h-14 rounded-xl transition outline-offset-2",
        active
          ? "ring-1 ring-yellow-400 bg-yellow-400/20 text-white"
          : "text-white/90 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-yellow-400",
        "disabled:cursor-progress disabled:opacity-80"
      )}
    >
      <span className={cn(isPending && 'opacity-0')}>
        {React.isValidElement(children) ? React.cloneElement(children, { size: ICON_SIZE, strokeWidth: ICON_STROKE } as React.Attributes) : children}
      </span>
      {isPending && (
        <Loader2 className="absolute animate-spin text-yellow-400" size={22} strokeWidth={2.8}/>
      )}
    </button>
  );
}

function Divider() {
  return <div className="my-2 h-px w-10 rounded-full bg-white/25" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPathActive = (path: string) => {
    if (path === '/') return pathname === path;
    const cleanPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    return cleanPathname.startsWith(path);
  };

  const mainGroupHrefs = ['/', '/assembly', '/personnes', '/programme', '/territories', '/publisher-app'];
  const navItems = appNavItems.map(item => ({ ...item, href: item.href || '' }));
  const mainGroup = navItems.filter(item => mainGroupHrefs.includes(item.href));
  const reportsItem = navItems.find(item => item.href === '/reports');
  
  const secondaryGroup = [
    { href: '/moi', label: 'Moi', icon: User },
    reportsItem,
    { href: '/parametres', label: 'Paramètres', icon: Settings }
  ].filter(Boolean) as { href: string; label: string; icon: React.ElementType; }[];

  return (
    <>
  <aside className="fixed left-0 top-0 z-40 h-[100dvh] w-16 border-r border-white/10 bg-gradient-to-b from-cyan-400 via-sky-500 to-sky-700 text-white backdrop-blur no-print">
        <nav className="app-shell-nav flex h-full flex-col items-center py-5">
          <div className="flex flex-col items-center gap-6 pt-1">
            {mainGroup.map(item => (
              <IconBtn key={item.id} href={item.href} label={item.label} active={isPathActive(item.href)}>
                <item.icon />
              </IconBtn>
            ))}
          </div>
          <Divider />
          <div className="flex flex-col items-center gap-6">
            {secondaryGroup.map(item => (
              <IconBtn key={item.href} href={item.href} label={item.label} active={isPathActive(item.href)}>
                <item.icon />
              </IconBtn>
            ))}
          </div>
          <div className="mt-auto" />
          <Divider />
          <div className="pb-4">
            <IconBtn href="/help" label="Aide">
              <CircleHelp />
            </IconBtn>
          </div>
        </nav>
      </aside>

      <div className="ml-16">
  <header className="sticky top-0 z-30 flex h-14 items-center border-b border-white/10 bg-gradient-to-r from-cyan-400 via-sky-500 to-sky-700 text-white shadow-md no-print">
          <div className="w-full px-4 sm:px-6">
            <h1 className="text-xl font-semibold tracking-wide">
              Gestionnaire d’Assemblée
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">{children}</main>
      </div>
    </>
  );
}
