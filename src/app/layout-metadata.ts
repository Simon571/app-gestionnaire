import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://votre-domaine.vercel.app'),
  title: {
    default: 'Gestionnaire d\'Assemblée | Application de gestion pour Témoins de Jéhovah',
    template: '%s | Gestionnaire d\'Assemblée'
  },
  description: 'Solution complète et gratuite pour gérer votre assemblée de Témoins de Jéhovah. Planification VCM, rapports, territoires, et bien plus encore.',
  keywords: [
    'gestionnaire assemblée',
    'Témoins de Jéhovah',
    'JW',
    'organisation',
    'planification',
    'VCM',
    'rapports prédication',
    'territoires',
    'gratuit'
  ],
  authors: [{name: 'Gestionnaire d\'Assemblée'}],
  creator: 'Gestionnaire d\'Assemblée',
  publisher: 'Gestionnaire d\'Assemblée',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://votre-domaine.vercel.app',
    siteName: 'Gestionnaire d\'Assemblée',
    title: 'Gestionnaire d\'Assemblée',
    description: 'Solution complète pour gérer votre assemblée de Témoins de Jéhovah',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gestionnaire d\'Assemblée',
    description: 'Solution complète pour gérer votre assemblée de Témoins de Jéhovah',
  },
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
  icons: {
    icon: '/icon-house.svg',
    shortcut: '/icon-house.svg',
    apple: '/icon-house.svg',
  },
  manifest: '/manifest.webmanifest',
};

export default metadata;
