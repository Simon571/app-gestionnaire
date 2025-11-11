import * as NextIntlNav from 'next-intl/navigation';
import {locales, pathnames} from './i18n-config';

// Use a safe any-wrapper to avoid type mismatches across next-intl versions.
const navAny: any = (NextIntlNav as any).createLocalizedPathnamesNavigation
  ? (NextIntlNav as any).createLocalizedPathnamesNavigation({ locales, pathnames })
  : { Link: (p: any) => p.children, redirect: () => {}, usePathname: () => '', useRouter: () => ({}) };

export const { Link, redirect, usePathname, useRouter } = navAny;