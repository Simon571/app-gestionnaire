import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* Configuration pour build Tauri - SERVEUR NEXT.JS (pas export statique) */
  // output: 'export' supprimé car nous avons besoin des API routes
  
  // Images non optimisées pour l'environnement local
  images: {
    unoptimized: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Ignorer les warnings ESLint pour permettre une build réussie
    ignoreDuringBuilds: true,
  },
  
  // Trailing slash pour cohérence des routes
  trailingSlash: true,
  
  // Activer le mode standalone pour bundler avec Tauri
  output: 'standalone',
};

export default withNextIntlConfig(nextConfig);
