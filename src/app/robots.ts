export const dynamic = "force-static";

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app-gestionnaire.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/fr/', '/en/', '/fr/download', '/en/download'],
        disallow: [
          '/api/',
          '/admin/',
          '/moi/',
          '/publisher-app/',
          '/personnes',
          '/programme',
          '/territoires',
          '/rapports',
          '/assembly',
          '/circonscriptions-orateurs',
          '/vcm',
          '/downloads/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
