import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['fr', 'en'],

  // Used when no locale matches
  defaultLocale: 'fr',

  // Le préfixe de locale est toujours présent (/fr/... ou /en/...)
  // Les pages de l'app (/personnes, /assembly, etc.) sont hors de [locale]
  // et ne passent pas par ce middleware grâce au matcher ci-dessous
  localePrefix: 'always'
});

export const config = {
  // On n'intercepte QUE la racine et les chemins avec préfixe locale (/fr/... /en/...)
  // Les routes de l'app (/personnes, /assembly, /programme, etc.) sont exclues
  // et routent directement vers src/app/[name]/page.tsx sans interférence
  matcher: ['/', '/(fr|en)/:path*'],
};