import type {NextConfig} from 'next';
import withNextIntl from 'next-intl/plugin';
import path from 'path';

const withNextIntlConfig = withNextIntl('./src/i18n.ts');

const isStaticExport = process.env.NEXT_EXPORT === 'true';

const isTauriBuild = process.env.NEXT_CONFIG === 'next.config.tauri.ts';

/**
 * Hebergement sur serveur propre (VPS) : `output: 'standalone'` produit dans
 * `.next/standalone` un serveur Node autonome, avec ses seules dependances
 * utiles. C'est ce que copie l'image Docker (`Dockerfile`), et c'est aussi ce
 * qui evite d'embarquer les 1,3 Go de `node_modules` sur le serveur.
 *
 * Distinct du build Tauri, qui utilise `standalone` avec son propre `distDir`.
 */
const isSelfHosted = process.env.NEXT_OUTPUT === 'standalone';

const nextConfig: NextConfig = {
  /* config options here */
  ...(isStaticExport
    ? { output: 'export' }
    : isTauriBuild
      ? { output: 'standalone', distDir: '.next-tauri' }
      : isSelfHosted
        ? { output: 'standalone' }
        : {}),

  // Inclure les fichiers data/ dans le bundle des fonctions serverless Vercel
  outputFileTracingIncludes: {
    '/api/**': ['./data/**'],
  },

  // Variables d'environnement intégrées au build
  env: {
    NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL: 'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.4/Gestionnaire.d.Assemblee_1.0.4_x64_en-US.msi',
    NEXT_PUBLIC_ANDROID_DOWNLOAD_URL: 'https://github.com/Simon571/app-gestionnaire/releases/download/v1.0.4/app-release.apk'
  },

  // La politique CORS est desormais geree par le middleware
  // (src/middleware-security.ts) avec une liste blanche d'origines, au lieu
  // d'un `Access-Control-Allow-Origin: *` applique a toutes les routes /api.
  // Un caractere generique ici ecraserait la liste blanche et reautoriserait
  // n'importe quelle origine.

  images: {
    unoptimized: true,
  },
  typescript: {
    // ⚠️ Vérifie les erreurs TypeScript pendant le build
    ignoreBuildErrors: false,
  },

  eslint: {
    // Les erreurs ESLint font echouer la build. Les avertissements (~560,
    // essentiellement `no-explicit-any` et variables inutilisees) ne bloquent
    // pas : seules les erreurs le font, ce qui evite qu'une regression comme un
    // `<a>` vers une route interne reparte en production.
    ignoreDuringBuilds: false,
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