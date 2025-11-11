import React from 'react';
import { useTranslations } from 'next-intl';

type Breadcrumb = { label: string; href?: string };

export default function AppHeader({
  appName,
  moduleTitle,
  breadcrumbs = [],
  actionsRight,
}: {
  appName: string;
  moduleTitle?: string;
  breadcrumbs?: Breadcrumb[];
  actionsRight?: React.ReactNode;
}) {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-20 bg-blue-600 text-white" style={{height: 64}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold" title={appName}>{appName}</span>
          </div>
          <div className="flex items-center gap-3">
            {actionsRight}
          </div>
        </div>
      </div>
    </header>
  );
}
