
import * as React from 'react';
import {
  Home,
  Users,
  Map,
  BarChart3,
  Church,
  Info,
  Share2,
  Calendar,
  BookUser,
  UsersRound,
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

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  isCollapsible?: boolean;
  subItems?: NavItem[];
  isMainItem?: boolean;
};

export const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, href: '/', isMainItem: true },
    {
      id: 'assembly',
      label: 'Assemblée',
      icon: Church,
      isCollapsible: true,
      isMainItem: true,
      href: '/assembly',
      subItems: [
        { id: 'assembly-info', label: 'Information de l’assemblée', icon: Info, href: '/parametres' },
        { id: 'assembly-sharing', label: 'Partage de l’assemblée', icon: Share2, href: '/partage' },
        { id: 'bulletin', label: 'Tableau d’affichage', icon: ClipboardList, href: '/communications' },
        { id: 'events', label: 'Evénements de l’assemblée', icon: Calendar, href: '/evenements' },
        { id: 'preaching-activity', label: 'Activité de prédication (S-1)', icon: FileText, href: '/activite-predication' },
        { id: 'groups-families', label: 'Groupes et familles', icon: Users, href: '/groupes-familles' },
        { id: 'circuits-speakers', label: 'Circonscriptions & Orateurs', icon: BookUser, href: '/circonscriptions-orateurs' },
        { id: 'meeting-attendance', label: 'Assistance aux réunions', icon: BarChart3, href: '/reports' },
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
      id: 'territories',
      label: 'Territoires',
      icon: Map,
      href: '/territories',
      isMainItem: true
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
