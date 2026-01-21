import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Télécharger Gestionnaire d\'Assemblée | Application Windows Gratuite',
  description: 'Téléchargez gratuitement le Gestionnaire d\'Assemblée pour Windows. Solution complète pour gérer votre assemblée de Témoins de Jéhovah : planification, rapports, territoires et plus encore.',
  keywords: [
    'gestionnaire assemblée',
    'Témoins de Jéhovah',
    'application Windows',
    'gestion assemblée',
    'planification',
    'rapports prédication',
    'territoires',
    'gratuit',
    'télécharger'
  ],
  authors: [{name: 'Gestionnaire d\'Assemblée'}],
  openGraph: {
    title: 'Télécharger Gestionnaire d\'Assemblée',
    description: 'Solution complète pour gérer votre assemblée. Gratuit et sécurisé.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Gestionnaire d\'Assemblée',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Télécharger Gestionnaire d\'Assemblée',
    description: 'Solution complète pour gérer votre assemblée. Gratuit et sécurisé.',
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
};

export default metadata;
