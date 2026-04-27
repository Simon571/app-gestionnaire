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

  // Variables d'environnement intégrées au build
  env: {
    NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL: 'https://drive.google.com/uc?export=download&confirm=t&id=1me3PNMlrzFFulQQffH8we0jaGz9cSfBY',
    NEXT_PUBLIC_ANDROID_DOWNLOAD_URL: 'https://drive.google.com/uc?export=download&confirm=t&id=1bZeZ-pPa9-dJ4fEOA3-akzjEmjEso9Ri'
  },

  // CORS pour l'app MSI (Tauri) qui appelle Vercel depuis tauri://localhost
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  images: {
    unoptimized: true,
  },
  typescript: {
    // ⚠️ Vérifie les erreurs TypeScript pendant le build
    ignoreBuildErrors: false,
  },

  eslint: {
    // Ignorer les warnings ESLint pour permettre la build
    ignoreDuringBuilds: true,
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