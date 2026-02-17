import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';
import path from 'path';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const isStaticExport = process.env.NEXT_EXPORT === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  ...(isStaticExport ? { output: 'export' } : {}),

  // Inclure les fichiers data/ dans le bundle des fonctions serverless Vercel
  outputFileTracingIncludes: {
    '/api/**': ['./data/**'],
  },

  images: {
    unoptimized: true,
  },
  typescript: {
    // ⚠️ Vérifie les erreurs TypeScript pendant le build
    ignoreBuildErrors: false,
  },

  webpack: (config) => {
    if (isStaticExport) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@/ai/flows/assistant-flow': path.resolve(__dirname, 'src/ai/flows/assistant-flow.export.ts'),
        '@/ai/flows/tts-flow': path.resolve(__dirname, 'src/ai/flows/tts-flow.export.ts'),
      };
    }
    return config;
  },
  
  // Désactivé pour éviter les problèmes avec les API routes
  // trailingSlash: true,
};

export default withNextIntlConfig(nextConfig);