import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const nextConfig: NextConfig = {
  /* Configuration pour build Tauri - export (frontend statique) */
  output: 'export',
  
  // L'app desktop communique avec le backend Vercel pour les API
  // Pas besoin de serveur local car tout passe par NEXT_PUBLIC_API_URL
  
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
