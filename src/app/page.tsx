'use client';

import { useEffect } from 'react';

export default function RootRedirect() {
  useEffect(() => {
    const lang = navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
    window.location.replace(`/${lang}/`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Chargement...</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirection vers la page d'accueil.</p>
      </div>
    </main>
  );
}
