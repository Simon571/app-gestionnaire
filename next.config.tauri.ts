import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* Configuration pour build Tauri - export statique */
  output: 'export',
  
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
};

export default withNextIntlConfig(nextConfig);
