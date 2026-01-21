import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* Configuration pour build Tauri - export statique */
  output: 'export',
  
  // Images non optimisées pour export statique
  images: {
    unoptimized: true,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Trailing slash pour cohérence des routes
  trailingSlash: true,
};

export default withNextIntlConfig(nextConfig);
