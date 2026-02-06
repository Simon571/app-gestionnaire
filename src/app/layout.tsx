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
  title: {
    default: 'Gestionnaire d\'Assemblée - Application de Gestion pour Congrégations',
    template: '%s | Gestionnaire d\'Assemblée',
  },
  description: 'Application complète de gestion pour les assemblées de Témoins de Jéhovah : organisation des réunions, gestion des territoires, prédication, rapports et communication. Gratuit et disponible sur Windows.',
  keywords: ['gestionnaire assemblée', 'témoin jéhovah', 'gestion congrégation', 'organisation réunions', 'territoires prédication', 'application windows', 'software témoins', 'meeting scheduler', 'congregation manager'],
  authors: [{ name: 'Simon Nzamba' }],
  creator: 'Simon Nzamba',
  publisher: 'Simon Nzamba',
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US'],
    url: siteUrl,
    siteName: 'Gestionnaire d\'Assemblée',
    title: 'Gestionnaire d\'Assemblée - Application de Gestion pour Congrégations',
    description: 'Application complète de gestion pour les assemblées : réunions, territoires, prédication, rapports. Gratuit sur Windows.',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Gestionnaire d\'Assemblée Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestionnaire d\'Assemblée',
    description: 'Application complète de gestion pour les assemblées : réunions, territoires, prédication, rapports. Gratuit sur Windows.',
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
        <link rel="canonical" href={siteUrl} />
        <meta name="theme-color" content="#1E40AF" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gestionnaire d'Assemblée" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        {/* ✅ Police PT Sans maintenant chargée via next/font (plus rapide, pas de connexion Google) */}
        {/* Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Gestionnaire d'Assemblée",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Windows",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Application complète de gestion pour les assemblées : réunions, territoires, prédication, rapports.",
              "url": siteUrl,
              "downloadUrl": `${siteUrl}/fr/download`,
              "screenshot": `${siteUrl}/icons/icon-512x512.png`,
              "author": {
                "@type": "Person",
                "name": "Simon Nzamba"
              },
              "inLanguage": ["fr-FR", "en-US"]
            })
          }}
        />
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