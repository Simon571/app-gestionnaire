// i18n configuration for the app.
// Exports the supported locales, human-readable locale names and a
// `pathnames` map used by `createLocalizedPathnamesNavigation`.

export const locales = ['en', 'fr'] as const;

export const localeNames: Record<string, string> = {
  en: 'English',
  fr: 'Français',
};

// Minimal pathnames map. Fill with your localized routes as needed.
export const pathnames: Record<string, Record<string, string>> = {
  // Example:
  // '/territories': { en: '/territories', fr: '/territoires' }
};

export default { locales, localeNames, pathnames };