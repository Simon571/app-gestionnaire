export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app-gestionnaire.vercel.app';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/moi/', '/publisher-app/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
