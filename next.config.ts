import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const isStaticExport = process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  ...(isStaticExport ? { output: 'export' } : {}),

  images: {
    unoptimized: true,
  },
  typescript: {
    // ⚠️ Vérifie les erreurs TypeScript pendant le build
    ignoreBuildErrors: false,
  },
  eslint: {
    // ⚠️ Vérifie les warnings ESLint pendant le build
    ignoreDuringBuilds: false,
  },
  
  // Désactivé pour éviter les problèmes avec les API routes
  // trailingSlash: true,
};

export default withNextIntlConfig(nextConfig);