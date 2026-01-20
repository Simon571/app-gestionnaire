import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { PeopleProvider } from '@/context/people-context';
import { AppSettingsProvider } from '@/context/app-settings-context';
import RouteProgress from '@/components/RouteProgress';
import { ptSans } from '@/lib/fonts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app-gestionnaire.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Admin d\'Assemblée - Gestionnaire de Réunions',
  description: 'Application de gestion complète pour les assemblées de Témoins de Jéhovah',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Gestionnaire d\'Assemblée',
    title: 'Gestionnaire d\'Assemblée',
    description: 'Application de gestion complète pour les assemblées de Témoins de Jéhovah',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestionnaire d\'Assemblée',
    description: 'Application de gestion complète pour les assemblées de Témoins de Jéhovah',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Admin d\'Assemblée',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isPortal = process.env.NEXT_PUBLIC_PORTAL_MODE === '1';

  return (
    <html lang="fr" suppressHydrationWarning className={ptSans.variable}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1E40AF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Admin d'Assemblée" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        {/* ✅ Police PT Sans maintenant chargée via next/font (plus rapide, pas de connexion Google) */}
      </head>
      <body className={ptSans.className}>
          <RouteProgress />
          <PeopleProvider>
            <AppSettingsProvider>
              {isPortal ? children : <AppShell>{children}</AppShell>}
            </AppSettingsProvider>
          </PeopleProvider>
        <Toaster />
      </body>
    </html>
  );
}