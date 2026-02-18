import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{locale: 'fr'}, {locale: 'en'}];
}

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
