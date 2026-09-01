import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
const locales = ['en', 'fr'];

const DEFAULT_LOCALE = 'fr';

export default getRequestConfig(async (params: any) => {
  const requested: string | undefined = params?.locale;

  // Les modules de l'application (/settings, /publishers, …) vivent hors du
  // segment [locale] : le middleware ne leur attribue donc aucune locale et
  // `params.locale` est indefini. Auparavant on appelait `notFound()` dans ce
  // cas, ce qui faisait repondre 404 a toute page hors [locale] appelant
  // `getTranslations()` — la page etait meme prerendue en 404 au build.
  // On retombe desormais sur la locale par defaut.
  const locale = requested ?? DEFAULT_LOCALE;

  // Une locale explicitement fournie mais non supportee reste une 404 : c'est
  // une URL qui n'existe pas, et non un module non localise.
  if (!locales.includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
