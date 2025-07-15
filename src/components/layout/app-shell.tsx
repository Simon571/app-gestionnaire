
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Home,
  Users,
  Map,
  BarChart3,
  Settings,
  Church,
  Info,
  Share2,
  Calendar,
  BookUser,
  UsersRound,
  ChevronRight,
  FilePlus2,
  ClipboardList,
  FileText,
  UserPlus,
  CalendarDays,
  MessageSquare,
  House,
  Mic,
  PersonStanding,
  DoorOpen,
  Waves,
  Wrench,
  Sparkles,
  Wind,
  Briefcase,
  UserCheck,
  Smartphone,
  Upload,
  Download,
  CheckSquare,
  BarChart2,
  User,
  ListChecks,
  Handshake,
  BellRing,
  Settings2,
  CloudDownload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  isCollapsible?: boolean;
  subItems?: NavItem[];
  isMainItem?: boolean;
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const [openSections, setOpenSections] = React.useState({
    assembly: false,
    personnes: false,
    programme: false,
    publisherApp: false,
    moi: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({...prev, [section]: !prev[section]}));
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, href: '/', isMainItem: true },
    {
      id: 'assembly',
      label: 'Assemblée',
      icon: Church,
      isCollapsible: true,
      isMainItem: true,
      subItems: [
        { id: 'assembly-info', label: 'Information de l’assemblée', icon: Info, href: '/parametres' },
        { id: 'assembly-sharing', label: 'Partage de l’assemblée', icon: Share2, href: '/partage' },
        { id: 'bulletin', label: 'Tableau d’affichage', icon: ClipboardList, href: '/communications' },
        { id: 'events', label: 'Evénements de l’assemblée', icon: Calendar, href: '/evenements' },
        { id: 'preaching-activity', label: 'Activité de prédication (S-1)', icon: FileText, href: '/activite-predication' },
        { id: 'groups-families', label: 'Groupes et familles', icon: Users, href: '/groupes-familles' },
        { id: 'circuits-speakers', label: 'Circonscriptions & Orateurs', icon: BookUser, href: '/circonscriptions-orateurs' },
        { id: 'meeting-attendance', label: 'Assistance aux réunions', icon: BarChart3, href: '/rapports' },
        { id: 'responsibilities', label: 'Responsabilités', icon: UsersRound, href: '/responsabilites' },
      ]
    },
    {
        id: 'personnes',
        label: "Personnes",
        icon: Users,
        isCollapsible: true,
        isMainItem: true,
        href: '/personnes',
        subItems: [
          { id: 'add-person', label: "Ajouter une personne", icon: UserPlus, href: '/personnes' },
        ]
    },
    {
      id: 'programme',
      label: 'Programme',
      icon: CalendarDays,
      isCollapsible: true,
      isMainItem: true,
      href: '/programme',
      subItems: [
        { id: 'reunion-vie-ministere', label: 'Réunion Vie et ministère', icon: MessageSquare, href: '/programme/reunion-vie-ministere' },
        { id: 'besoins-assemblee', label: 'Besoins de l’assemblée', icon: House, href: '/programme/besoins-assemblee' },
        { id: 'discours-publics-local', label: 'Discours publics - Local', icon: Mic, href: '/programme/discours-publics-local' },
        { id: 'discours-publics-exterieur', label: 'Discours publics - Extérieur', icon: PersonStanding, href: '/programme/discours-publics-exterieur' },
        { id: 'predication', label: 'Prédication', icon: DoorOpen, href: '/programme/predication' },
        { id: 'temoignage-public', label: 'Témoignage public', icon: Waves, href: '/programme/temoignage-public' },
        { id: 'services', label: 'Services', icon: Wrench, href: '/programme/services' },
        { id: 'nettoyage', label: 'Nettoyage', icon: Sparkles, href: '/programme/nettoyage' },
        { id: 'entretien-espaces-verts', label: 'Entretien des espaces verts', icon: Wind, href: '/programme/entretien-espaces-verts' },
        { id: 'maintenance', label: 'Maintenance', icon: Briefcase, href: '/programme/maintenance' },
        { id: 'visite-responsable-circonscription', label: 'Visite du responsable de circonscription', icon: UserCheck, href: '/programme/visite-responsable-circonscription' },
      ]
    },
     {
      id: 'publisherApp',
      label: 'Publisher App',
      icon: Smartphone,
      isCollapsible: true,
      isMainItem: true,
      href: '/publisher-app',
      subItems: [
        { id: 'send-data', label: 'Envoyer les données', icon: Upload, href: '/publisher-app/send-data' },
        { id: 'receive-data', label: 'Recevoir les données', icon: Download, href: '/publisher-app/receive-data' },
        { id: 'users', label: 'Utilisateurs', icon: Users, href: '/publisher-app/users' },
        { id: 'devices', label: 'Appareils', icon: Smartphone, href: '/publisher-app/devices' },
        { id: 'app-settings', label: "Paramètres de l'application", icon: CheckSquare, href: '/publisher-app/settings' },
        { id: 'logs', label: 'Journaux', icon: BarChart2, href: '/publisher-app/logs' },
      ]
    },
    {
      id: 'moi',
      label: 'Moi',
      icon: User,
      isCollapsible: true,
      isMainItem: true,
      href: '/moi',
      subItems: [
        { id: 'tasks', label: 'Tâches', icon: ListChecks, href: '/moi/taches' },
        { id: 'subscription', label: 'Abonnement', icon: Handshake, href: '/moi/abonnement' },
        { id: 'alerts', label: 'Voir les alertes', icon: BellRing, href: '/moi/alertes' },
        { id: 'my-settings', label: 'Paramètres', icon: Settings2, href: '/moi/parametres' },
        { id: 'updates', label: 'Mises à jour', icon: CloudDownload, href: '/moi/mises-a-jour' },
      ]
    },
    { id: 'logger', label: 'Assistant IA', icon: FilePlus2, href: '/logger' },
  ];

  const settingsNav = [{ href: '/parametres', label: 'Paramètres', icon: Settings }];
  
  const getPageTitle = () => {
    const allItems: NavItem[] = navItems.flatMap(item => item.isCollapsible ? (item.subItems ? [item, ...item.subItems] : [item]) : [item]);
    
    if (pathname === '/') {
        return 'Tableau de bord';
    }

    const currentItem = allItems.slice().reverse().find((item) => item.href && item.href !== '/' && pathname.startsWith(item.href));
    
    if (currentItem) return currentItem.label;

    const currentGroup = allItems.find(item => item.isCollapsible && pathname.startsWith(item.href || ''));
    if(currentGroup) return currentGroup.label;

    return 'Tableau de bord';
  }


  return (
    <SidebarProvider>
      <Sidebar className="bg-sidebar border-r">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Church className="size-5 text-primary" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              Gestionnaire d'Assemblée
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              item.isCollapsible ? (
                <Collapsible key={item.id} open={openSections[item.id as keyof typeof openSections]} onOpenChange={() => toggleSection(item.id as keyof typeof openSections)} className="w-full">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                       <SidebarMenuButton className={cn(
                          "w-full",
                          item.isMainItem && "text-lg font-semibold h-12 [&_svg]:size-6"
                       )}
                       isActive={item.href && pathname.startsWith(item.href) && (!item.subItems || item.subItems.every(sub => !pathname.startsWith(sub.href || '#')))}>
                          <item.icon />
                          <span>{item.label}</span>
                          <ChevronRight className={cn(
                              "ml-auto h-4 w-4 transition-transform duration-200",
                              openSections[item.id as keyof typeof openSections] && "rotate-90"
                          )} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenu className="ml-[18px] mt-2 space-y-1 border-l-2 border-sidebar-border/50 py-2 pl-4">
                      {item.subItems?.map((subItem) => (
                        <SidebarMenuItem key={subItem.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={subItem.href !== '/' && subItem.href && pathname.startsWith(subItem.href)}
                            tooltip={subItem.label}
                          >
                            <Link href={subItem.href as any}>
                              <subItem.icon />
                              <span>{subItem.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                     className={cn(
                        item.isMainItem && "text-lg font-semibold h-12 [&_svg]:size-6"
                     )}
                  >
                    <Link href={item.href as any}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            {settingsNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="person avatar"/>
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-sm">
                        <span className="font-semibold text-sidebar-foreground">Utilisateur Admin</span>
                        <span className="text-muted-foreground text-xs">admin@example.com</span>
                    </div>
                </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {getPageTitle()}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
