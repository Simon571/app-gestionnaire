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
    NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL: 'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.3/Gestionnaire.d.Assemblee_1.0.3_x64_en-US.msi',
    NEXT_PUBLIC_ANDROID_DOWNLOAD_URL: 'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.3/app-release.apk'
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