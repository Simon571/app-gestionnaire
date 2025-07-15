import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from "@/components/ui/toaster";
import { PeopleProvider } from '@/context/people-context';

export const metadata: Metadata = {
  title: 'Local Assembly Manager',
  description: 'Manage activities of a local Christian congregation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body>
          <PeopleProvider>
            <AppShell>
              {children}
            </AppShell>
          </PeopleProvider>
        <Toaster />
      </body>
    </html>
  );
}
